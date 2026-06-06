import { renderHook, act, waitFor } from "@testing-library/react";
import { useRecipeAssistant } from "./useRecipeAssistant";
import { submitRecipePrompt } from "../api/kitchen";
import { addLocalRecipe, addLocalRecipeVersion } from "../utils/storage";
import type { Recipe } from "../types/recipe";
import { createQueryClientWrapper } from "../test/queryClient";

const mockShowToast = vi.fn();
const mockUseUser = vi.fn();

vi.mock("../api/kitchen", () => ({
  submitRecipePrompt: vi.fn(),
}));

vi.mock("./useUser", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("../utils/storage", () => ({
  addLocalRecipe: vi.fn(),
  addLocalRecipeVersion: vi.fn(),
}));

function createRecipe({
  id,
  title,
  versionId,
  description,
}: {
  id: string;
  title: string;
  versionId: string;
  description: string;
}): Recipe {
  return {
    id,
    title,
    tags: [],
    versions: [
      {
        id: versionId,
        description,
        ingredients: ["ingredient-1"],
        instructions: ["step-1"],
        recipeDetails: {
          calories: null,
          servings: 2,
          total_time: 20,
        },
        source_prompt: "",
      },
    ],
    created_at: null,
  };
}

describe("useRecipeAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      user: null,
    });
  });

  it("returns the default state on first render", () => {
    const { wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useRecipeAssistant(mockShowToast), {
      wrapper,
    });

    expect(result.current.submitRecipePrompt).toBeTypeOf("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it("restores previous guest recipes from local storage and shows a toast when creating fails", async () => {
    const { queryClient, wrapper } = createQueryClientWrapper();

    const previousRecipes: Recipe[] = [
      createRecipe({
        id: "recipe-1",
        title: "Pasta",
        versionId: "version-1",
        description: "Original version",
      }),
    ];

    const recipesQueryKey = ["recipes", "guest_recipes"];

    queryClient.setQueryData(recipesQueryKey, previousRecipes);

    vi.mocked(submitRecipePrompt).mockRejectedValue({
      message: "Failed to submit prompt",
    });

    const { result } = renderHook(() => useRecipeAssistant(mockShowToast), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.submitRecipePrompt({
          prompt: "Make me a pasta recipe",
        }),
      ).rejects.toEqual({
        message: "Failed to submit prompt",
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Failed to submit prompt",
      "error",
    );

    expect(queryClient.getQueryData(recipesQueryKey)).toEqual(previousRecipes);
  });

  it("appends a new guest recipe to local storage", async () => {
    const { queryClient, wrapper } = createQueryClientWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const existingRecipes: Recipe[] = [
      createRecipe({
        id: "recipe-1",
        title: "Pasta",
        versionId: "version-1",
        description: "Original version",
      }),
    ];
    const newRecipe = createRecipe({
      id: "recipe-2",
      title: "Soup",
      versionId: "version-2",
      description: "Soup version",
    });

    const recipesQueryKey = ["recipes", "guest_recipes"];
    queryClient.setQueryData(recipesQueryKey, existingRecipes);

    vi.mocked(submitRecipePrompt).mockResolvedValue({
      recipe: newRecipe,
    });

    const { result } = renderHook(() => useRecipeAssistant(mockShowToast), {
      wrapper,
    });

    await act(async () => {
      await result.current.submitRecipePrompt({
        prompt: "Make me a soup recipe",
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(recipesQueryKey)).toEqual([
        existingRecipes[0],
        newRecipe,
      ]);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: recipesQueryKey,
    });

    expect(addLocalRecipe).toHaveBeenCalledWith(newRecipe);
    expect(addLocalRecipeVersion).not.toHaveBeenCalled();
  });

  it("stores a new recipe for a logged in user without touching guest storage", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
    });

    const { queryClient, wrapper } = createQueryClientWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const newRecipe = createRecipe({
      id: "recipe-2",
      title: "Soup",
      versionId: "version-1",
      description: "Soup version",
    });

    vi.mocked(submitRecipePrompt).mockResolvedValue({
      recipe: newRecipe,
    });

    const { result } = renderHook(() => useRecipeAssistant(mockShowToast), {
      wrapper,
    });

    await act(async () => {
      await result.current.submitRecipePrompt({
        prompt: "Create a soup recipe",
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["recipes", "user-1"])).toEqual([
        newRecipe,
      ]);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["recipes", "user-1"],
    });
    expect(addLocalRecipe).not.toHaveBeenCalled();
    expect(addLocalRecipeVersion).not.toHaveBeenCalled();
  });

  it("replaces the existing logged in user recipe, invalidates the query, and skips guest storage", async () => {
    mockUseUser.mockReturnValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
    });

    const { queryClient, wrapper } = createQueryClientWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const existingRecipe = createRecipe({
      id: "recipe-1",
      title: "Pasta",
      versionId: "version-1",
      description: "Original version",
    });

    const updatedRecipe: Recipe = {
      ...existingRecipe,
      title: "Updated Pasta",
      versions: [
        ...existingRecipe.versions,
        {
          id: "version-2",
          description: "Updated version",
          ingredients: ["ingredient-1", "ingredient-2"],
          instructions: ["step-1", "step-2"],
          recipeDetails: {
            calories: null,
            servings: 4,
            total_time: 30,
          },
          source_prompt: "",
        },
      ],
    };

    queryClient.setQueryData(["recipes", "user-1"], [existingRecipe]);

    vi.mocked(submitRecipePrompt).mockResolvedValue({
      recipe: updatedRecipe,
    });

    const { result } = renderHook(() => useRecipeAssistant(mockShowToast), {
      wrapper,
    });

    await act(async () => {
      await result.current.submitRecipePrompt({
        recipeId: existingRecipe.id,
        recipeVersion: existingRecipe.versions[0],
        prompt: "Improve this recipe",
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["recipes", "user-1"])).toEqual([
        updatedRecipe,
      ]);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["recipes", "user-1"],
    });
    expect(addLocalRecipe).not.toHaveBeenCalled();
    expect(addLocalRecipeVersion).not.toHaveBeenCalled();
  });
});
