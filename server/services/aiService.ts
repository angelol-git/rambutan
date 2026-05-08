import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { aiRecipeSchema } from "../validation/aiSchemas.js";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is not set");
}

const genAI = new GoogleGenAI({ apiKey });

// const model = "gemini-3-flash-preview";
const model = "gemini-3.1-flash-lite-preview";

type AiRecipe = z.infer<typeof aiRecipeSchema>;

export type ParsedAiRecipe = AiRecipe & {
  ai_model: string;
  source_prompt: string;
  relation?: "reply" | "fork";
  versionId?: number | bigint;
};

type AiValidationErrorType =
  | "empty_response"
  | "invalid_json"
  | "schema_validation_failed"
  | "empty_recipe";

type AiValidationIssue = {
  path: z.ZodIssue["path"];
  message: string;
  code: z.ZodIssue["code"];
};

export type AiValidationMeta = {
  type: AiValidationErrorType;
  source_prompt: string;
  ai_model?: string;
  rawResponse?: string;
  issues?: AiValidationIssue[];
};

type GenerateResponseResult = Awaited<ReturnType<typeof genAI.models.generateContent>>;

export function getModelName(): string {
  return model;
}

export class AiValidationError extends Error {
  meta: AiValidationMeta;

  constructor(message: string, meta: AiValidationMeta) {
    super(message);
    this.name = "AiValidationError";
    this.meta = meta;
  }
}

export async function generateResponse(
  prompt: string,
): Promise<GenerateResponseResult> {
  return genAI.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(aiRecipeSchema),
      temperature: 0.7,
    },
  });
}

