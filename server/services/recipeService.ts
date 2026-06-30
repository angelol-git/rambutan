import db from "../db.js";
import type {
  CountRow,
  IngredientRow,
  InstructionRow,
  RecipeId,
  RecipeRow,
  RecipeTagAssociationRow,
  RecipeTagRow,
  RecipeVersionRow,
  SortOrder,
  UserId,
  VersionId,
} from "./db.types.js";
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

type GetRecipesByUserIdOptions = {
  page: number;
  pageSize: number;
};

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

export function getRecipesByUserId(
  userId: UserId,
  { page, pageSize }: GetRecipesByUserIdOptions,
): PaginatedRecipesResult {
  const offset = (page - 1) * pageSize;

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as count
      FROM recipes
      WHERE user_id = ?`,
    )
    .get(userId) as CountRow | undefined;

  const totalItems = totalRow?.count ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const recipes = db
    .prepare(
      `SELECT id, title, created_at
       FROM recipes
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(userId, pageSize, offset) as RecipeRow[];

  if (recipes.length === 0) {
    return {
      items: [],
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  const recipeIds = recipes.map((recipe) => recipe.id);

  const versions = db
    .prepare(
      `SELECT id, recipe_id, version_number, servings, total_time, calories,
              description, notes, source_type, source_value, source_summary, ai_model, created_at
       FROM recipe_versions
       WHERE recipe_id IN (${recipeIds.map(() => "?").join(", ")})
       ORDER BY recipe_id ASC, version_number ASC`,
    )
    .all(...recipeIds) as RecipeVersionRow[];

  const versionIds = versions.map((version) => version.id);
  const ingredientsMap = getVersionIngredientsMap(versionIds);
  const instructionsMap = getVersionInstructionsMap(versionIds);

  const tags = db
    .prepare(
      `SELECT rt.recipe_id, t.id, t.name, t.color
       FROM recipe_tags rt
       JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id IN (${recipeIds.map(() => "?").join(", ")})`,
    )
    .all(...recipeIds) as RecipeTagAssociationRow[];

  const mappedVersions = mapRecipeVersions(
    versions,
    ingredientsMap,
    instructionsMap,
  );
  const versionsMap = new Map<RecipeId, RecipeVersion[]>();
  for (const [index, version] of versions.entries()) {
    const recipeVersions = versionsMap.get(version.recipe_id) ?? [];
    recipeVersions.push(mappedVersions[index]);
    versionsMap.set(version.recipe_id, recipeVersions);
  }

  const tagsMap = new Map<RecipeId, RecipeTag[]>();
  for (const tag of tags) {
    const recipeTags = tagsMap.get(tag.recipe_id) ?? [];
    recipeTags.push(toRecipeTag(tag));
    tagsMap.set(tag.recipe_id, recipeTags);
  }

  const items = recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title ?? "",
    created_at: recipe.created_at,
    versions: versionsMap.get(recipe.id) ?? [],
    tags: tagsMap.get(recipe.id) ?? [],
  }));

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export function getRecipeById(id: RecipeId, userId: UserId): Recipe | null {
  return buildRecipeResponse(id, userId, "ASC");
}

export function deleteRecipe(id: RecipeId, userId: UserId): boolean {
  const result = db
    .prepare(`DELETE FROM recipes WHERE id = ? AND user_id = ?`)
    .run(id, userId);
  return result.changes > 0;
}

export function updateRecipeMetadata(
  id: RecipeId,
  userId: UserId,
  updatedRecipe: UpdateRecipeMetadataInput,
): UpdateRecipeMetadataResult {
  return db.transaction((): UpdateRecipeMetadataResult => {
    const updated = db
      .prepare(
        `UPDATE recipes
         SET title = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?
         RETURNING id`,
      )
      .get(updatedRecipe.title, id, userId);

    if (!updated) {
      return { success: false, error: "Recipe not found" };
    }

    return { success: true };
  })();
}

function toRecipeTag(tag: RecipeTagRow): RecipeTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

