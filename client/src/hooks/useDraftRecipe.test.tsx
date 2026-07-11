import { renderHook, act, waitFor } from "@testing-library/react";
import { useDraftRecipe } from "./useDraftRecipe";
import type { Recipe } from "../types/recipe";

function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "recipe-1",
    title: "Pasta",
    tags: [
      { id: 1, name: "Dinner", color: "#ff0000" },
      { id: 2, name: "Quick", color: "#00ff00" },
    ],
    versions: [
      {
        id: "version-1",
        description: "Original version",
        notes: "",
        ingredients: [
          {
            id: "ingredient-recipe-1-0",
            position: 1,
            raw_text: "pasta",
            completed: false,
            ingredient_name: "pasta",
            quantity_value: null,
            quantity_text: null,
            unit: null,
            alternate_quantity_value: null,
            alternate_quantity_text: null,
            alternate_unit: null,
            note: null,
            is_optional: false,
          },
        ],
        instructions: [
          {
            id: "instruction-recipe-1-0",
            position: 1,
            raw_text: "Boil water",
            completed: false,
          },
        ],
        recipeDetails: {
          calories: null,
          servings: 2,
          total_time: 20,
        },
        source: {
          type: "instruction",
          value: "original prompt",
          summary: "original prompt",
        },
      },
    ],
    created_at: null,
    ...overrides,
  };
}

describe("useDraftRecipe", () => {
  it("initializes the draft when edit mode is enabled", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    // Assert
    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    expect(result.current.draft).toEqual({
      recipe_id: "recipe-1",
      id: "version-1",
      title: "Pasta",
      created_at: null,
      tags: recipe.tags,
      description: "Original version",
      notes: "",
      ingredients: [
        expect.objectContaining({
          id: "ingredient-recipe-1-0",
          raw_text: "pasta",
          ingredient_name: "pasta",
          position: 1,
          completed: false,
        }),
      ],
      instructions: [
        {
          id: "instruction-recipe-1-0",
          position: 1,
          raw_text: "Boil water",
          completed: false,
        },
      ],
      recipeDetails: {
        calories: null,
        servings: 2,
        total_time: 20,
      },
      source: {
        type: "instruction",
        value: "original prompt",
        summary: "original prompt",
      },
    });
  });

  it("initializes the draft from the selected recipe version", async () => {
    // Arrange
    const recipe = createRecipe({
      versions: [
        createRecipe().versions[0],
        {
          ...createRecipe().versions[0],
          id: "version-2",
          description: "Updated version",
          recipeDetails: {
            calories: 450,
            servings: 4,
            total_time: 25,
          },
          source: {
            type: "instruction",
            value: "updated prompt",
            summary: "updated prompt",
          },
        },
      ],
    });

    const { result } = renderHook(() =>
      //TO DO: isEditModal should be isEditMode or isEditing
      useDraftRecipe({ recipe, recipeVersion: 1, isEditModalOpen: true }),
    );

    // Assert
    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    expect(result.current.draft).toEqual({
      recipe_id: "recipe-1",
      id: "version-2",
      title: "Pasta",
      created_at: null,
      tags: recipe.tags,
      description: "Updated version",
      notes: "",
      ingredients: [
        expect.objectContaining({
          id: "ingredient-recipe-1-0",
          raw_text: "pasta",
          ingredient_name: "pasta",
          position: 1,
          completed: false,
        }),
      ],
      instructions: [
        {
          id: "instruction-recipe-1-0",
          position: 1,
          raw_text: "Boil water",
          completed: false,
        },
      ],
      recipeDetails: {
        calories: 450,
        servings: 4,
        total_time: 25,
      },
      source: {
        type: "instruction",
        value: "updated prompt",
        summary: "updated prompt",
      },
    });
  });

  it("updates the draft title", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    // Assert
    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftString("title", "Updated Pasta");
    });

    // Assert
    expect(result.current.draft).toMatchObject({
      title: "Updated Pasta",
    });
  });

  it("updates a draft recipe detail", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    // Assert
    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftDetail("servings", "4");
    });

    // Assert
    expect(result.current.draft).toMatchObject({
      recipeDetails: {
        calories: null,
        servings: "4",
        total_time: 20,
      },
    });
  });

  it("prevents tag duplication", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftTagAdd({
        name: "dinner",
        color: "#999999",
      });
    });

    // Assert
    expect(result.current.draft?.tags).toEqual([
      { id: 1, name: "Dinner", color: "#ff0000" },
      { id: 2, name: "Quick", color: "#00ff00" },
    ]);
  });

  it("updates a draft tag name", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftTagName("Lunch", 1);
    });

    // Assert
    expect(result.current.draft?.tags).toEqual([
      { id: 1, name: "Lunch", color: "#ff0000" },
      { id: 2, name: "Quick", color: "#00ff00" },
    ]);
  });

  it("updates a draft tag color", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftTagColor(
        { hex: "#123456" },
        { id: 1, name: "Dinner", color: "#ff0000" },
      );
    });

    // Assert
    expect(result.current.draft?.tags).toEqual([
      { id: 1, name: "Dinner", color: "#123456" },
      { id: 2, name: "Quick", color: "#00ff00" },
    ]);
  });

  it("deletes a draft tag", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftTagDelete(2);
    });

    // Assert
    expect(result.current.draft?.tags).toEqual([
      { id: 1, name: "Dinner", color: "#ff0000" },
    ]);
  });

  it("updates a draft instruction", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftInstructionUpdate("Dice onions", 0);
    });

    // Assert
    expect(result.current.draft?.instructions).toEqual([
      expect.objectContaining({ raw_text: "Dice onions", position: 1 }),
    ]);
  });

  it("appends a draft instruction", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftArrayPush("instructions", "Dice Tomatoes");
    });

    // Assert
    expect(result.current.draft?.instructions).toEqual([
      expect.objectContaining({ raw_text: "Boil water", position: 1 }),
      expect.objectContaining({ raw_text: "Dice Tomatoes", position: 2 }),
    ]);
  });

  it("deletes a draft instruction", async () => {
    // Arrange
    const recipe = createRecipe();

    const { result } = renderHook(() =>
      useDraftRecipe({ recipe, recipeVersion: 0, isEditModalOpen: true }),
    );

    await waitFor(() => {
      expect(result.current.draft).not.toBeNull();
    });

    // Act
    act(() => {
      result.current.handleDraftArrayDelete("instructions", 0);
    });

    // Assert
    expect(result.current.draft?.instructions).toEqual([]);
  });
});
