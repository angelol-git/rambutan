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
} from "./storage";
import type { Recipe, RecipeVersion } from "../types/recipe";
import type { Tag } from "../types/tag";

const CREATED_AT = "2026-04-10T23:49:41.354Z";
const GUEST_RECIPES_STORAGE_KEY = "rambutan-guest-recipes";

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "tag-1",
    name: "Dessert",
    color: "#FFB86C",
    ...overrides,
  };
}

function makeRecipeVersion(
  overrides: Partial<RecipeVersion> = {},
): RecipeVersion {
  return {
    id: "version-1",
    recipeDetails: {
      calories: 376,
      servings: 6,
      total_time: 60,
      ...overrides.recipeDetails,
    },
    description: "A simple and delicious blueberry cake.",
    ingredients: ["2 cups flour", "1 cup blueberries"],
    instructions: ["Mix the batter", "Bake at 350F"],
    source_prompt: "https://www.simplyrecipes.com/recipes/blueberry_cake/",
    ...overrides,
  };
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    title: "Blueberry Cake",
    source_url: null,
    created_at: CREATED_AT,
    tags: [],
    versions: [],
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

    const recipes = getLocalRecipes();

    expect(recipes.map((recipe) => recipe.id)).toEqual([
      "recipe-newer",
      "recipe-older",
    ]);
  });

  it("clears localStorage when stored JSON is invalid", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    localStorage.setItem(GUEST_RECIPES_STORAGE_KEY, "{invalid-json}");

    const recipes = getLocalRecipes();

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
    seedGuestRecipes([makeRecipe()]);

    addLocalRecipeTag("recipe-1", {
      name: "Dessert",
      color: "#FFB86C",
    });
    const result = addLocalRecipeTag("recipe-1", {
      name: "DESSERT",
      color: "#FFB86C",
    });

    expect(result).toEqual({
      success: false,
      error: "Tag already exists on this recipe",
    });
  });

  it("reuses an existing tag from another recipe", () => {
    seedGuestRecipes([
      makeRecipe({ tags: [makeTag()] }),
      makeRecipe({
        id: "recipe-2",
        title: "Pancakes",
      }),
    ]);

    const result = addLocalRecipeTag("recipe-2", {
      name: "Dessert",
      color: "#000000",
    });

    const recipes = getLocalRecipes();
    const updatedRecipe = recipes.find((recipe) => recipe.id === "recipe-2");

    expect(result).toEqual({
      success: true,
      tag: {
        id: "tag-1",
        name: "Dessert",
        color: "#FFB86C",
      },
    });

    expect(updatedRecipe?.tags).toEqual([
      {
        id: "tag-1",
        name: "Dessert",
        color: "#FFB86C",
      },
    ]);
  });
});

describe("updateLocalRecipe", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates only the targeted version and preserves the rest of the recipe", () => {
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag()],
        versions: [
          makeRecipeVersion(),
          makeRecipeVersion({
            id: "version-2",
            recipeDetails: {
              calories: 420,
              servings: 8,
              total_time: 75,
            },
            description: "An older version.",
            ingredients: ["3 cups flour", "2 cups blueberries"],
            instructions: ["mix", "bake"],
            source_prompt: "older prompt",
          }),
        ],
      }),
    ]);

    updateLocalRecipe({
      id: "version-1",
      recipe_id: "recipe-1",
      title: "Blueberry Cake 2",
      tags: [
        {
          id: "tag-2",
          name: "Breakfast",
          color: "#00AAFF",
        },
      ],
      description: "Updated blueberry cake description.",
      ingredients: ["2 cups flour", "1.5 cups blueberries"],
      instructions: ["Mix thoroughly", "Bake at 350F for 50 minutes"],
      recipeDetails: {
        calories: 400,
        servings: 8,
        total_time: 70,
      },
      source_prompt: "updated prompt",
    });

    const recipes = getLocalRecipes();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe("Blueberry Cake 2");
    expect(recipes[0].tags).toEqual([
      {
        id: "tag-2",
        name: "Breakfast",
        color: "#00AAFF",
      },
    ]);
    expect(recipes[0].versions).toEqual([
      {
        id: "version-1",
        recipeDetails: {
          calories: 400,
          servings: 8,
          total_time: 70,
        },
        description: "Updated blueberry cake description.",
        ingredients: ["2 cups flour", "1.5 cups blueberries"],
        instructions: ["Mix thoroughly", "Bake at 350F for 50 minutes"],
        source_prompt: "updated prompt",
      },
      {
        id: "version-2",
        recipeDetails: {
          calories: 420,
          servings: 8,
          total_time: 75,
        },
        description: "An older version.",
        ingredients: ["3 cups flour", "2 cups blueberries"],
        instructions: ["mix", "bake"],
        source_prompt: "older prompt",
      },
    ]);
  });
});

