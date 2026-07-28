import { postgresDb } from "../database/db.js";
import type { ParsedAiRecipe } from "./aiService.js";

type JsonRecord = Record<string, unknown>;
type StoredAiError = JsonRecord & {
  ai_model?: string;
  source_input?: string;
  error?: string;
  errorMessage?: string;
  raw?: unknown;
};

export type AskMessage = {
  id: number;
  user_id: string;
  role: string;
  content: string;
  status: string | null;
  created_at: string;
};

export type RecipeError = {
  id: number;
  status: string | null;
  created_at: string;
  ai_model?: string;
  source_input?: string;
  error?: string;
  errorMessage: string;
  raw?: unknown;
};

export async function saveUserPrompt(
  userId: string,
  recipeId: string | null | undefined,
  prompt: string,
): Promise<void> {
  await postgresDb
    .insertInto("messages")
    .values({
      user_id: userId,
      recipe_id: recipeId ?? null,
      role: "user",
      content: prompt,
      status: "create",
    })
    .execute();
}

export async function saveAssistantErrorMessage(
  userId: string,
  recipeId: string | null | undefined,
  error: unknown,
): Promise<void> {
  await postgresDb
    .insertInto("messages")
    .values({
      user_id: userId,
      recipe_id: recipeId ?? null,
      role: "assistant",
      content: JSON.stringify(error),
      status: "error",
    })
    .execute();
}

export async function saveAssistantRecipeMessage(
  userId: string,
  recipeId: string,
  recipeVersionId: string,
  recipe: ParsedAiRecipe,
): Promise<void> {
  await postgresDb
    .insertInto("messages")
    .values({
      user_id: userId,
      recipe_id: recipeId,
      recipe_version_id: recipeVersionId,
      role: "assistant",
      content: JSON.stringify(recipe),
      status: "recipe",
    })
    .execute();
}

export async function getRecipeErrors(
  recipeId: string,
  userId: string,
): Promise<RecipeError[] | null> {
  const recipe = await postgresDb
    .selectFrom("recipes")
    .select("id")
    .where("id", "=", recipeId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!recipe) return null;

  const rows = await postgresDb
    .selectFrom("messages")
    .select(["id", "status", "content", "created_at"])
    .where("recipe_id", "=", recipeId)
    .where("status", "=", "error")
    .orderBy("created_at", "desc")
    .execute();

  return rows.map((row) => {
    const parsed = safeParse<StoredAiError>(row.content, {});
    return {
      id: row.id,
      status: row.status,
      created_at: row.created_at.toISOString(),
      ai_model: parsed.ai_model,
      source_input: parsed.source_input,
      error: parsed.error,
      errorMessage: parsed.errorMessage || "Recipe could not be generated",
      raw: parsed.raw,
    };
  });
}

export async function deleteError(
  id: string | number,
  userId: string,
): Promise<boolean> {
  const messageId = Number(id);
  if (!Number.isInteger(messageId)) return false;
  const result = await postgresDb
    .deleteFrom("messages as m")
    .using("recipes as r")
    .whereRef("m.recipe_id", "=", "r.id")
    .where("m.id", "=", messageId)
    .where("r.user_id", "=", userId)
    .returning("m.id")
    .executeTakeFirst();
  return result !== undefined;
}

export async function getAskMessages(
  recipeId: string,
  userId: string,
): Promise<AskMessage[] | null> {
  const recipe = await postgresDb
    .selectFrom("recipes")
    .select("id")
    .where("id", "=", recipeId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!recipe) return null;

  const rows = await postgresDb
    .selectFrom("messages")
    .select(["id", "content", "created_at", "user_id", "status", "role"])
    .where("recipe_id", "=", recipeId)
    .where("status", "=", "ask")
    .orderBy("created_at", "asc")
    .execute();

  return rows.map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
  }));
}

function safeParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
