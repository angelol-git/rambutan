import { describe, expect, it } from "vitest";

import { parseStoredRecipe, parseStoredRecipes } from "./parseStoredRecipe";

describe("parseStoredRecipe", () => {
  it("preserves a recipe already in the canonical shape", () => {
    // Arrange
    const storedRecipe = {
      id: "recipe-1",
      title: "Blueberry Cake",
      created_at: "2026-04-10T23:49:41.354Z",
      tags: [],
      versions: [
        {
          id: "version-1",
          recipeDetails: {
            calories: 376,
            servings: 6,
            total_time: 60,
          },
          description: "A simple and delicious blueberry cake.",
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
              raw_text: "Mix the batter",
              completed: false,
            },
          ],
          source: {
            type: "url",
            value: "https://www.simplyrecipes.com/recipes/blueberry_cake/",
            summary: "simplyrecipes.com",
          },
        },
      ],
    };

    // Act
    const recipe = parseStoredRecipe(storedRecipe);

    // Assert
    expect(recipe).toEqual(storedRecipe);
  });

  it("throws when the recipe does not match the current shape", () => {
    // Arrange
    const storedRecipe = {};

    // Assert
    expect(() => parseStoredRecipe(storedRecipe)).toThrow();
  });
});

describe("parseStoredRecipes", () => {
  it("returns an empty array when the input is not an array", () => {
    // Arrange
    const storedRecipes = {};

    // Act
    const recipes = parseStoredRecipes(storedRecipes);

    // Assert
    expect(recipes).toEqual([]);
  });
});
