import db from "../db.js";
import type {
  ExistingNumericIdRow,
  ExistingTextIdRow,
  RecipeId,
  RecipeTagRow,
  UserId,
} from "./db.types.js";
import type { RecipeTag } from "./recipe.types.js";
import type { AddTagBody, TagInput } from "../validation/recipeSchemas.js";

type NewTagInput = AddTagBody["newTag"];
type UpdateTagInput = Partial<Pick<TagInput, "name" | "color">>;
type UpdateRecipeResult = { success: true } | { success: false; error: string };
type TagMutationResult =
  | { success: true; tag?: RecipeTag }
  | { success: false; error: string };

export function addTagToRecipe(
  recipeId: RecipeId,
  userId: UserId,
  newTag: NewTagInput,
): TagMutationResult {
  const recipe = db
    .prepare(`SELECT id FROM recipes WHERE id = ? AND user_id = ?`)
    .get(recipeId, userId) as ExistingTextIdRow | undefined;

  if (!recipe) {
    return { success: false, error: "Recipe not found" };
  }

  let tagRow = db
    .prepare(`SELECT id, name, color FROM tags WHERE user_id = ? AND name = ?`)
    .get(userId, newTag.name) as RecipeTagRow | undefined;

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

  fields.push("updated_at = CURRENT_TIMESTAMP");

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
