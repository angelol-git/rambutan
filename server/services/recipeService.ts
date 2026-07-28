import { postgresDb } from "../database/db.js";
import type {
  Recipe,
  RecipeIngredient,
  RecipeInstruction,
  RecipeSource,
  RecipeTag,
  RecipeVersion,
} from "./recipe.types.js";
import type { UpdateRecipeMetadataBody } from "../validation/recipeSchemas.js";

type UpdateRecipeMetadataInput = UpdateRecipeMetadataBody["updatedRecipe"];
type GetRecipesByUserIdOptions = { page: number; pageSize: number };
type PaginatedRecipesResult = {
  items: Recipe[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
type UpdateRecipeMetadataResult =
  | { success: true }
  | { success: false; error: string };

export async function getRecipesByUserId(
  userId: string,
  { page, pageSize }: GetRecipesByUserIdOptions,
): Promise<PaginatedRecipesResult> {
  const offset = (page - 1) * pageSize;
  const [total, recipes] = await Promise.all([
    postgresDb
      .selectFrom("recipes")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow(),
    postgresDb
      .selectFrom("recipes")
      .select(["id", "title", "created_at"])
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      .limit(pageSize)
      .offset(offset)
      .execute(),
  ]);
  const totalItems = Number(total.count);

  if (recipes.length === 0) {
    return {
      items: [],
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  const recipeIds = recipes.map((recipe) => recipe.id);
  const [versions, tags] = await Promise.all([
    postgresDb
      .selectFrom("recipe_versions")
      .select([
        "id",
        "recipe_id",
        "version_number",
        "servings",
        "total_time",
        "calories",
        "description",
        "notes",
        "source_type",
        "source_value",
        "source_summary",
        "ai_model",
        "created_at",
      ])
      .where("recipe_id", "in", recipeIds)
      .orderBy("recipe_id")
      .orderBy("version_number")
      .execute(),
    postgresDb
      .selectFrom("recipe_tags as rt")
      .innerJoin("tags as t", "t.id", "rt.tag_id")
      .select(["rt.recipe_id", "t.id", "t.name", "t.color"])
      .where("rt.recipe_id", "in", recipeIds)
      .execute(),
  ]);
  const versionIds = versions.map((version) => version.id);
  const [ingredientsMap, instructionsMap] = await Promise.all([
    getVersionIngredientsMap(versionIds),
    getVersionInstructionsMap(versionIds),
  ]);
  const versionsMap = new Map<string, RecipeVersion[]>();
  for (const version of mapRecipeVersions(
    versions,
    ingredientsMap,
    instructionsMap,
  )) {
    const recipeVersions = versionsMap.get(version.recipe_id) ?? [];
    recipeVersions.push(version.recipe);
    versionsMap.set(version.recipe_id, recipeVersions);
  }
  const tagsMap = new Map<string, RecipeTag[]>();
  for (const tag of tags) {
    const recipeTags = tagsMap.get(tag.recipe_id) ?? [];
    recipeTags.push({ id: tag.id, name: tag.name, color: tag.color });
    tagsMap.set(tag.recipe_id, recipeTags);
  }
  return {
    items: recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      created_at: recipe.created_at.toISOString(),
      versions: versionsMap.get(recipe.id) ?? [],
      tags: tagsMap.get(recipe.id) ?? [],
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

export async function getRecipeById(
  id: string,
  userId: string,
): Promise<Recipe | null> {
  const recipe = await postgresDb
    .selectFrom("recipes")
    .select(["id", "title", "created_at"])
    .where("id", "=", id)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!recipe) return null;

  const [tags, versions] = await Promise.all([
    postgresDb
      .selectFrom("recipe_tags as rt")
      .innerJoin("tags as t", "t.id", "rt.tag_id")
      .select(["t.id", "t.name", "t.color"])
      .where("rt.recipe_id", "=", id)
      .orderBy("t.id")
      .execute(),
    getRecipeVersions(id),
  ]);
  return {
    id: recipe.id,
    title: recipe.title,
    created_at: recipe.created_at.toISOString(),
    tags,
    versions,
  };
}

export async function deleteRecipe(
  id: string,
  userId: string,
): Promise<boolean> {
  const deleted = await postgresDb
    .deleteFrom("recipes")
    .where("id", "=", id)
    .where("user_id", "=", userId)
    .returning("id")
    .executeTakeFirst();
  return deleted !== undefined;
}

export async function updateRecipeMetadata(
  id: string,
  userId: string,
  updatedRecipe: UpdateRecipeMetadataInput,
): Promise<UpdateRecipeMetadataResult> {
  const updated = await postgresDb
    .updateTable("recipes")
    .set({ title: updatedRecipe.title, updated_at: new Date() })
    .where("id", "=", id)
    .where("user_id", "=", userId)
    .returning("id")
    .executeTakeFirst();
  return updated
    ? { success: true }
    : { success: false, error: "Recipe not found" };
}

async function getVersionIngredientsMap(
  versionIds: string[],
): Promise<Map<string, RecipeIngredient[]>> {
  const ingredientsMap = new Map<string, RecipeIngredient[]>();
  if (!versionIds.length) return ingredientsMap;
  const rows = await postgresDb
    .selectFrom("recipe_version_ingredients")
    .select([
      "id",
      "recipe_version_id",
      "position",
      "raw_text",
      "ingredient_name",
      "quantity_value",
      "quantity_text",
      "unit",
      "alternate_quantity_value",
      "alternate_quantity_text",
      "alternate_unit",
      "note",
      "is_optional",
    ])
    .where("recipe_version_id", "in", versionIds)
    .orderBy("recipe_version_id")
    .orderBy("position")
    .execute();
  for (const row of rows) {
    const ingredients = ingredientsMap.get(row.recipe_version_id) ?? [];
    ingredients.push({ ...row, completed: false });
    ingredientsMap.set(row.recipe_version_id, ingredients);
  }
  return ingredientsMap;
}

async function getVersionInstructionsMap(
  versionIds: string[],
): Promise<Map<string, RecipeInstruction[]>> {
  const instructionsMap = new Map<string, RecipeInstruction[]>();
  if (!versionIds.length) return instructionsMap;
  const rows = await postgresDb
    .selectFrom("recipe_version_steps")
    .select(["id", "recipe_version_id", "position", "raw_text"])
    .where("recipe_version_id", "in", versionIds)
    .orderBy("recipe_version_id")
    .orderBy("position")
    .execute();
  for (const row of rows) {
    const instructions = instructionsMap.get(row.recipe_version_id) ?? [];
    instructions.push({
      id: row.id,
      position: row.position,
      raw_text: row.raw_text,
      completed: false,
    });
    instructionsMap.set(row.recipe_version_id, instructions);
  }
  return instructionsMap;
}

async function getRecipeVersions(
  recipeId: string,
  order: "ASC" | "DESC" = "ASC",
): Promise<RecipeVersion[]> {
  const versions = await postgresDb
    .selectFrom("recipe_versions")
    .select([
      "id",
      "recipe_id",
      "version_number",
      "servings",
      "total_time",
      "calories",
      "description",
      "notes",
      "source_type",
      "source_value",
      "source_summary",
      "ai_model",
      "created_at",
    ])
    .where("recipe_id", "=", recipeId)
    .orderBy("version_number", order === "DESC" ? "desc" : "asc")
    .execute();
  const versionIds = versions.map((version) => version.id);
  const [ingredientsMap, instructionsMap] = await Promise.all([
    getVersionIngredientsMap(versionIds),
    getVersionInstructionsMap(versionIds),
  ]);
  return mapRecipeVersions(versions, ingredientsMap, instructionsMap).map(
    ({ recipe }) => recipe,
  );
}

function mapRecipeVersions(
  versions: Array<{
    id: string;
    recipe_id: string;
    version_number: number;
    servings: number | null;
    total_time: number | null;
    calories: number | null;
    description: string | null;
    notes: string | null;
    source_type: "url" | "instruction" | "raw_text" | null;
    source_value: string | null;
    source_summary: string | null;
    ai_model: string | null;
    created_at: Date;
  }>,
  ingredientsMap: Map<string, RecipeIngredient[]>,
  instructionsMap: Map<string, RecipeInstruction[]>,
): Array<{ recipe_id: string; recipe: RecipeVersion }> {
  return versions.map((version) => ({
    recipe_id: version.recipe_id,
    recipe: {
      id: version.id,
      recipeDetails: {
        calories: version.calories,
        servings: version.servings,
        total_time: version.total_time,
      },
      description: version.description ?? "",
      notes: version.notes ?? "",
      instructions: instructionsMap.get(version.id) ?? [],
      ingredients: ingredientsMap.get(version.id) ?? [],
      source: toRecipeSource(version),
      ai_model: version.ai_model,
      created_at: version.created_at.toISOString(),
      version_number: version.version_number,
    },
  }));
}

function toRecipeSource(version: {
  source_type: "url" | "instruction" | "raw_text" | null;
  source_value: string | null;
  source_summary: string | null;
}): RecipeSource | null {
  if (
    version.source_type === null ||
    version.source_value === null ||
    version.source_summary === null
  )
    return null;
  return {
    type: version.source_type,
    value: version.source_value,
    summary: version.source_summary,
  };
}
