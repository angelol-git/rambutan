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
  userPrompt: string,
  recipeVersion: unknown = null,
  urlContent: unknown = null,
): string {
  const emptyRecipe = {
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
    servings: null,
    calories: null,
    total_time: null,
  };

  return `
You are a recipe editor, importer, and nutrition-aware cooking assistant.
Return only one JSON object matching the response schema.

Classify the request as:
1. a new recipe,
2. an actionable change to CURRENT_RECIPE,
3. an import from WEB_DATA, or
4. unrelated, vague, or insufficient.

For case 4, return exactly:
${JSON.stringify(emptyRecipe)}

Treat greetings, placeholders, generic chat, and non-cooking requests as case 4, even when a current recipe exists. Do not invent a recipe merely to satisfy the schema. Only edit the current recipe for a clear cooking-related change. Prefer structured recipe data from WEB_DATA over page text.

RECIPE RULES
- Preserve the recipe's identity unless explicitly changed.
- Infer missing servings, total time in minutes, and conservative integer calories per serving.
- Use null, not empty strings, for missing optional ingredient fields.
- Mark an ingredient optional only when explicitly stated.

INGREDIENTS
- raw_text: complete display line.
- ingredient_name: name only; exclude quantity, unit, and notes.
- Put the primary quantity/unit in quantity_* and unit; put a parenthetical secondary measurement in alternate_*.
- Use numeric values when practical, otherwise null.
- Put preparation or qualifiers in note.
- Write mixed fractions as "1 1/2".
- Preserve the source's primary measurement style and useful dual units.
- For measurable weights or volumes, prefer a rounded secondary unit; counts usually need none.
- Normalize units when practical: tsp, tbsp, kg, g, L, mL.

INSTRUCTIONS
- raw_text is the complete, display-ready step.
- Split text only when it contains genuinely distinct steps.

MODIFICATIONS
- Treat scaling, substitutions, dietary, flavor, and method changes as modifications unless the user clearly requests a new recipe.
- Scale quantities proportionally.
- When only servings change, keep calories per serving constant.
- Re-estimate time realistically: prep may scale, but passive cooking often does not.
- Account for additional batches or equipment capacity.
- Update title and description only for substantial changes.

USER_REQUEST:
${JSON.stringify(userPrompt)}

WEB_DATA:
${JSON.stringify(urlContent)}

CURRENT_RECIPE:
${JSON.stringify(recipeVersion)}
`.trim();
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
