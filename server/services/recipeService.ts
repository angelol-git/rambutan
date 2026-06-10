import db from "../db.js";
import { v7 as uuidv7 } from "uuid";
import type { ParsedAiRecipe } from "./aiService.js";
import type {
  CountRow,
  ExistingTextIdRow,
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
  RecipeTag,
  RecipeVersion,
} from "./recipe.types.js";
import type { UpdateRecipeBody } from "../validation/recipeSchemas.js";
import { normalizeIngredientUnit } from "../utils/ingredientParser.js";

type UpdateRecipeInput = UpdateRecipeBody["updatedRecipe"];
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

type UpdateRecipeResult = { success: true } | { success: false; error: string };

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

    //New recipe
    if (!recipeId) {
      db.prepare(
        `INSERT INTO recipes (id, user_id, title, source_url)
         VALUES (?, ?, ?, ?)`,
      ).run(newRecipeId, userId, parsedRecipe.title, sourceUrl ?? null);
    }
    //TO DO: We are always updating?
    else {
      db.prepare(
        `UPDATE recipes
         SET title = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
      ).run(parsedRecipe.title, newRecipeId, userId);
    }

    const newVersionId = uuidv7();
    const versionNumber = getNextVersionNumber(newRecipeId);

    db.prepare(
      `INSERT INTO recipe_versions (
         id,
         recipe_id,
         version_number,
         servings,
         total_time,
         calories,
         description,
         source_prompt,
         ai_model,
         relation
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      newVersionId,
      newRecipeId,
      versionNumber,
      parsedRecipe.servings,
      parsedRecipe.total_time,
      parsedRecipe.calories,
      parsedRecipe.description,
      parsedRecipe.source_prompt,
      parsedRecipe.ai_model,
      parsedRecipe.relation ?? "reply",
    );

    insertIngredientRows(newVersionId, parsedRecipe.ingredients);
    insertInstructionRows(newVersionId, parsedRecipe.instructions);

    //TO DO: should I be saving messages in this function/service?
    db.prepare(
      `INSERT INTO messages (user_id, recipe_id, recipe_version_id, role, content, status)
       VALUES (?, ?, ?, 'assistant', ?, 'recipe')`,
    ).run(userId, newRecipeId, newVersionId, JSON.stringify(parsedRecipe));

    parsedRecipe.versionId = newVersionId;

    return buildRecipeResponse(newRecipeId, userId);
  })();
}

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
              description, source_prompt, ai_model, created_at
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
  return buildRecipeResponse(id, userId, "DESC");
}

