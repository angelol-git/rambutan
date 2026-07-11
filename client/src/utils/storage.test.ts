// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLocalRecipes,
  addLocalRecipeTag,
  updateLocalRecipe,
  deleteLocalRecipeVersion,
  deleteLocalRecipeAll,
  editLocalTagsAll,
  deleteLocalTagsAll,
  getRecipeCompletionState,
  saveRecipeCompletionState,
} from "./storage";
import type { Recipe, RecipeVersion, UpdateRecipeInput } from "../types/recipe";
import type { Tag } from "../types/tag";

const GUEST_RECIPES_STORAGE_KEY = "rambutan-guest-recipes";
const RECIPE_COMPLETION_STORAGE_KEY = "rambutan-recipe-completions";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    title: "Blueberry Cake",
    created_at: "2026-04-10T23:49:41.354Z",
    tags: [],
    versions: [],
    ...overrides,
  };
}

function makeRecipeVersion(
  versionNumber = 1,
  overrides: Partial<RecipeVersion> = {},
): RecipeVersion {
  const isFirstVersion = versionNumber === 1;

  return {
    id: `version-${versionNumber}`,
    description: isFirstVersion
      ? "A simple and delicious blueberry cake."
      : "An older version.",
    notes: "",
    recipeDetails: {
      calories: isFirstVersion ? 376 : 420,
      servings: isFirstVersion ? 6 : 8,
      total_time: isFirstVersion ? 60 : 75,
      ...overrides.recipeDetails,
    },
    ingredients: [
      {
        id: `ingredient-${versionNumber * 2 - 1}`,
        position: 1,
        raw_text: isFirstVersion ? "2 cups flour" : "3 cups flour",
        completed: false,
        ingredient_name: "flour",
        quantity_value: isFirstVersion ? 2 : 3,
        quantity_text: isFirstVersion ? "2" : "3",
        unit: "cups",
        alternate_quantity_value: null,
        alternate_quantity_text: null,
        alternate_unit: null,
        note: null,
        is_optional: false,
      },
    ],
    instructions: [
      {
        id: `instruction-${versionNumber * 2 - 1}`,
        position: 1,
        raw_text: isFirstVersion ? "Mix the batter" : "mix",
        completed: false,
      },
    ],
    source: isFirstVersion
      ? {
          type: "url",
          value: "https://www.simplyrecipes.com/recipes/blueberry_cake/",
          summary: "simplyrecipes.com",
        }
      : {
          type: "instruction",
          value: "older prompt",
          summary: "older prompt",
        },
    ...overrides,
  };
}

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 1,
    name: "Dessert",
    color: "#FFB86C",
    ...overrides,
  };
}

function seedGuestRecipes(recipes: Recipe[]) {
  localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

describe("getLocalRecipes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns valid localStorage data", () => {
    seedGuestRecipes([makeRecipe({ versions: [makeRecipeVersion()] })]);

    const recipes = getLocalRecipes();
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe("Blueberry Cake");
  });

  it("returns guest recipes with newest recipes first", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({
        id: "recipe-older",
        title: "Older Recipe",
        created_at: "2026-04-01T12:00:00.000Z",
      }),
      makeRecipe({
        id: "recipe-newer",
        title: "Newer Recipe",
        created_at: "2026-05-01T12:00:00.000Z",
      }),
    ]);

    // Act
    const recipes = getLocalRecipes();

    // Assert
    expect(recipes.map((recipe) => recipe.id)).toEqual([
      "recipe-newer",
      "recipe-older",
    ]);
  });

  it("clears localStorage when stored JSON is invalid", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, "{invalid-json}");

    // Act
    const recipes = getLocalRecipes();

    // Assert
    expect(recipes).toEqual([]);
    expect(localStorage.getItem(GUEST_RECIPES_STORAGE_KEY)).toBeNull();

    vi.restoreAllMocks();
  });

  it("clears localStorage when the stored data is not an array", () => {
    localStorage.setItem(
      GUEST_RECIPES_STORAGE_KEY,
      JSON.stringify({ id: "recipe-1" }),
    );

    const recipes = getLocalRecipes();

    expect(recipes).toEqual([]);
    expect(localStorage.getItem(GUEST_RECIPES_STORAGE_KEY)).toBeNull();
  });
});

describe("addLocalRecipeTag", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("rejects duplicate tags", () => {
    // Arrange
    seedGuestRecipes([makeRecipe()]);

    addLocalRecipeTag("recipe-1", {
      name: "Dessert",
      color: "#FFB86C",
    });

    // Act
    const result = addLocalRecipeTag("recipe-1", {
      name: "DESSERT",
      color: "#FFB86C",
    });

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Tag already exists on this recipe",
    });
  });

  it("reuses an existing tag from another recipe", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({ tags: [makeTag()] }),
      makeRecipe({
        id: "recipe-2",
        title: "Pancakes",
      }),
    ]);

    // Act
    const result = addLocalRecipeTag("recipe-2", {
      name: "Dessert",
      color: "#000000",
    });

    const recipes = getLocalRecipes();
    const updatedRecipe = recipes.find((recipe) => recipe.id === "recipe-2");

    // Assert
    expect(result).toEqual({
      success: true,
      tag: makeTag(),
    });

    expect(updatedRecipe?.tags).toEqual([makeTag()]);
  });
});

