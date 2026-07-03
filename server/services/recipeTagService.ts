import db from "../db.js";
import type {
  ExistingTextIdRow,
  RecipeId,
  RecipeTagRow,
  UserId,
} from "./db.types.js";
import type { RecipeTag } from "./recipe.types.js";
import type { AddTagBody, TagInput } from "../validation/recipeSchemas.js";

type NewTagInput = AddTagBody["newTag"];
type UpdateRecipeResult = { success: true } | { success: false; error: string };
type TagMutationResult =
  | { success: true; tag?: RecipeTag }
  | { success: false; error: string };
type UpdateRecipeTagsInput = {
  tags?: TagInput[];
};

function normalizeTagName(name: string): string {
  return name.trim();
}

function findTagByNormalizedName(
  userId: UserId,
  name: string,
  excludeTagId?: number,
): RecipeTagRow | undefined {
  const normalizedName = normalizeTagName(name);

  if (!normalizedName) {
    return undefined;
  }

  if (excludeTagId !== undefined) {
    return db
      .prepare(
        `SELECT id, name, color
           FROM tags
          WHERE user_id = ?
            AND id != ?
            AND trim(name) = ? COLLATE NOCASE
          ORDER BY id
          LIMIT 1`,
      )
      .get(userId, excludeTagId, normalizedName) as RecipeTagRow | undefined;
  }

  return db
    .prepare(
      `SELECT id, name, color
         FROM tags
        WHERE user_id = ?
          AND trim(name) = ? COLLATE NOCASE
        ORDER BY id
        LIMIT 1`,
    )
    .get(userId, normalizedName) as RecipeTagRow | undefined;
}

export function createRecipeTag(
  recipeId: RecipeId,
  userId: UserId,
  newTag: NewTagInput,
): TagMutationResult {
  const normalizedName = normalizeTagName(newTag.name);

  const recipe = db
    .prepare(`SELECT id FROM recipes WHERE id = ? AND user_id = ?`)
    .get(recipeId, userId) as ExistingTextIdRow | undefined;

  if (!recipe) {
    return { success: false, error: "Recipe not found" };
  }

  let tagRow = findTagByNormalizedName(userId, normalizedName);

  if (!tagRow) {
    const result = db
      .prepare(`INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)`)
      .run(userId, normalizedName, newTag.color);

    tagRow = {
      id: Number(result.lastInsertRowid),
      name: normalizedName,
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

export function deleteRecipeTag(
  recipeId: RecipeId,
  tagId: number,
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
    tagId,
  );

  return { success: true };
}

export function updateRecipeTags(
  recipeId: RecipeId,
  userId: UserId,
  updatedRecipe: UpdateRecipeTagsInput,
): UpdateRecipeResult {
  const resolvedTagIds: number[] = [];
  const seenNames = new Set<string>();

  // Resolve each incoming tag to a single existing user-owned tag by normalized
  // name so recipe tag edits reuse shared tags instead of creating duplicates.
  for (const tag of updatedRecipe.tags ?? []) {
    const normalizedName = normalizeTagName(tag.name);
    const normalizedKey = normalizedName.toLowerCase();

    if (!normalizedName || seenNames.has(normalizedKey)) {
      continue;
    }

    seenNames.add(normalizedKey);

    const existingTagById = db
      .prepare(`SELECT id FROM tags WHERE id = ? AND user_id = ?`)
      .get(tag.id, userId) as { id: number } | undefined;

    if (existingTagById) {
      const conflictingTag = findTagByNormalizedName(
        userId,
        normalizedName,
        existingTagById.id,
      );

      //Tag name already exists only update the color
      if (conflictingTag) {
        db.prepare(
          `UPDATE tags
             SET color = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
        ).run(tag.color, conflictingTag.id, userId);
        resolvedTagIds.push(conflictingTag.id);
        continue;
      }

      //Tag name does not exists update name and color
      db.prepare(
        `UPDATE tags
           SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
      ).run(normalizedName, tag.color, existingTagById.id, userId);

      resolvedTagIds.push(existingTagById.id);
      continue;
    }

    const existingTagByName = findTagByNormalizedName(userId, normalizedName);

    if (existingTagByName) {
      db.prepare(
        `UPDATE tags
           SET color = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
      ).run(tag.color, existingTagByName.id, userId);
      resolvedTagIds.push(existingTagByName.id);
      continue;
    }

    const insertResult = db
      .prepare(`INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)`)
      .run(userId, normalizedName, tag.color);

    resolvedTagIds.push(Number(insertResult.lastInsertRowid));
  }

  if (resolvedTagIds.length > 0) {
    db.prepare(
      `DELETE FROM recipe_tags
         WHERE recipe_id = ? AND tag_id NOT IN (${resolvedTagIds.map(() => "?").join(", ")})`,
    ).run(recipeId, ...resolvedTagIds);
  } else {
    db.prepare(`DELETE FROM recipe_tags WHERE recipe_id = ?`).run(recipeId);
  }

  for (const tagId of resolvedTagIds) {
    db.prepare(
      `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`,
    ).run(recipeId, tagId);
  }

  db.prepare(
    `DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM recipe_tags)`,
  ).run();

  return { success: true };
}

function toRecipeTag(tag: RecipeTagRow): RecipeTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}