export function deleteRecipeVersion(id: VersionId, userId: UserId): boolean {
  const version = db
    .prepare(
      `
    SELECT rv.id FROM recipe_versions rv
    JOIN recipes r ON rv.recipe_id = r.id
    WHERE rv.id = ? AND r.user_id = ?
  `,
    )
    .get(id, userId) as ExistingTextIdRow | undefined;

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

//TO DO: Currently saving everything and updating at every change?
//Would be better to split into different functions per category
export function updateRecipe(
  id: RecipeId,
  userId: UserId,
  updatedRecipe: UpdateRecipeInput,
): UpdateRecipeResult {
  return db.transaction((): UpdateRecipeResult => {
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

    const version = db
      .prepare(
        `SELECT rv.id
         FROM recipe_versions rv
         JOIN recipes r ON rv.recipe_id = r.id
         WHERE rv.id = ? AND rv.recipe_id = ? AND r.user_id = ?`,
      )
      .get(String(updatedRecipe.id), id, userId) as
      | ExistingTextIdRow
      | undefined;

    if (!version) {
      return { success: false, error: "Recipe version not found" };
    }

    db.prepare(
      `UPDATE recipe_versions
       SET servings = ?,
           total_time = ?,
           calories = ?,
           description = ?,
           source_prompt = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND recipe_id = ?`,
    ).run(
      updatedRecipe.recipeDetails.servings ?? null,
      updatedRecipe.recipeDetails.total_time ?? null,
      updatedRecipe.recipeDetails.calories ?? null,
      updatedRecipe.description ?? null,
      updatedRecipe.source_prompt ?? null,
      String(updatedRecipe.id),
      id,
    );

    replaceRecipeVersionIngredientsAndSteps(
      String(updatedRecipe.id),
      updatedRecipe.ingredients,
      updatedRecipe.instructions,
    );

    const resolvedTagIds: number[] = [];

    for (const tag of updatedRecipe.tags ?? []) {
      const existingTagById = db
        .prepare(`SELECT id FROM tags WHERE id = ? AND user_id = ?`)
        .get(tag.id, userId) as { id: number } | undefined;

      if (existingTagById) {
        db.prepare(
          `UPDATE tags
           SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
        ).run(tag.name, tag.color, existingTagById.id, userId);

        resolvedTagIds.push(existingTagById.id);
        continue;
      }

      const existingTagByName = db
        .prepare(`SELECT id FROM tags WHERE user_id = ? AND name = ?`)
        .get(userId, tag.name) as { id: number } | undefined;

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
    instructions: instructionsMap.get(version.id) ?? [],
    ingredients: ingredientsMap.get(version.id) ?? [],
    source_prompt: version.source_prompt ?? "",
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
              description, source_prompt, ai_model, created_at
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

//TO DO: could pass in the latest version number instead of a query?
function getNextVersionNumber(recipeId: RecipeId): number {
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(version_number), 0) as count
       FROM recipe_versions
       WHERE recipe_id = ?`,
    )
    .get(recipeId) as CountRow | undefined;

  return (row?.count ?? 0) + 1;
}

function normalizeIngredientForStorage(
  ingredient:
    | UpdateRecipeInput["ingredients"][number]
    | ParsedAiRecipe["ingredients"][number],
): Omit<RecipeIngredient, "id" | "position"> {
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

function insertIngredientRows(
  recipeVersionId: VersionId,
  ingredients: Array<
    | UpdateRecipeInput["ingredients"][number]
    | ParsedAiRecipe["ingredients"][number]
  >,
): void {
  const insertIngredient = db.prepare(
    `INSERT INTO recipe_version_ingredients (
       id,
       recipe_version_id,
       position,
       raw_text,
       ingredient_name,
       quantity_value,
       quantity_text,
       unit,
       alternate_quantity_value,
       alternate_quantity_text,
       alternate_unit,
       note,
       is_optional
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const [index, ingredient] of ingredients.entries()) {
    const normalized = normalizeIngredientForStorage(ingredient);
    insertIngredient.run(
      uuidv7(),
      recipeVersionId,
      index + 1,
      normalized.raw_text,
      normalized.ingredient_name,
      normalized.quantity_value,
      normalized.quantity_text,
      normalized.unit,
      normalized.alternate_quantity_value,
      normalized.alternate_quantity_text,
      normalized.alternate_unit,
      normalized.note,
      normalized.is_optional ? 1 : 0,
    );
  }
}

function normalizeInstructionForStorage(
  instruction:
    | UpdateRecipeInput["instructions"][number]
    | ParsedAiRecipe["instructions"][number],
): Omit<RecipeInstruction, "id" | "position"> {
  return {
    raw_text: instruction.raw_text.trim(),
  };
}

function insertInstructionRows(
  recipeVersionId: VersionId,
  instructions: Array<
    | UpdateRecipeInput["instructions"][number]
    | ParsedAiRecipe["instructions"][number]
  >,
): void {
  const insertInstruction = db.prepare(
    `INSERT INTO recipe_version_steps (
       id,
       recipe_version_id,
       position,
       raw_text
     ) VALUES (?, ?, ?, ?)`,
  );

  for (const [index, instruction] of instructions.entries()) {
    const normalized = normalizeInstructionForStorage(instruction);
    insertInstruction.run(
      uuidv7(),
      recipeVersionId,
      index + 1,
      normalized.raw_text,
    );
  }
}

function replaceRecipeVersionIngredientsAndSteps(
  recipeVersionId: VersionId,
  ingredients: UpdateRecipeInput["ingredients"],
  instructions: UpdateRecipeInput["instructions"],
): void {
  db.prepare(
    `DELETE FROM recipe_version_ingredients WHERE recipe_version_id = ?`,
  ).run(recipeVersionId);
  db.prepare(
    `DELETE FROM recipe_version_steps WHERE recipe_version_id = ?`,
  ).run(recipeVersionId);

  insertIngredientRows(recipeVersionId, ingredients);
  insertInstructionRows(recipeVersionId, instructions);
}
