import { renderHook, act } from "@testing-library/react";
import { useDeleteRecipe } from "./useDeleteRecipe";
import type { Recipe } from "../types/recipe";

const mockNavigate = vi.fn();
const mockDeleteRecipe = vi.fn();
const mockDeleteRecipeVersion = vi.fn();
const mockOnDeleteVersion = vi.fn();
const mockShowToast = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("./useRecipes", () => ({
  useRecipeMutations: () => ({
    deleteRecipeAsync: mockDeleteRecipe,
    deleteRecipeVersionAsync: mockDeleteRecipeVersion,
  }),
}));

vi.mock("./useToast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const recipe: Recipe = {
  id: "recipe-1",
  title: "Pasta",
  tags: [],
  versions: [
    {
      id: "version-1",
      description: "Original version",
      notes: "",
      ingredients: [
        {
          id: "ingredient-1",
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
          id: "instruction-1",
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
      source: null,
    },
  ],
  created_at: null,
};

const multiVersionRecipe: Recipe = {
  ...recipe,
  versions: [
    ...recipe.versions,
    {
      id: "version-2",
      description: "version 2",
      notes: "",
      ingredients: [
        {
          id: "ingredient-3",
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
          id: "instruction-3",
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
      source: null,
    },
  ],
};

describe("useDeleteRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the delete modal and closes it", () => {
    // Arrange
    const { result } = renderHook(() => useDeleteRecipe());

    // Act
    act(() => {
      result.current.openDeleteModal(recipe, "all");
    });

    // Assert
    expect(result.current.deleteModal).toEqual({
      isOpen: true,
      type: "all",
      recipe,
      recipeVersion: null,
    });

    // Act
    act(() => {
      result.current.closeDeleteModal();
    });

    // Assert
    expect(result.current.deleteModal).toEqual({
      isOpen: false,
      type: "all",
      recipe,
      recipeVersion: null,
    });
  });

  it("deletes the full recipe, navigates, and closes the modal for type all", async () => {
    // Arrange
    const { result } = renderHook(() => useDeleteRecipe());

    act(() => {
      result.current.openDeleteModal(recipe, "all");
    });

    // Act
    await act(async () => {
      await result.current.handleDelete();
    });

    // Assert
    expect(mockDeleteRecipe).toHaveBeenCalledWith("recipe-1");
    expect(mockDeleteRecipeVersion).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");

    expect(result.current.deleteModal).toEqual({
      isOpen: false,
      type: "all",
      recipe,
      recipeVersion: null,
    });
  });

  it("deletes the recipe version and returns to the previous version", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useDeleteRecipe({
        onDeleteVersion: mockOnDeleteVersion,
      }),
    );

    act(() => {
      result.current.openDeleteModal(multiVersionRecipe, "version", 1);
    });

    // Act
    await act(async () => {
      await result.current.handleDelete();
    });

    // Assert
    expect(mockDeleteRecipe).not.toHaveBeenCalledWith();
    expect(mockDeleteRecipeVersion).toHaveBeenCalledWith({
      recipeId: "recipe-1",
      recipeVersionId: "version-2",
    });
    expect(mockOnDeleteVersion).toHaveBeenCalledWith(0);
    expect(mockNavigate).not.toHaveBeenCalled();

    expect(result.current.deleteModal).toEqual({
      isOpen: false,
      type: "version",
      recipe: multiVersionRecipe,
      recipeVersion: 1,
    });
  });
});
