import { sql } from "kysely";
import { postgresDb } from "../database/db.js";
import type { AddTagBody, TagInput } from "../validation/recipeSchemas.js";
import type { RecipeTag } from "./recipe.types.js";

type Result = { success: true } | { success: false; error: string };
type NewTagInput = AddTagBody["newTag"];
type UpdateRecipeTagsInput = { tags?: TagInput[] };
type TagRow = { id: number; name: string; color: string };

const normalizeTagName = (name: string) => name.trim();
const toRecipeTag = (tag: TagRow): RecipeTag => tag;

async function findTagByNormalizedName(
  userId: string,
  name: string,
  excludeTagId?: number,
): Promise<TagRow | undefined> {
  const normalizedName = normalizeTagName(name);
  if (!normalizedName) return undefined;

  let query = postgresDb
    .selectFrom("tags")
    .select(["id", "name", "color"])
    .where("user_id", "=", userId)
    .where(sql<boolean>`lower(btrim(name)) = lower(btrim(${normalizedName}))`)
    .orderBy("id");

  if (excludeTagId !== undefined) {
    query = query.where("id", "!=", excludeTagId);
  }

  return query.executeTakeFirst();
}

export async function createRecipeTag(
  recipeId: string,
  userId: string,
  newTag: NewTagInput,
): Promise<Result & { tag?: RecipeTag }> {
  const normalizedName = normalizeTagName(newTag.name);
  const recipe = await postgresDb
    .selectFrom("recipes")
    .select("id")
    .where("id", "=", recipeId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!recipe) return { success: false, error: "Recipe not found" };

  let tag = await findTagByNormalizedName(userId, normalizedName);
  if (!tag) {
    tag = await postgresDb
      .insertInto("tags")
      .values({ user_id: userId, name: normalizedName, color: newTag.color })
      .returning(["id", "name", "color"])
      .executeTakeFirstOrThrow();
  }

  const association = await postgresDb
    .insertInto("recipe_tags")
    .values({ recipe_id: recipeId, tag_id: tag.id })
    .onConflict((oc) => oc.columns(["recipe_id", "tag_id"]).doNothing())
    .returning("tag_id")
    .executeTakeFirst();
  if (!association) {
    return { success: false, error: "Tag already associated with this recipe" };
  }
  return { success: true, tag: toRecipeTag(tag) };
}

export async function deleteRecipeTag(
  recipeId: string,
  tagId: number,
  userId: string,
): Promise<Result> {
  const recipe = await postgresDb
    .selectFrom("recipes")
    .select("id")
    .where("id", "=", recipeId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!recipe)
    return { success: false, error: "Recipe not found or access denied" };
  await postgresDb
    .deleteFrom("recipe_tags")
    .where("recipe_id", "=", recipeId)
    .where("tag_id", "=", tagId)
    .execute();
  return { success: true };
}

//TO DO: This function is more convoluted then necessary, will update later.
export async function updateRecipeTags(
  recipeId: string,
  userId: string,
  updatedRecipe: UpdateRecipeTagsInput,
): Promise<Result> {
  const recipe = await postgresDb
    .selectFrom("recipes")
    .select("id")
    .where("id", "=", recipeId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!recipe)
    return { success: false, error: "Recipe not found or access denied" };

  await postgresDb.transaction().execute(async (trx) => {
    const tagIds: number[] = [];
    const seen = new Set<string>();
    for (const tag of updatedRecipe.tags ?? []) {
      const name = normalizeTagName(tag.name);
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);

      // Check whether the submitted ID belongs to one of this user's tags.
      const byId = await trx
        .selectFrom("tags")
        .select("id")
        .where("id", "=", tag.id)
        .where("user_id", "=", userId)
        .executeTakeFirst();
      // Look for another tag with the same case-insensitive normalized name.
      const existing = await trx
        .selectFrom("tags")
        .select("id")
        .where("user_id", "=", userId)
        .where(sql<boolean>`lower(btrim(name)) = lower(btrim(${name}))`)
        .where((eb) => (byId ? eb("id", "!=", byId.id) : eb.val(true)))
        .executeTakeFirst();

      // Tags are shared per user, so changing this color updates every recipe
      if (byId && !existing) {
        // The submitted tag still belongs to this user and its new name is free.
        // Rename it and update its color.
        await trx
          .updateTable("tags")
          .set({ name, color: tag.color, updated_at: new Date() })
          .where("id", "=", byId.id)
          .execute();
        tagIds.push(byId.id);
      } else if (existing) {
        // Another tag already has this normalized name. Reuse that tag and only
        // update its color instead of creating a duplicate association.
        await trx
          .updateTable("tags")
          .set({ color: tag.color, updated_at: new Date() })
          .where("id", "=", existing.id)
          .execute();
        tagIds.push(existing.id);
      } else {
        // The submitted ID is unknown and no matching tag exists, so create a
        // new user owned tag.
        const inserted = await trx
          .insertInto("tags")
          .values({ user_id: userId, name, color: tag.color })
          .returning("id")
          .executeTakeFirstOrThrow();
        tagIds.push(inserted.id);
      }
    }
    if (tagIds.length) {
      // Keep associations only for the resolved tags from this request.
      await trx
        .deleteFrom("recipe_tags")
        .where("recipe_id", "=", recipeId)
        .where("tag_id", "not in", tagIds)
        .execute();
    } else {
      // No valid tags were submitted, so remove every tag from this recipe.
      await trx
        .deleteFrom("recipe_tags")
        .where("recipe_id", "=", recipeId)
        .execute();
    }
    for (const tagId of tagIds) {
      // Associate each resolved tag. The conflict clause makes retries safe.
      await trx
        .insertInto("recipe_tags")
        .values({ recipe_id: recipeId, tag_id: tagId })
        .onConflict((oc) => oc.columns(["recipe_id", "tag_id"]).doNothing())
        .execute();
    }
    // Remove only this user's tags that are no longer attached to any recipe.
    await sql`DELETE FROM tags WHERE user_id = ${userId} AND NOT EXISTS (SELECT 1 FROM recipe_tags WHERE recipe_tags.tag_id = tags.id)`.execute(
      trx,
    );
  });
  return { success: true };
}
