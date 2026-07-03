import {
  normalizeStoredRecipe,
  normalizeStoredRecipes,
} from "./normalizeStoredRecipe";
import type {
  Recipe,
  UpdateRecipeInput,
  UpdateRecipeMetadataInput,
  UpdateRecipeTagsInput,
  UpdateRecipeVersionInput,
} from "../types/recipe";
import type { DraftTag, EditableTagUpdate, Tag } from "../types/tag";

const GUEST_RECIPES_STORAGE_KEY = "rambutan-guest-recipes";
const RECIPE_COMPLETION_STORAGE_KEY = "rambutan-recipe-completions";

type RecipeCompletionState = {
  ingredients: Record<string, boolean>;
  instructions: Record<string, boolean>;
};

type StoredRecipeCompletionState = Partial<RecipeCompletionState>;
type StoredRecipeCompletionMap = Record<string, StoredRecipeCompletionState>;

function normalizeTagName(name: string | null | undefined): string {
  return (name ?? "").trim();
}

function normalizeTagKey(name: string | null | undefined): string {
  return normalizeTagName(name).toLowerCase();
}

function generateTagId(recipes: Recipe[]): number {
  let nextId = 1;

  for (const recipe of recipes) {
    for (const tag of recipe.tags) {
      if (tag.id >= nextId) {
        nextId = tag.id + 1;
      }
    }
  }

  return nextId;
}

function getStoredRecipeCompletionMap(): StoredRecipeCompletionMap {
  const data = localStorage.getItem(RECIPE_COMPLETION_STORAGE_KEY);
  if (!data) return {};

  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn("Recipe completion storage is invalid, clearing");
      localStorage.removeItem(RECIPE_COMPLETION_STORAGE_KEY);
      return {};
    }

    return parsed as StoredRecipeCompletionMap;
  } catch (error) {
    console.error("Failed to parse recipe completion storage:", error);
    localStorage.removeItem(RECIPE_COMPLETION_STORAGE_KEY);
    return {};
  }
}

export function getRecipeCompletionState(
  recipeId: string,
  recipeVersionId: string,
): RecipeCompletionState {
  const completionMap = getStoredRecipeCompletionMap();
  const stored = completionMap[`${recipeId}:${recipeVersionId}`];

  return {
    ingredients: stored?.ingredients ?? {},
    instructions: stored?.instructions ?? {},
  };
}

export function saveRecipeCompletionState(
  recipeId: string,
  recipeVersionId: string,
  completionState: RecipeCompletionState,
): void {
  const completionMap = getStoredRecipeCompletionMap();
  const recipeVersionCompletionKey = `${recipeId}:${recipeVersionId}`;
  const hasCompletedIngredients =
    Object.keys(completionState.ingredients).length > 0;
  const hasCompletedInstructions =
    Object.keys(completionState.instructions).length > 0;

  if (!hasCompletedIngredients && !hasCompletedInstructions) {
    delete completionMap[recipeVersionCompletionKey];
  } else {
    completionMap[recipeVersionCompletionKey] = {
      ingredients: completionState.ingredients,
      instructions: completionState.instructions,
    };
  }

  localStorage.setItem(
    RECIPE_COMPLETION_STORAGE_KEY,
    JSON.stringify(completionMap),
  );
}

export function clearRecipeCompletionState(
  recipeId: string,
  recipeVersionId: string,
): void {
  const completionMap = getStoredRecipeCompletionMap();
  delete completionMap[`${recipeId}:${recipeVersionId}`];
  localStorage.setItem(
    RECIPE_COMPLETION_STORAGE_KEY,
    JSON.stringify(completionMap),
  );
}

export function clearRecipeCompletions(recipeId: string): void {
  const completionMap = getStoredRecipeCompletionMap();

  for (const key of Object.keys(completionMap)) {
    if (key.startsWith(`${recipeId}:`)) {
      delete completionMap[key];
    }
  }

  localStorage.setItem(
    RECIPE_COMPLETION_STORAGE_KEY,
    JSON.stringify(completionMap),
  );
}

