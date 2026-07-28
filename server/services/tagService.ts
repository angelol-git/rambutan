import { postgresDb } from "../database/db.js";
import type { TagInput } from "../validation/recipeSchemas.js";

type UpdateTagInput = Partial<Pick<TagInput, "name" | "color">>;
type Result = { success: true } | { success: false; error: string };
type BulkUpdateTagInput = Array<{ id: number; name?: string; color?: string }>;

export async function updateTag(
  tagId: number,
  userId: string,
  updates: UpdateTagInput,
): Promise<Result> {
  if (updates.name === undefined && updates.color === undefined)
    return { success: false, error: "No valid fields to update" };
  await postgresDb
    .updateTable("tags")
    .set({ ...updates, updated_at: new Date() })
    .where("id", "=", tagId)
    .where("user_id", "=", userId)
    .execute();
  return { success: true };
}

export async function deleteTags(
  tagIds: number[],
  userId: string,
): Promise<Result & { deletedTagIds?: number[] }> {
  try {
    const deletedTagIds = await postgresDb
      .transaction()
      .execute(async (trx) => {
        const ownedTags = await trx
          .selectFrom("tags")
          .select("id")
          .where("id", "in", tagIds)
          .where("user_id", "=", userId)
          .execute();
        const ownedTagIds = ownedTags.map((tag) => tag.id);

        if (ownedTagIds.length === 0) {
          return [];
        }

        await trx
          .deleteFrom("recipe_tags")
          .where("tag_id", "in", ownedTagIds)
          .execute();
        await trx.deleteFrom("tags").where("id", "in", ownedTagIds).execute();

        return ownedTagIds;
      });
    return { success: true, deletedTagIds };
  } catch {
    return { success: false, error: "Failed to delete tags" };
  }
}

export async function updateTags(
  tags: BulkUpdateTagInput,
  userId: string,
): Promise<Result & { updated?: number }> {
  try {
    await postgresDb.transaction().execute(async (trx) => {
      for (const tag of tags) {
        await trx
          .updateTable("tags")
          .set({ name: tag.name, color: tag.color, updated_at: new Date() })
          .where("id", "=", tag.id)
          .where("user_id", "=", userId)
          .execute();
      }
    });
    return { success: true, updated: tags.length };
  } catch {
    return { success: false, error: "Failed to update tag" };
  }
}