function extractTextParts(response: GenerateResponseResult): string {
  if (!Array.isArray(response?.candidates)) {
    return "";
  }

  return response.candidates
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export function validateAiResponse(
  response: GenerateResponseResult,
  message: string,
): ParsedAiRecipe {
  let rawResponse = extractTextParts(response);

  if (!rawResponse) {
    throw new AiValidationError("The AI returned an empty response.", {
      type: "empty_response",
      source_prompt: message,
    });
  }

  if (rawResponse.startsWith("```")) {
    rawResponse = rawResponse
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```$/, "")
      .trim();
  }

  let parsedRecipe: unknown;
  try {
    parsedRecipe = JSON.parse(rawResponse) as unknown;
  } catch {
    throw new AiValidationError("Invalid JSON from AI", {
      type: "invalid_json",
      rawResponse,
      source_prompt: message,
      ai_model: model,
    });
  }

  let validatedRecipe: AiRecipe;
  try {
    validatedRecipe = aiRecipeSchema.parse(parsedRecipe);
  } catch (error) {
    throw new AiValidationError("AI response did not match recipe schema.", {
      type: "schema_validation_failed",
      rawResponse,
      source_prompt: message,
      ai_model: model,
      issues:
        error instanceof z.ZodError
          ? error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
              code: issue.code,
            }))
          : undefined,
    });
  }

  if (
    !validatedRecipe.title.trim() ||
    validatedRecipe.ingredients.length === 0 ||
    validatedRecipe.instructions.length === 0
  ) {
    throw new AiValidationError(
      "Recipe could not be generated from this input.",
      {
        type: "empty_recipe",
        rawResponse,
        source_prompt: message,
      },
    );
  }

  if (validatedRecipe.title.length > 150) {
    throw new AiValidationError("Recipe title is too long.", {
      type: "invalid_json",
      rawResponse,
      source_prompt: message,
      ai_model: model,
    });
  }

  return {
    ...validatedRecipe,
    ai_model: model,
    source_prompt: message,
  };
}

export function createPrompt(
  message: string,
  recipeVersion: unknown = {},
  urlContent: unknown = {},
): string {
  return `
    Parse the culinary input into a single JSON object matching the provided response schema.

    Role: Expert culinary data engineer and nutritionist.

    Primary task classification:
    - First classify the input as exactly one of:
      1. new_recipe_request
      2. recipe_modification
      3. recipe_url_import
      4. unrelated_or_insufficient
    - Only produce a populated recipe when the input clearly belongs to 1, 2, or 3.
    - If there is any reasonable doubt, classify it as unrelated_or_insufficient.

    Rules:
    - Preserve the original recipe's primary measurement style whenever possible.
    - For ingredient lines, dual units are the default expectation whenever the ingredient uses a measurable weight or volume. Format them as primary unit first, then the converted secondary unit in parentheses. Examples: "8 oz (225 g) butter", "1 cup (240 ml) milk", "1 lb (450 g) chicken", "2 tbsp (30 ml) olive oil".
    - When parsing an imported recipe from the original source, preserve the source unit first and add the converted secondary unit in parentheses when the source uses weight or volume and does not already include a useful dual unit.
    - When modifying, converting, scaling, or otherwise regenerating an existing recipe, keep or update ingredient quantities in dual-unit form for all weight- and volume-based ingredients instead of returning only one unit system.
    - Do not remove a useful existing secondary unit. If the source already includes dual units, preserve them unless scaling or substitution requires updating them.
    - Use rounded kitchen-friendly equivalents for the secondary unit, while keeping the primary quantity practical for cooks.
    - Count-based ingredients that do not need conversion, such as "2 eggs", "3 garlic cloves", or "1 onion", do not need a parenthetical second unit unless the conversion is genuinely useful.
    - Do not add a second unit when it would be misleading, overly precise, or unnatural for cooks, but for standard liquids, powders, dairy, fats, grains, sugars, meats, and produce sold by weight or volume, include dual units by default.
    - If URL data is provided, prioritize structured recipe data such as JSON-LD or recipe schema.
    - Return only valid JSON. No markdown. No conversational filler.
    - The title must be 150 characters or fewer.
    - Do not guess the user's intent from vague, short, generic, or placeholder text.
    - Do not invent a recipe just to satisfy the schema.

    Modification handling:
    - If Current State is provided, determine whether the user wants a modification or a new recipe.
    - Treat scaling, substitutions, dietary changes, flavor changes, and method changes as modifications unless the message clearly asks for a new recipe.
    - For scaling, adjust all ingredient quantities proportionally using: new servings / original servings.
    - Keep calories per serving constant when only scaling servings.
    - When scaling, recalculate total_time based on realistic elapsed cooking time, not a direct servings multiplier.
    - Scaling usually changes prep time more than cook time. Passive oven, simmering, resting, chilling, and marinating time often stays the same.
    - Only increase cook time when the larger quantity would realistically need longer to heat through, brown, reduce, or cook in multiple batches. When that happens, increase time modestly and conservatively.
    - If the scaled recipe would no longer fit in the same pot, pan, tray, or air fryer basket, account for extra batch or round time instead of simply multiplying the full recipe time.
    - Do not leave total_time unchanged by default when scaling. Re-estimate it from the method and equipment constraints.
    - Preserve the recipe's core identity unless the user explicitly asks to change it.
    - Update the title and description when a major modification was made.

    Relevancy guardrail:
    - If the user message is gibberish or unrelated to recipes, cooking, food, ingredients, or culinary topics, return an empty recipe with:
      title = ""
      description = ""
      ingredients = []
      instructions = []
      servings = null
      calories = null
      total_time = null
    - Also return the same empty recipe when the input is too weak to support a recipe request, including examples like:
      "test", "hello", "hi", "hey", "what's up", "asdf", "random", "123", or other short placeholder text.
    - A valid new recipe request should clearly mention a dish, ingredient, cuisine, cooking goal, dietary preference, meal type, or recipe intent.
    - A valid recipe modification should clearly refer to changing the Current State.
    - Never convert unrelated or ambiguous text into a plausible recipe.

    Missing data:
    - Infer servings if missing.
    - Infer total_time in minutes if missing.
    - Infer a conservative integer calories-per-serving estimate if missing.

    Context:
    User Message: "${message}"
    Extracted Web Data: ${urlContent || "None"}
    Current State: ${JSON.stringify(recipeVersion)}
  `;
}

export function askPrompt(currentVersion: unknown, message: string): string {
  return `
    You are a cooking and recipe assistant.

    You only discuss topics related to food, cooking, ingredients, kitchen techniques, nutrition, and recipes.

    If the user asks about anything unrelated to cooking or recipes (for example: technology, current events, movies, math, philosophy, etc.), politely refuse and say:
    "I'm here to help only with cooking and recipe questions."

    Here is the current recipe you and the user are discussing:
    ${currentVersion ? JSON.stringify(currentVersion) : "{}"}

    The user will now ask a question or make a comment about this recipe.
    Your job is to respond naturally and helpfully, in plain text — not JSON.

    Guidelines:
    - Speak conversationally and clearly.
    - Reference ingredients, steps, or quantities if relevant.
    - Suggest modifications, substitutions, or cooking tips if the user asks for them.
    - If the user asks for nutrition, servings, or time, use the data in the recipe.
    - If the recipe data is incomplete, make reasonable assumptions but clearly indicate they are estimates.
    - Never return JSON or code. Reply as plain text only.

    User message: "${message}"
    `;
}