export function getLocalRecipes(): Recipe[] {
  const data = localStorage.getItem(GUEST_RECIPES_STORAGE_KEY);
  if (!data) return [];

  try {
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      console.warn("LocalStorage recipes is not an array, clearing");
      localStorage.removeItem(GUEST_RECIPES_STORAGE_KEY);
      return [];
    }

    //TO DO: currently sorted by latest first for guest users
    const normalizedRecipes = normalizeStoredRecipes(parsed);
    normalizedRecipes.sort((left, right) => {
      const leftTimestamp = Date.parse(left.created_at ?? "");
      const rightTimestamp = Date.parse(right.created_at ?? "");

      if (Number.isNaN(leftTimestamp) && Number.isNaN(rightTimestamp)) {
        return 0;
      }

      if (Number.isNaN(leftTimestamp)) {
        return 1;
      }

      if (Number.isNaN(rightTimestamp)) {
        return -1;
      }

      return rightTimestamp - leftTimestamp;
    });
    localStorage.setItem(
      GUEST_RECIPES_STORAGE_KEY,
      JSON.stringify(normalizedRecipes),
    );
    return normalizedRecipes;
  } catch (error) {
    console.error("Failed to parse localStorage recipes:", error);
    localStorage.removeItem(GUEST_RECIPES_STORAGE_KEY);
    return [];
  }
}

export function addLocalRecipe(recipe: Recipe): Recipe {
  const recipes = getLocalRecipes();
  const normalizedRecipe = normalizeStoredRecipe(recipe);
  recipes.push(normalizedRecipe);
  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  return normalizedRecipe;
}

export function addLocalRecipeVersion(recipe: Recipe): Recipe {
  const recipes = getLocalRecipes();
  const normalizedRecipe = normalizeStoredRecipe(recipe);
  const existingIndex = recipes.findIndex((r) => r.id === normalizedRecipe.id);

  if (existingIndex !== -1 && normalizedRecipe.versions.length > 0) {
    const newVersion = normalizedRecipe.versions[0];
    recipes[existingIndex].versions.push(newVersion);
    localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  }

  return normalizedRecipe;
}

export function deleteLocalRecipeAll(id: string): void {
  const recipes = getLocalRecipes().filter((r) => r.id !== id);
  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  clearRecipeCompletions(id);
}

export function deleteLocalRecipeVersion(
  recipeId: string,
  recipeVersionId: string,
): void {
  const recipes = getLocalRecipes();
  const existingIndex = recipes.findIndex((r) => r.id === recipeId);

  if (existingIndex !== -1) {
    recipes[existingIndex].versions = recipes[existingIndex].versions.filter(
      (v) => v.id !== recipeVersionId,
    );
    localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    clearRecipeCompletionState(recipeId, recipeVersionId);
  }
}

