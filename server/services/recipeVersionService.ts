import { postgresDb } from "../database/db.js";
import type { Transaction } from "kysely";
import type { DatabaseSchema } from "../database/types.js";
import { v7 as uuidv7 } from "uuid";
import type { ParsedAiRecipe } from "./aiService.js";
import type {
  Recipe,
  RecipeIngredient,
  RecipeInstruction,
  RecipeSource,
} from "./recipe.types.js";
import type { UpdateRecipeVersionBody } from "../validation/recipeSchemas.js";
import { normalizeIngredientUnit } from "../utils/ingredientParser.js";
import { getRecipeById } from "./recipeService.js";

type UpdateRecipeInput = UpdateRecipeVersionBody["updatedRecipe"];
type UpdateRecipeResult = { success: true } | { success: false; error: string };
type RecipeIngredientInput =
  | UpdateRecipeInput["ingredients"][number]
  | ParsedAiRecipe["ingredients"][number];
type RecipeInstructionInput =
  | UpdateRecipeInput["instructions"][number]
  | ParsedAiRecipe["instructions"][number];

export async function saveRecipeToDb(
  parsedRecipe: ParsedAiRecipe,
  { userId, recipeId }: { userId: string; recipeId?: string | null },
): Promise<Recipe | null> {
  const recipeRecordId = recipeId ?? uuidv7();
  const newVersionId = uuidv7();
  await postgresDb.transaction().execute(async (trx) => {
    if (!recipeId) {
      await trx
        .insertInto("recipes")
        .values({
          id: recipeRecordId,
          user_id: userId,
          title: parsedRecipe.title,
        })
        .execute();
    } else {
      const updated = await trx
        .updateTable("recipes")
        .set({ updated_at: new Date() })
        .where("id", "=", recipeRecordId)
        .where("user_id", "=", userId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) throw new Error("Recipe not found");
    }
    const version = await trx
      .selectFrom("recipe_versions")
      .select((eb) => eb.fn.max("version_number").as("max_version"))
      .where("recipe_id", "=", recipeRecordId)
      .executeTakeFirstOrThrow();
    const source = parseRecipeSource(parsedRecipe.source_input);
    await trx
      .insertInto("recipe_versions")
      .values({
        id: newVersionId,
        recipe_id: recipeRecordId,
        version_number: (version.max_version ?? 0) + 1,
        servings: parsedRecipe.servings,
        total_time: parsedRecipe.total_time,
        calories: parsedRecipe.calories,
        description: parsedRecipe.description,
        notes: null,
        source_type: source?.type ?? null,
        source_value: source?.value ?? null,
        source_summary: source?.summary ?? null,
        ai_model: parsedRecipe.ai_model,
        relation: parsedRecipe.relation ?? "reply",
      })
      .execute();
    await insertIngredientRows(trx, newVersionId, parsedRecipe.ingredients);
    await insertInstructionRows(trx, newVersionId, parsedRecipe.instructions);
    await trx
      .insertInto("messages")
      .values({
        user_id: userId,
        recipe_id: recipeRecordId,
        recipe_version_id: newVersionId,
        role: "assistant",
        content: JSON.stringify(parsedRecipe),
        status: "recipe",
      })
      .execute();
  });
  parsedRecipe.versionId = newVersionId;
  return getRecipeById(recipeRecordId, userId);
}

export async function deleteRecipeVersion(
  id: string,
  userId: string,
): Promise<boolean> {
  const deleted = await postgresDb
    .deleteFrom("recipe_versions as rv")
    .using("recipes as r")
    .whereRef("rv.recipe_id", "=", "r.id")
    .where("rv.id", "=", id)
    .where("r.user_id", "=", userId)
    .returning("rv.id")
    .executeTakeFirst();
  return deleted !== undefined;
}

