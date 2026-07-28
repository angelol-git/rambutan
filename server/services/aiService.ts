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

const model = "gemini-3.5-flash-lite";

type AiRecipe = z.infer<typeof aiRecipeSchema>;

export type ParsedAiRecipe = AiRecipe & {
  ai_model: string;
  source_input: string;
  relation?: "reply" | "fork";
  versionId?: string;
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
  source_input: string;
  ai_model?: string;
  rawResponse?: string;
  issues?: AiValidationIssue[];
};

type GenerateResponseResult = Awaited<
  ReturnType<typeof genAI.models.generateContent>
>;

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
  modelName = model,
): Promise<GenerateResponseResult> {
  return genAI.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(aiRecipeSchema),
      temperature: 0.7,
    },
  });
}

export function validateAiResponse(
  response: GenerateResponseResult,
  prompt: string,
  modelName = model,
): ParsedAiRecipe {
  let rawResponse = extractTextParts(response);

  if (!rawResponse) {
    throw new AiValidationError("The AI returned an empty response.", {
      type: "empty_response",
      source_input: prompt,
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
      source_input: prompt,
      ai_model: modelName,
    });
  }

  let validatedRecipe: AiRecipe;
  try {
    validatedRecipe = aiRecipeSchema.parse(parsedRecipe);
  } catch (error) {
    throw new AiValidationError("AI response did not match recipe schema.", {
      type: "schema_validation_failed",
      rawResponse,
      source_input: prompt,
      ai_model: modelName,
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
        source_input: prompt,
      },
    );
  }

  if (validatedRecipe.title.length > 150) {
    throw new AiValidationError("Recipe title is too long.", {
      type: "invalid_json",
      rawResponse,
      source_input: prompt,
      ai_model: modelName,
    });
  }

  return {
    ...validatedRecipe,
    ai_model: modelName,
    source_input: prompt,
  };
}

export function createPrompt(
  prompt: string,
  recipeVersion: unknown = {},
  urlContent: unknown = {},
): string {
  const serializedRecipeVersion = JSON.stringify(recipeVersion ?? null);
  const serializedUrlContent =
    typeof urlContent === "string"
      ? urlContent
      : urlContent
        ? JSON.stringify(urlContent)
        : "None";

  return `
    Return exactly one JSON object that matches the response schema.

    Role: expert recipe editor, importer, and nutrition-aware cooking assistant.

    Decide whether the input is:
    - a new recipe request,
    - a modification of Current State,
    - a recipe import from Extracted Web Data,
    - or unrelated / too weak to support a recipe.

    If the input is unrelated, ambiguous, placeholder text, or not clearly about recipes or cooking, return:
    {"title":"","description":"","ingredients":[],"instructions":[],"servings":null,"calories":null,"total_time":null}

    Core rules:
    - Do not invent a recipe just to satisfy the schema.
    - Treat one-word inputs like "test", "hello", "hi", "hey", "ok", "okay" and similar placeholder text as unrelated.
    - Treat unrelated requests like weather, code, math, politics, or generic chat as unrelated even if the user is editing an existing recipe.
    - Only modify Current State when the user's request clearly describes a recipe change such as scaling, substitutions, ingredient changes, dietary changes, flavor changes, or cooking method changes.
    - If the request is vague, off-topic, or not actionable for cooking, return the empty recipe object exactly as shown above.
    - Return JSON only. No markdown or extra text.
    - Keep title at 150 characters or fewer.
    - Preserve the recipe's core identity unless the user explicitly asks to change it.
    - If Extracted Web Data contains structured recipe data, prefer it over weaker page text.

    Ingredient rules:
    - Every ingredient must be a structured object matching the schema.
    - raw_text is the full display line.
    - ingredient_name is only the ingredient name, without quantity, unit, or trailing notes.
    - quantity_text and unit describe the primary quantity shown in raw_text.
    - alternate_quantity_text and alternate_unit describe the secondary quantity in parentheses when present.
    - quantity_value and alternate_quantity_value are numeric when practical, otherwise null.
    - note captures trailing preparation or qualifier text; otherwise null.
    - Format mixed fractions as "1 1/2", not "1 and 1/2" or "1 & 1/2".
    - Preserve the source recipe's primary measurement style whenever practical.
    - For measurable weight or volume-based ingredients, prefer dual units with the primary unit first and a rounded secondary unit in parentheses.
    - Keep useful existing dual units when importing or modifying.
    - Count-based ingredients usually do not need a secondary unit.
    - Normalize spelled-out measurement units to standard abbreviations in raw_text, unit, and alternate_unit when practical.
    - Examples: teaspoon/teaspoons -> "tsp", tablespoon/tablespoons -> "tbsp", kilogram/kilograms -> "kg", gram/grams -> "g", liter/liters -> "L", milliliter/milliliters -> "mL".
    - Use null, not empty strings, for missing optional fields.
    - is_optional is true only when explicitly optional.

    Instruction rules:
    - Every instruction must be a structured object matching the schema.
    - raw_text is the full human-readable instruction step as it should be displayed in the UI.
    - Do not split a single instruction across multiple objects unless the recipe truly has multiple distinct steps.

    Modification and scaling:
    - If Current State exists, treat scaling, substitutions, dietary changes, flavor changes, and method changes as modifications unless the user clearly asks for a new recipe.
    - Scale ingredient quantities proportionally.
    - When only scaling servings, keep calories per serving constant.
    - Re-estimate total_time realistically. Prep time may change more than cook time; passive cooking time often does not.
    - Account for extra batches when larger volume would not fit the same equipment.
    - Update title and description when the modification is substantial.

    Missing data:
    - Infer servings if missing.
    - Infer total_time in minutes if missing.
    - Infer a conservative integer calories-per-serving estimate if missing.

    Context:
    User Prompt: "${prompt}"
    Extracted Web Data: ${serializedUrlContent}
    Current State: ${serializedRecipeVersion}
  `;
}

export function askPrompt(currentVersion: unknown, question: string): string {
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

    User question: "${question}"
    `;
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