describe("deleteLocalRecipeVersion", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("deletes only the selected version", () => {
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag()],
        versions: [
          makeRecipeVersion(),
          makeRecipeVersion({
            id: "version-2",
            recipeDetails: {
              calories: 420,
              servings: 8,
              total_time: 75,
            },
            description: "An older version.",
            ingredients: ["3 cups flour", "2 cups blueberries"],
            instructions: ["mix", "bake"],
            source_prompt: "older prompt",
          }),
        ],
      }),
    ]);

    deleteLocalRecipeVersion("recipe-1", "version-2");
    const recipes = getLocalRecipes();
    const result = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result?.versions[0].id).toEqual("version-1");
  });
});

describe("deleteLocalRecipeAll", () => {
  it("deletes all recipes", () => {
    seedGuestRecipes([makeRecipe({ tags: [makeTag()] })]);

    deleteLocalRecipeAll("recipe-1");
    const recipes = getLocalRecipes();
    expect(recipes).toHaveLength(0);
  });
});

describe("editLocalTagsAll", () => {
  it("editing one shared tag id updates that tag on multiple recipes and does not change unrelated tags", () => {
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag(), makeTag({ id: "tag-2", name: "Sweet" })],
      }),
      makeRecipe({
        id: "recipe-2",
        tags: [makeTag()],
      }),
    ]);

    editLocalTagsAll([
      {
        id: "tag-1",
        name: "Fresh Dessert",
        color: "#FFB86C",
      },
    ]);
    const recipes = getLocalRecipes();
    const result1 = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result1?.tags).toEqual([
      {
        id: "tag-1",
        name: "Fresh Dessert",
        color: "#FFB86C",
      },
      {
        id: "tag-2",
        name: "Sweet",
        color: "#FFB86C",
      },
    ]);
    const result2 = recipes.find((recipe) => recipe.id === "recipe-2");
    expect(result2?.tags).toEqual([
      {
        id: "tag-1",
        name: "Fresh Dessert",
        color: "#FFB86C",
      },
    ]);
  });

  it("keeps existing color when only name is updated", () => {
    seedGuestRecipes([
      makeRecipe({
        tags: [makeTag()],
      }),
    ]);

    editLocalTagsAll([
      {
        id: "tag-1",
        name: "Sweet",
      },
    ]);
    const recipes = getLocalRecipes();
    const result = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result?.tags).toEqual([
      {
        id: "tag-1",
        name: "Sweet",
        color: "#FFB86C",
      },
    ]);
  });
});

describe("deleteLocalTagsAll", () => {
  it("deletes all tags in recipe", () => {
    localStorage.setItem(
      GUEST_RECIPES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "recipe-1",
          title: "Blueberry Cake",
          source_url: null,
          created_at: "2026-04-10T23:49:41.354Z",
          tags: [
            {
              id: "tag-1",
              name: "Dessert",
              color: "#FFB86C",
            },
            {
              id: "tag-2",
              name: "Sweet",
              color: "#FFB86C",
            },
          ],
          versions: [],
        },
        {
          id: "recipe-2",
          title: "Blueberry Cake",
          source_url: null,
          created_at: "2026-04-10T23:49:41.354Z",
          tags: [
            {
              id: "tag-1",
              name: "Dessert",
              color: "#FFB86C",
            },
          ],
          versions: [],
        },
      ]),
    );

    deleteLocalTagsAll(["tag-1"]);
    const recipes = getLocalRecipes();
    const result1 = recipes.find((recipe) => recipe.id === "recipe-1");
    expect(result1?.tags).toEqual([
      {
        id: "tag-2",
        name: "Sweet",
        color: "#FFB86C",
      },
    ]);
    const result2 = recipes.find((recipe) => recipe.id === "recipe-2");
    expect(result2?.tags).toEqual([]);
  });
});