function normalizeOrder(order: SortOrder): SortOrder {
  return order === "DESC" ? "DESC" : "ASC";
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

function getVersionIngredientsMap(
  versionIds: VersionId[],
): Map<VersionId, RecipeIngredient[]> {
  const ingredientsMap = new Map<VersionId, RecipeIngredient[]>();

  if (versionIds.length === 0) {
    return ingredientsMap;
  }

  const rows = db
    .prepare(
      `SELECT id, recipe_version_id, position, raw_text, ingredient_name,
              quantity_value, quantity_text, unit,
              alternate_quantity_value, alternate_quantity_text, alternate_unit,
              note, is_optional
       FROM recipe_version_ingredients
       WHERE recipe_version_id IN (${versionIds.map(() => "?").join(", ")})
       ORDER BY recipe_version_id ASC, position ASC`,
    )
    .all(...versionIds) as IngredientRow[];

  for (const row of rows) {
    const ingredients = ingredientsMap.get(row.recipe_version_id) ?? [];
    ingredients.push({
      id: row.id,
      position: row.position,
      raw_text: row.raw_text,
      completed: false,
      ingredient_name: row.ingredient_name,
      quantity_value: row.quantity_value ?? null,
      quantity_text: row.quantity_text ?? null,
      unit: row.unit ?? null,
      alternate_quantity_value: row.alternate_quantity_value ?? null,
      alternate_quantity_text: row.alternate_quantity_text ?? null,
      alternate_unit: row.alternate_unit ?? null,
      note: row.note ?? null,
      is_optional: Boolean(row.is_optional),
    });
    ingredientsMap.set(row.recipe_version_id, ingredients);
  }

  return ingredientsMap;
}

function getVersionInstructionsMap(
  versionIds: VersionId[],
): Map<VersionId, RecipeInstruction[]> {
  const instructionsMap = new Map<VersionId, RecipeInstruction[]>();

  if (versionIds.length === 0) {
    return instructionsMap;
  }

  const rows = db
    .prepare(
      `SELECT id, recipe_version_id, position, raw_text
       FROM recipe_version_steps
       WHERE recipe_version_id IN (${versionIds.map(() => "?").join(", ")})
       ORDER BY recipe_version_id ASC, position ASC`,
    )
    .all(...versionIds) as InstructionRow[];

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

function mapRecipeVersions(
  versions: RecipeVersionRow[],
  ingredientsMap: Map<VersionId, RecipeIngredient[]>,
  instructionsMap: Map<VersionId, RecipeInstruction[]>,
): RecipeVersion[] {
  return versions.map((version) => ({
    id: version.id,
    recipeDetails: {
      calories: version.calories ?? null,
      servings: version.servings ?? null,
      total_time: version.total_time ?? null,
    },
    description: version.description ?? "",
    notes: version.notes ?? "",
    instructions: instructionsMap.get(version.id) ?? [],
    ingredients: ingredientsMap.get(version.id) ?? [],
    source: toRecipeSource(version),
    ai_model: version.ai_model ?? null,
    created_at: version.created_at,
    version_number: version.version_number,
  }));
}

function getRecipeVersions(
  recipeId: RecipeId,
  order: SortOrder = "ASC",
): RecipeVersion[] {
  const normalizedOrder = normalizeOrder(order);

  const versions = db
    .prepare(
      `SELECT id, recipe_id, version_number, servings, total_time, calories,
              description, notes, source_type, source_value, source_summary, ai_model, created_at
       FROM recipe_versions
       WHERE recipe_id = ?
       ORDER BY version_number ${normalizedOrder}`,
    )
    .all(recipeId) as RecipeVersionRow[];

  const versionIds = versions.map((version) => version.id);
  const ingredientsMap = getVersionIngredientsMap(versionIds);
  const instructionsMap = getVersionInstructionsMap(versionIds);

  return mapRecipeVersions(versions, ingredientsMap, instructionsMap);
}

function buildRecipeResponse(
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

function toRecipeSource(version: RecipeVersionRow): RecipeSource | null {
  if (
    version.source_type == null ||
    version.source_value == null ||
    version.source_summary == null
  ) {
    return null;
  }

  return {
    type: version.source_type,
    value: version.source_value,
    summary: version.source_summary,
  };
}
