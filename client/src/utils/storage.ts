import {
  normalizeStoredRecipe,
  normalizeStoredRecipes,
} from "./normalizeStoredRecipe";
import type { Recipe, UpdateRecipeInput } from "../types/recipe";
import type { DraftTag, EditableTagUpdate, Tag } from "../types/tag";

const GUEST_RECIPES_STORAGE_KEY = "rambutan-guest-recipes";
const RECIPE_COMPLETION_STORAGE_KEY = "rambutan-recipe-completions";

type RecipeCompletionState = {
  ingredients: Record<string, boolean>;
  instructions: Record<string, boolean>;
};

type StoredRecipeCompletionState = Partial<RecipeCompletionState>;
type StoredRecipeCompletionMap = Record<string, StoredRecipeCompletionState>;

function generateId(): string {
  return crypto.randomUUID();
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
  }
}

export function updateLocalRecipe(recipe: UpdateRecipeInput): void {
  const recipes = getLocalRecipes();
  const existingIndex = recipes.findIndex((r) => r.id === recipe.recipe_id);

  if (existingIndex === -1) return;

  const versionIndex = recipes[existingIndex].versions.findIndex(
    (v) => v.id === recipe.id,
  );

  if (versionIndex !== -1) {
    recipes[existingIndex].versions[versionIndex] = {
      ...recipes[existingIndex].versions[versionIndex],
      description: recipe.description,
      notes: recipe.notes,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      recipeDetails: recipe.recipeDetails,
      source: recipe.source,
    };
  }

  recipes[existingIndex] = normalizeStoredRecipe({
    ...recipes[existingIndex],
    title: recipe.title,
    tags: recipe.tags || [],
  });

  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

export function addLocalRecipeTag(
  recipeId: string,
  newTag: DraftTag,
): { success: boolean; error?: string; tag?: Tag } {
  const recipes = getLocalRecipes();
  const recipeIndex = recipes.findIndex((r) => r.id === recipeId);

  if (recipeIndex === -1) {
    return { success: false, error: "Recipe not found" };
  }

  const recipe = recipes[recipeIndex];

  const existingTagOnRecipe = recipe.tags.find(
    (t) => t.name?.toLowerCase() === newTag.name?.toLowerCase(),
  );

  if (existingTagOnRecipe) {
    return { success: false, error: "Tag already exists on this recipe" };
  }

  let tagToUse: Tag | null = null;
  for (const currentRecipe of recipes) {
    const existingTag = currentRecipe.tags.find(
      (t) => t.name?.toLowerCase() === newTag.name?.toLowerCase(),
    );
    if (existingTag) {
      tagToUse = { ...existingTag };
      break;
    }
  }

  if (!tagToUse) {
    tagToUse = {
      id: generateId(),
      name: newTag.name,
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