export function updateLocalRecipeMetadata(
  recipeUpdate: UpdateRecipeMetadataInput,
): void {
  const recipes = getLocalRecipes();
  const existingIndex = recipes.findIndex(
    (r) => r.id === recipeUpdate.recipeId,
  );

  if (existingIndex === -1) return;

  recipes[existingIndex] = normalizeStoredRecipe({
    ...recipes[existingIndex],
    title: recipeUpdate.title,
  });

  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

export function updateLocalRecipeVersion(
  recipeUpdate: UpdateRecipeVersionInput,
): void {
  const recipes = getLocalRecipes();
  const existingIndex = recipes.findIndex(
    (r) => r.id === recipeUpdate.recipeId,
  );

  if (existingIndex === -1) return;

  const versionIndex = recipes[existingIndex].versions.findIndex(
    (v) => v.id === recipeUpdate.versionId,
  );

  if (versionIndex === -1) return;

  recipes[existingIndex].versions[versionIndex] = {
    ...recipes[existingIndex].versions[versionIndex],
    description: recipeUpdate.description,
    notes: recipeUpdate.notes,
    instructions: recipeUpdate.instructions,
    ingredients: recipeUpdate.ingredients,
    recipeDetails: recipeUpdate.recipeDetails,
    source: recipeUpdate.source,
  };

  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

export function updateLocalRecipeTags(
  recipeUpdate: UpdateRecipeTagsInput,
): void {
  const recipes = getLocalRecipes();
  const existingIndex = recipes.findIndex(
    (r) => r.id === recipeUpdate.recipeId,
  );

  if (existingIndex === -1) return;

  const nextTags: Tag[] = [];
  const seenTagKeys = new Set<string>();

  // Resolve each incoming tag to a single existing tag by normalized name so
  // local recipe tag edits reuse shared tags instead of creating duplicates.
  for (const tag of recipeUpdate.tags || []) {
    const normalizedName = normalizeTagName(tag.name);
    const normalizedKey = normalizeTagKey(tag.name);

    if (!normalizedName || seenTagKeys.has(normalizedKey)) {
      continue;
    }

    seenTagKeys.add(normalizedKey);

    let sharedTag: Tag | undefined;
    for (const recipe of recipes) {
      sharedTag = recipe.tags.find((currentTag) => {
        return normalizeTagKey(currentTag.name) === normalizedKey;
      });

      if (sharedTag) {
        break;
      }
    }

    nextTags.push({
      id: sharedTag?.id ?? tag.id,
      name: sharedTag?.name ?? normalizedName,
      color: sharedTag?.color ?? tag.color,
    });
  }

  recipes[existingIndex] = normalizeStoredRecipe({
    ...recipes[existingIndex],
    tags: nextTags,
  });

  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

export function updateLocalRecipe(recipeUpdate: UpdateRecipeInput): void {
  updateLocalRecipeMetadata({
    recipeId: recipeUpdate.recipe_id,
    title: recipeUpdate.title,
  });
  updateLocalRecipeVersion({
    recipeId: recipeUpdate.recipe_id,
    versionId: recipeUpdate.id,
    description: recipeUpdate.description,
    notes: recipeUpdate.notes,
    instructions: recipeUpdate.instructions,
    ingredients: recipeUpdate.ingredients,
    recipeDetails: recipeUpdate.recipeDetails,
    source: recipeUpdate.source,
  });
  updateLocalRecipeTags({
    recipeId: recipeUpdate.recipe_id,
    tags: recipeUpdate.tags,
  });
}

export function addLocalRecipeTag(
  recipeId: string,
  newTag: DraftTag,
): { success: boolean; error?: string; tag?: Tag } {
  const normalizedName = normalizeTagName(newTag.name);
  const recipes = getLocalRecipes();
  const recipeIndex = recipes.findIndex((r) => r.id === recipeId);

  if (recipeIndex === -1) {
    return { success: false, error: "Recipe not found" };
  }

  const recipe = recipes[recipeIndex];

  const existingTagOnRecipe = recipe.tags.find(
    (t) => normalizeTagKey(t.name) === normalizeTagKey(normalizedName),
  );

  if (existingTagOnRecipe) {
    return { success: false, error: "Tag already exists on this recipe" };
  }

  let tagToUse: Tag | null = null;
  for (const currentRecipe of recipes) {
    const existingTag = currentRecipe.tags.find(
      (t) => normalizeTagKey(t.name) === normalizeTagKey(normalizedName),
    );
    if (existingTag) {
      tagToUse = { ...existingTag };
      break;
    }
  }

  if (!tagToUse) {
    tagToUse = {
      id: generateTagId(recipes),
      name: normalizedName,
      color: newTag.color || "#FFB86C",
    };
  }

  recipes[recipeIndex].tags.push(tagToUse);
  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));

  return { success: true, tag: tagToUse };
}

export function deleteLocalTagsAll(tagIds: Array<Tag["id"]>): {
  success: true;
} {
  const recipes = getLocalRecipes();

  recipes.forEach((recipe) => {
    recipe.tags = recipe.tags.filter((t) => !tagIds.includes(t.id));
  });

  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  return { success: true };
}

export function editLocalTagsAll(updatedTags: EditableTagUpdate[]): {
  success: true;
} {
  const recipes = getLocalRecipes();

  recipes.forEach((recipe) => {
    recipe.tags = recipe.tags.map((tag) => {
      const updatedTag = updatedTags.find((t) => t.id === tag.id);
      if (updatedTag) {
        return {
          ...tag,
          name: updatedTag.name ?? tag.name,
          color: updatedTag.color ?? tag.color,
        };
      }
      return tag;
    });
  });

  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  return { success: true };
}
