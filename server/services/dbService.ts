import db from "../db.js";
import { v7 as uuidv7 } from "uuid";
import type { ParsedAiRecipe } from "./aiService.js";
import type { AddTagBody, TagInput, UpdateRecipeBody } from "../validation/recipeSchemas.js";

type RecipeId = string;
type UserId = string;
type TagId = number;
type MessageId = number;
type RecipeVersionId = number | bigint;
type SortOrder = "ASC" | "DESC";

type JsonRecord = Record<string, unknown>;

type RecipeRow = {
  id: RecipeId;
  title: string | null;
  created_at: string;
};

type RecipeVersionRow = {
  id: number;
  recipe_id: RecipeId;
  servings: number | null;
  total_time: number | null;
  calories: number | null;
  description: string | null;
  ingredients: string | string[];
  instructions: string | string[];
  source_prompt: string | null;
  ai_model: string | null;
  created_at: string;
};

type RecipeTagRow = {
  id: TagId;
  name: string;
  color: string;
};

type RecipeTagAssociationRow = RecipeTagRow & {
  recipe_id: RecipeId;
};

type ExistingIdRow = {
  id: number;
};

type ExistingRecipeVersionRow = {
  id: number;
};

type ExistingTagRow = {
  id: number;
  name: string;
  color: string;
};

type AskMessageRow = {
  id: MessageId;
  user_id: UserId;
  recipe_id: RecipeId | null;
  role: string;
  content: string;
  status: string | null;
  created_at: string;
};

type ErrorMessageRow = {
  id: MessageId;
  status: string | null;
  content: string;
  created_at: string;
};