describe("updateLocalRecipe", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates only the targeted version and preserves the rest of the recipe", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag()],
        versions: [makeRecipeVersion(), makeRecipeVersion(2)],
      }),
    ]);

    const updateInput = {
      description: "Updated blueberry cake description.",
      notes: "",
      ingredients: [
        {
          id: "ingredient-1",
          position: 1,
          raw_text: "2 cups flour",
          completed: false,
          ingredient_name: "flour",
          quantity_value: 2,
          quantity_text: "2",
          unit: "cups",
          alternate_quantity_value: null,
          alternate_quantity_text: null,
          alternate_unit: null,
          note: null,
          is_optional: false,
        },
      ],
      instructions: [
        {
          id: "instruction-1",
          position: 1,
          raw_text: "Mix thoroughly",
          completed: false,
        },
      ],
      recipeDetails: {
        calories: 400,
        servings: 8,
        total_time: 70,
      },
      source: {
        type: "instruction" as const,
        value: "updated prompt",
        summary: "updated prompt",
      },
    };

    const recipeUpdate: UpdateRecipeInput = {
      id: "version-1",
      recipe_id: "recipe-1",
      title: "Blueberry Cake 2",
      tags: [makeTag({ id: 2, name: "Breakfast", color: "#00AAFF" })],
      ...updateInput,
    };

    // Act
    updateLocalRecipe(recipeUpdate);

    const recipes = getLocalRecipes();
    const updatedVersion = recipes[0].versions[0];
    const secondVersion = recipes[0].versions[1];

    // Assert
    expect(recipes).toHaveLength(1);
    expect(recipes[0].versions).toHaveLength(2);
    expect(recipes[0].title).toBe("Blueberry Cake 2");
    expect(recipes[0].tags).toEqual([
      makeTag({ id: 2, name: "Breakfast", color: "#00AAFF" }),
    ]);
    expect(updatedVersion).toMatchObject({
      id: "version-1",
      description: updateInput.description,
      notes: updateInput.notes,
      ingredients: updateInput.ingredients,
      instructions: updateInput.instructions,
      recipeDetails: updateInput.recipeDetails,
      source: updateInput.source,
    });
    expect(recipes[0].versions[1]).toEqual(secondVersion);
  });
});

describe("deleteLocalRecipeVersion", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("deletes only the selected version", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag()],
        versions: [makeRecipeVersion(), makeRecipeVersion(2)],
      }),
    ]);

    // Act
    deleteLocalRecipeVersion("recipe-1", "version-2");

    // Assert
    const recipes = getLocalRecipes();
    const result = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result?.versions).toEqual([makeRecipeVersion()]);
  });
});

describe("deleteLocalRecipeAll", () => {
  it("deletes all recipes", () => {
    seedGuestRecipes([makeRecipe()]);

    deleteLocalRecipeAll("recipe-1");
    const recipes = getLocalRecipes();
    expect(recipes).toHaveLength(0);
  });
});

describe("editLocalTagsAll", () => {
  it("editing one shared tag id updates that tag on multiple recipes and does not change unrelated tags", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag(), makeTag({ id: 2, name: "Sweet" })],
      }),
      makeRecipe({
        id: "recipe-2",
        tags: [makeTag()],
      }),
    ]);

    // Act
    editLocalTagsAll([
      {
        id: 1,
        name: "Fresh Dessert",
        color: "#FFB86C",
      },
    ]);

    // Assert
    const recipes = getLocalRecipes();
    const result1 = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result1?.tags).toEqual([
      makeTag({ name: "Fresh Dessert" }),
      makeTag({ id: 2, name: "Sweet" }),
    ]);
    const result2 = recipes.find((recipe) => recipe.id === "recipe-2");
    expect(result2?.tags).toEqual([makeTag({ name: "Fresh Dessert" })]);
  });

  it("keeps existing color when only name is updated", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag()],
      }),
    ]);

    // Act
    editLocalTagsAll([
      {
        id: 1,
        name: "Sweet",
      },
    ]);

    // Assert
    const recipes = getLocalRecipes();
    const result = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result?.tags).toEqual([makeTag({ name: "Sweet" })]);
  });
});

describe("deleteLocalTagsAll", () => {
  it("deletes all tags in recipe", () => {
    // Arrange
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag(), makeTag({ id: 2, name: "Sweet" })],
      }),
      makeRecipe({
        id: "recipe-2",
        tags: [makeTag()],
      }),
    ]);

    // Act
    deleteLocalTagsAll([1]);

    // Assert
    const recipes = getLocalRecipes();
    const result1 = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result1?.tags).toEqual([makeTag({ id: 2, name: "Sweet" })]);
    const result2 = recipes.find((recipe) => recipe.id === "recipe-2");
    expect(result2?.tags).toEqual([]);
  });
});

describe("recipe ingredient and instruction completion storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores ingredient and instruction completion state per recipe version", () => {
    // Act
    saveRecipeCompletionState("recipe-1", "version-1", {
      ingredients: { "ingredient-1": true },
      instructions: { "instruction-1": true },
    });

    // Assert
    expect(getRecipeCompletionState("recipe-1", "version-1")).toEqual({
      ingredients: { "ingredient-1": true },
      instructions: { "instruction-1": true },
    });
    expect(localStorage.getItem(RECIPE_COMPLETION_STORAGE_KEY)).toBe(
      JSON.stringify({
        "recipe-1:version-1": {
          ingredients: { "ingredient-1": true },
          instructions: { "instruction-1": true },
        },
      }),
    );
  });

  it("removes empty ingredient and instruction completion state for a recipe version", () => {
    // Arrange
    saveRecipeCompletionState("recipe-1", "version-1", {
      ingredients: { "ingredient-1": true },
      instructions: {},
    });

    // Act
    saveRecipeCompletionState("recipe-1", "version-1", {
      ingredients: {},
      instructions: {},
    });

    // Assert
    expect(getRecipeCompletionState("recipe-1", "version-1")).toEqual({
      ingredients: {},
      instructions: {},
    });
    expect(localStorage.getItem(RECIPE_COMPLETION_STORAGE_KEY)).toBe("{}");
  });
});