export async function updateRecipeVersion(
  recipeId: string,
  versionId: string,
  userId: string,
  updatedRecipe: UpdateRecipeInput,
): Promise<UpdateRecipeResult> {
  const notes = normalizeRecipeVersionNotes(updatedRecipe.notes);
  const updated = await postgresDb.transaction().execute(async (trx) => {
    const version = await trx
      .updateTable("recipe_versions as rv")
      .from("recipes as r")
      .set({
        servings: updatedRecipe.recipeDetails.servings ?? null,
        total_time: updatedRecipe.recipeDetails.total_time ?? null,
        calories: updatedRecipe.recipeDetails.calories ?? null,
        description: updatedRecipe.description ?? null,
        notes,
        source_type: updatedRecipe.source?.type ?? null,
        source_value: updatedRecipe.source?.value ?? null,
        source_summary: updatedRecipe.source?.summary ?? null,
        updated_at: new Date(),
      })
      .whereRef("rv.recipe_id", "=", "r.id")
      .where("rv.id", "=", versionId)
      .where("rv.recipe_id", "=", recipeId)
      .where("r.user_id", "=", userId)
      .returning("rv.id")
      .executeTakeFirst();
    if (!version) return false;
    await trx
      .deleteFrom("recipe_version_ingredients")
      .where("recipe_version_id", "=", versionId)
      .execute();
    await trx
      .deleteFrom("recipe_version_steps")
      .where("recipe_version_id", "=", versionId)
      .execute();
    await insertIngredientRows(trx, versionId, updatedRecipe.ingredients);
    await insertInstructionRows(trx, versionId, updatedRecipe.instructions);
    return true;
  });
  return updated
    ? { success: true }
    : { success: false, error: "Recipe version not found" };
}

export function parseRecipeSource(
  input: string | null | undefined,
): RecipeSource | null {
  const value = input?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:")
      return {
        type: "url",
        value,
        summary: url.hostname.replace(/^www\./, ""),
      };
  } catch {
    /* not a URL */
  }
  if (value.includes("\n") || value.length > 200)
    return {
      type: "raw_text",
      value,
      summary: "Imported from pasted recipe text",
    };
  return { type: "instruction", value, summary: value };
}

function normalizeIngredientForStorage(
  ingredient: RecipeIngredientInput,
): Omit<RecipeIngredient, "id" | "position" | "completed"> {
  return {
    raw_text: ingredient.raw_text.trim(),
    ingredient_name: ingredient.ingredient_name.trim(),
    quantity_value: ingredient.quantity_value ?? null,
    quantity_text: ingredient.quantity_text ?? null,
    unit: normalizeIngredientUnit(ingredient.unit),
    alternate_quantity_value: ingredient.alternate_quantity_value ?? null,
    alternate_quantity_text: ingredient.alternate_quantity_text ?? null,
    alternate_unit: normalizeIngredientUnit(ingredient.alternate_unit),
    note: ingredient.note ?? null,
    is_optional: ingredient.is_optional ?? false,
  };
}

async function insertIngredientRows(
  trx: Transaction<DatabaseSchema>,
  recipeVersionId: string,
  ingredients: RecipeIngredientInput[],
): Promise<void> {
  if (!ingredients.length) return;
  await trx
    .insertInto("recipe_version_ingredients")
    .values(
      ingredients.map((ingredient, index) => {
        const normalized = normalizeIngredientForStorage(ingredient);
        return {
          id:
            "id" in ingredient && typeof ingredient.id === "string"
              ? ingredient.id
              : uuidv7(),
          recipe_version_id: recipeVersionId,
          position: index + 1,
          ...normalized,
        };
      }),
    )
    .execute();
}

function normalizeInstructionForStorage(
  instruction: RecipeInstructionInput,
): Omit<RecipeInstruction, "id" | "position" | "completed"> {
  return { raw_text: instruction.raw_text.trim() };
}

async function insertInstructionRows(
  trx: Transaction<DatabaseSchema>,
  recipeVersionId: string,
  instructions: RecipeInstructionInput[],
): Promise<void> {
  if (!instructions.length) return;
  await trx
    .insertInto("recipe_version_steps")
    .values(
      instructions.map((instruction, index) => {
        const normalized = normalizeInstructionForStorage(instruction);
        return {
          id:
            "id" in instruction && typeof instruction.id === "string"
              ? instruction.id
              : uuidv7(),
          recipe_version_id: recipeVersionId,
          position: index + 1,
          ...normalized,
        };
      }),
    )
    .execute();
}

function normalizeRecipeVersionNotes(notes?: string | null): string | null {
  const value = notes?.trim();
  return value ? value : null;
}