type UrlCacheRow = {
  normalized_url: string;
  source_url: string;
  content: string;
  fetched_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type RecipeVersion = {
  id: number;
  recipeDetails: {
    calories: number | null;
    servings: number | null;
    total_time: number | null;
  };
  description: string;
  instructions: string[];
  ingredients: string[];
  source_prompt: string;
  ai_model: string | null;
  created_at: string;
};

type RecipeTag = {
  id: TagId;
  name: string;
  color: string;
};

type Recipe = {
  id: RecipeId;
  title: string;
  created_at: string;
  tags: RecipeTag[];
  versions: RecipeVersion[];
};

type AskMessage = {
  id: MessageId;
  content: string;
  created_at: string;
  user_id: UserId;
  status: string | null;
  role: string;
};

type StoredAiError = JsonRecord & {
  ai_model?: string;
  source_prompt?: string;
  error?: string;
  errorMessage?: string;
  raw?: unknown;
};

type RecipeError = {
  id: MessageId;
  status: string | null;
  created_at: string;
  ai_model?: string;
  source_prompt?: string;
  error?: string;
  errorMessage: string;
  raw?: unknown;
};

type UpdateRecipeInput = UpdateRecipeBody["updatedRecipe"];
type NewTagInput = AddTagBody["newTag"];
type UpdateTagInput = Partial<Pick<TagInput, "name" | "color">>;

type UrlCacheLookupResult =
  | { success: true; urlContent: UrlCacheRow }
  | { success: false; error: string };

type UpdateRecipeResult =
  | { success: true }
  | { success: false; error: string };

type TagMutationResult =
  | { success: true; tag?: RecipeTag }
  | { success: false; error: string };

function safeParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

function safeParseArray(jsonString: string): string[] {
  const parsed = safeParse<unknown>(jsonString, []);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

function mapRecipeVersionRow(version: RecipeVersionRow): RecipeVersion {
  return {
    id: version.id,
    recipeDetails: {
      calories: version.calories ?? null,
      servings: version.servings ?? null,
      total_time: version.total_time ?? null,
    },
    description: version.description ?? "",
    instructions: Array.isArray(version.instructions)
      ? version.instructions
      : safeParseArray(version.instructions),
    ingredients: Array.isArray(version.ingredients)
      ? version.ingredients
      : safeParseArray(version.ingredients),
    source_prompt: version.source_prompt ?? "",
    ai_model: version.ai_model ?? null,
    created_at: version.created_at,
  };
}

function toRecipeTag(tag: RecipeTagRow): RecipeTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

function toNumericTagId(tagId: string | number): number {
  return typeof tagId === "number" ? tagId : Number.parseInt(tagId, 10);
}

function getRecipeTags(recipeId: RecipeId): RecipeTag[] {
  const tags = db
    .prepare(
      `SELECT t.id, t.name, t.color
       FROM recipe_tags rt
       JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id = ?
       ORDER BY t.id ASC`,
    )
    .all(recipeId) as RecipeTagRow[];

  return tags.map(toRecipeTag);
}

function getRecipeVersions(recipeId: RecipeId, order: SortOrder = "ASC"): RecipeVersion[] {
  const normalizedOrder: SortOrder = order === "DESC" ? "DESC" : "ASC";

  const versions = db
    .prepare(
      `SELECT id, recipe_id, servings, total_time, calories, description,
              ingredients, instructions, source_prompt, ai_model, created_at
       FROM recipe_versions
       WHERE recipe_id = ?
       ORDER BY created_at ${normalizedOrder}`,
    )
    .all(recipeId) as RecipeVersionRow[];

  return versions.map(mapRecipeVersionRow);
}

function getRecipeByIdInternal(
  id: RecipeId,
  userId: UserId,
  versionOrder: SortOrder = "ASC",
): Recipe | null {
  const recipe = db
    .prepare(
      `SELECT id, title, created_at
       FROM recipes
       WHERE id = ? AND user_id = ?`,
    )
    .get(id, userId) as RecipeRow | undefined;

  if (!recipe) {
    return null;
  }

  return {
    id: recipe.id,
    title: recipe.title ?? "",
    created_at: recipe.created_at,
    tags: getRecipeTags(id),
    versions: getRecipeVersions(id, versionOrder),
  };
}

export function saveUserMessage(
  userId: UserId,
  recipeId: RecipeId | null | undefined,
  message: string,
): void {
  db.prepare(
    `INSERT INTO messages (user_id, recipe_id, role, content, status)
     VALUES (?, ?, 'user', ?, 'create')`,
  ).run(userId, recipeId ?? null, message);
}

export function saveAiError(
  userId: UserId,
  recipeId: RecipeId | null | undefined,
  error: unknown,
): void {
  db.prepare(
    `INSERT INTO messages (user_id, recipe_id, role, content, status)
     VALUES (?, ?, 'assistant', ?, 'error')`,
  ).run(userId, recipeId ?? null, JSON.stringify(error));
}

export function saveRecipeToDb(
  parsedRecipe: ParsedAiRecipe,
  {
    userId,
    recipeId,
    sourceUrl,
  }: {
    userId: UserId;
    recipeId?: RecipeId | null;
    sourceUrl?: string | null;
  },
): Recipe | null {
  return db.transaction(() => {
    const newRecipeId = recipeId ?? uuidv7();

    if (!recipeId) {
      db.prepare(
        `INSERT INTO recipes (id, user_id, title, source_url)
         VALUES (?, ?, ?, ?)`,
      ).run(newRecipeId, userId, parsedRecipe.title, sourceUrl ?? null);
    }

    const versionInsert = db.prepare(
      `INSERT INTO recipe_versions
         (recipe_id, servings, total_time, calories, description,
          instructions, ingredients, source_prompt, ai_model, relation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const versionResult = versionInsert.run(
      newRecipeId,
      parsedRecipe.servings,
      parsedRecipe.total_time,
      parsedRecipe.calories,
      parsedRecipe.description,
      JSON.stringify(parsedRecipe.instructions),
      JSON.stringify(parsedRecipe.ingredients),
      parsedRecipe.source_prompt,
      parsedRecipe.ai_model,
      parsedRecipe.relation ?? "reply",
    );

    db.prepare(
      `INSERT INTO messages (user_id, recipe_id, role, content, status)
       VALUES (?, ?, 'assistant', ?, 'recipe')`,
    ).run(userId, newRecipeId, JSON.stringify(parsedRecipe));

    parsedRecipe.versionId = versionResult.lastInsertRowid;

    return getRecipeByIdInternal(newRecipeId, userId);
  })();
}

export function getRecipesByUserId(userId: UserId): Recipe[] {
  const recipes = db
    .prepare(
      `SELECT id, title, created_at
       FROM recipes
       WHERE user_id = ?
       ORDER BY created_at DESC`,
    )
    .all(userId) as RecipeRow[];

  if (recipes.length === 0) {
    return [];
  }

  const recipeIds = recipes.map((recipe) => recipe.id);

  const versions = db
    .prepare(
      `SELECT *
       FROM recipe_versions
       WHERE recipe_id IN (${recipeIds.map(() => "?").join(", ")})
       ORDER BY created_at ASC`,
    )
    .all(...recipeIds) as RecipeVersionRow[];

  const tags = db
    .prepare(
      `SELECT rt.recipe_id, t.id, t.name, t.color
       FROM recipe_tags rt
       JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id IN (${recipeIds.map(() => "?").join(", ")})`,
    )
    .all(...recipeIds) as RecipeTagAssociationRow[];

  const versionsMap = new Map<RecipeId, RecipeVersion[]>();
  for (const version of versions) {
    const recipeVersions = versionsMap.get(version.recipe_id) ?? [];
    recipeVersions.push(mapRecipeVersionRow(version));
    versionsMap.set(version.recipe_id, recipeVersions);
  }

  const tagsMap = new Map<RecipeId, RecipeTag[]>();
  for (const tag of tags) {
    const recipeTags = tagsMap.get(tag.recipe_id) ?? [];
    recipeTags.push(toRecipeTag(tag));
    tagsMap.set(tag.recipe_id, recipeTags);
  }

  return recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title ?? "",
    created_at: recipe.created_at,
    versions: versionsMap.get(recipe.id) ?? [],
    tags: tagsMap.get(recipe.id) ?? [],
  }));
}

export function getRecipeById(id: RecipeId, userId: UserId): Recipe | null {
  return getRecipeByIdInternal(id, userId, "DESC");
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
    .get(id, userId) as ExistingIdRow | undefined;

  if (!message) {
    return false;
  }

  const result = db.prepare(`DELETE FROM messages WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function deleteRecipeVersion(id: string | number, userId: UserId): boolean {
  const version = db
    .prepare(
      `
    SELECT rv.id FROM recipe_versions rv
    JOIN recipes r ON rv.recipe_id = r.id
    WHERE rv.id = ? AND r.user_id = ?
  `,
    )
    .get(id, userId) as ExistingRecipeVersionRow | undefined;

  if (!version) {
    return false;
  }

  const result = db.prepare(`DELETE FROM recipe_versions WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function deleteRecipe(id: RecipeId, userId: UserId): boolean {
  const result = db
    .prepare(`DELETE FROM recipes WHERE id = ? AND user_id = ?`)
    .run(id, userId);
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

export function updateRecipe(
  id: RecipeId,
  userId: UserId,
  updatedRecipe: UpdateRecipeInput,
): UpdateRecipeResult {
  return db.transaction((): UpdateRecipeResult => {
    const updateResult = db
      .prepare(`UPDATE recipes SET title = ? WHERE id = ?`)
      .run(updatedRecipe.title, id);

    if (updateResult.changes === 0) {
      return { success: false, error: "Recipe not found" };
    }

    db.prepare(
      `UPDATE recipe_versions
       SET servings = ?, total_time = ?, calories = ?, description = ?,
           instructions = ?, ingredients = ?
       WHERE id = ? AND recipe_id = ?`,
    ).run(
      updatedRecipe.recipeDetails.servings ?? null,
      updatedRecipe.recipeDetails.total_time ?? null,
      updatedRecipe.recipeDetails.calories ?? null,
      updatedRecipe.description ?? null,
      JSON.stringify(updatedRecipe.instructions),
      JSON.stringify(updatedRecipe.ingredients),
      updatedRecipe.id,
      id,
    );

    const resolvedTagIds: number[] = [];

    for (const tag of updatedRecipe.tags ?? []) {
      const existingTagById = db
        .prepare(`SELECT id FROM tags WHERE id = ? AND user_id = ?`)
        .get(tag.id, userId) as ExistingIdRow | undefined;

      if (existingTagById) {
        db.prepare(
          `UPDATE tags SET name = ?, color = ? WHERE id = ? AND user_id = ?`,
        ).run(tag.name, tag.color, existingTagById.id, userId);

        resolvedTagIds.push(existingTagById.id);
        continue;
      }

      const existingTagByName = db
        .prepare(`SELECT id FROM tags WHERE user_id = ? AND name = ?`)
        .get(userId, tag.name) as ExistingIdRow | undefined;

      if (existingTagByName) {
        db.prepare(`UPDATE tags SET color = ? WHERE id = ? AND user_id = ?`).run(
          tag.color,
          existingTagByName.id,
          userId,
        );
        resolvedTagIds.push(existingTagByName.id);
        continue;
      }

      const insertResult = db
        .prepare(`INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)`)
        .run(userId, tag.name, tag.color);

      resolvedTagIds.push(Number(insertResult.lastInsertRowid));
    }

    if (resolvedTagIds.length > 0) {
      db.prepare(
        `DELETE FROM recipe_tags
         WHERE recipe_id = ? AND tag_id NOT IN (${resolvedTagIds.map(() => "?").join(", ")})`,
      ).run(id, ...resolvedTagIds);
    } else {
      db.prepare(`DELETE FROM recipe_tags WHERE recipe_id = ?`).run(id);
    }

    for (const tagId of resolvedTagIds) {
      db.prepare(
        `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`,
      ).run(id, tagId);
    }

    db.prepare(
      `DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM recipe_tags)`,
    ).run();

    return { success: true };
  })();
}

export function addTagToRecipe(
  recipeId: RecipeId,
  userId: UserId,
  newTag: NewTagInput,
): TagMutationResult {
  let tagRow = db
    .prepare(`SELECT * FROM tags WHERE user_id = ? AND name = ?`)
    .get(userId, newTag.name) as ExistingTagRow | undefined;

  if (!tagRow) {
    const result = db
      .prepare(`INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)`)
      .run(userId, newTag.name, newTag.color);

    tagRow = {
      id: Number(result.lastInsertRowid),
      name: newTag.name,
      color: newTag.color,
    };
  }

  const existingTag = db
    .prepare(`SELECT 1 FROM recipe_tags WHERE recipe_id = ? AND tag_id = ?`)
    .get(recipeId, tagRow.id) as { 1: number } | undefined;

  if (existingTag) {
    return { success: false, error: "Tag already associated with this recipe" };
  }

  db.prepare(`INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`).run(
    recipeId,
    tagRow.id,
  );

  return { success: true, tag: toRecipeTag(tagRow) };
}

export function updateTag(
  tagId: string | number,
  userId: UserId,
  updates: UpdateTagInput,
): UpdateRecipeResult {
  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }

  if (fields.length === 0) {
    return { success: false, error: "No valid fields to update" };
  }

  const statement = `UPDATE tags SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`;
  db.prepare(statement).run(...values, tagId, userId);

  return { success: true };
}

export function removeTagFromRecipe(
  recipeId: RecipeId,
  tagId: string | number,
  userId: UserId,
): UpdateRecipeResult {
  const recipe = db
    .prepare("SELECT 1 FROM recipes WHERE id = ? AND user_id = ?")
    .get(recipeId, userId) as { 1: number } | undefined;

  if (!recipe) {
    return { success: false, error: "Recipe not found or access denied" };
  }

  db.prepare(`DELETE FROM recipe_tags WHERE recipe_id = ? AND tag_id = ?`).run(
    recipeId,
    toNumericTagId(tagId),
  );

  return { success: true };
}

export function checkURL(url: string): UrlCacheLookupResult {
  const urlContent = db
    .prepare("SELECT * FROM url_cache WHERE normalized_url = ?")
    .get(url) as UrlCacheRow | undefined;

  if (!urlContent) {
    return { success: false, error: "URL not found" };
  }

  const isExpired = new Date(urlContent.expires_at).getTime() <= Date.now();
  if (isExpired) {
    return { success: false, error: "URL cache expired, reparse." };
  }

  return { success: true, urlContent };
}

export function saveURLContent(
  normalizedUrl: string,
  sourceUrl: string,
  urlContent: unknown,
  fetchedAt: string,
  expiresAt: string,
): void {
  const serializedContent =
    typeof urlContent === "string" ? urlContent : JSON.stringify(urlContent);

  db.prepare(
    `INSERT INTO url_cache (
       normalized_url,
       source_url,
       content,
       fetched_at,
       expires_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(normalized_url) DO UPDATE SET
       source_url = excluded.source_url,
       content = excluded.content,
       fetched_at = excluded.fetched_at,
       expires_at = excluded.expires_at,
       updated_at = CURRENT_TIMESTAMP`,
  ).run(normalizedUrl, sourceUrl, serializedContent, fetchedAt, expiresAt);
}
