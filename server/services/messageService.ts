import db from "../db.js";
import type { ParsedAiRecipe } from "./aiService.js";
import type {
  AskMessageRow,
  ErrorMessageRow,
  ExistingNumericIdRow,
  RecipeId,
  UserId,
  VersionId,
} from "./db.types.js";

type JsonRecord = Record<string, unknown>;
type AskMessage = Omit<AskMessageRow, "recipe_id">;
type StoredAiError = JsonRecord & {
  ai_model?: string;
  source_prompt?: string;
  error?: string;
  errorMessage?: string;
  raw?: unknown;
};

type RecipeError = {
  id: number;
  status: string | null;
  created_at: string;
  ai_model?: string;
  source_prompt?: string;
  error?: string;
  errorMessage: string;
  raw?: unknown;
};

export function saveUserPrompt(
  userId: UserId,
  recipeId: RecipeId | null | undefined,
  prompt: string,
): void {
  db.prepare(
    `INSERT INTO messages (user_id, recipe_id, role, content, status)
     VALUES (?, ?, 'user', ?, 'create')`,
  ).run(userId, recipeId ?? null, prompt);
}

export function saveAssistantErrorMessage(
  userId: UserId,
  recipeId: RecipeId | null | undefined,
  error: unknown,
): void {
  db.prepare(
    `INSERT INTO messages (user_id, recipe_id, role, content, status)
     VALUES (?, ?, 'assistant', ?, 'error')`,
  ).run(userId, recipeId ?? null, JSON.stringify(error));
}

export function saveAssistantRecipeMessage(
  userId: UserId,
  recipeId: RecipeId,
  recipeVersionId: VersionId,
  recipe: ParsedAiRecipe,
): void {
  db.prepare(
    `INSERT INTO messages (user_id, recipe_id, recipe_version_id, role, content, status)
     VALUES (?, ?, ?, 'assistant', ?, 'recipe')`,
  ).run(userId, recipeId, recipeVersionId, JSON.stringify(recipe));
}

export function getRecipeErrors(
  recipeId: RecipeId,
  userId: UserId,
): RecipeError[] | null {
  const recipe = db
    .prepare("SELECT 1 FROM recipes WHERE id = ? AND user_id = ?")
    .get(recipeId, userId) as { 1: number } | undefined;

  if (!recipe) {
    return null;
  }

  const rows = db
    .prepare(
      `SELECT id, status, content, created_at
       FROM messages
       WHERE recipe_id = ? AND status = 'error'
       ORDER BY created_at DESC`,
    )
    .all(recipeId) as ErrorMessageRow[];

  return rows.map((row) => {
    const parsed = safeParse<StoredAiError>(row.content || "{}", {});

    return {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      ai_model: parsed.ai_model,
      source_prompt: parsed.source_prompt,
      error: parsed.error,
      errorMessage: parsed.errorMessage || "Recipe could not be generated",
      raw: parsed.raw,
    };
  });
}

export function deleteError(id: string | number, userId: UserId): boolean {
  const message = db
    .prepare(
      `
    SELECT m.id FROM messages m
    JOIN recipes r ON m.recipe_id = r.id
    WHERE m.id = ? AND r.user_id = ?
  `,
    )
    .get(id, userId) as ExistingNumericIdRow | undefined;

  if (!message) {
    return false;
  }

  const result = db.prepare(`DELETE FROM messages WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function getAskMessages(
  recipeId: RecipeId,
  userId: UserId,
): AskMessage[] | null {
  const recipe = db
    .prepare("SELECT 1 FROM recipes WHERE id = ? AND user_id = ?")
    .get(recipeId, userId) as { 1: number } | undefined;

  if (!recipe) {
    return null;
  }

  const rows = db
    .prepare(
      `SELECT *
       FROM messages
       WHERE recipe_id = ? AND status = 'ask'
       ORDER BY created_at ASC`,
    )
    .all(recipeId) as AskMessageRow[];

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    user_id: row.user_id,
    status: row.status,
    role: row.role,
  }));
}

function safeParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
