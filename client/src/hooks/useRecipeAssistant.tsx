import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitRecipePrompt,
  type RecipePromptPayload,
  type RecipePromptResponse,
} from "../api/kitchen";
import { addLocalRecipe, addLocalRecipeVersion } from "../utils/storage";
import { useUser } from "./useUser";
import type { Recipe } from "../types/recipe";

type ShowToast = (message: string, type: "success" | "error") => void;

type MutationContext = {
  previousRecipes?: Recipe[];
};

type ApiError = {
  message?: string;
  error?: string;
};

export function useRecipeAssistant(showToast: ShowToast) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const recipesQueryKey = ["recipes", user?.id || "guest_recipes"];

  const submitRecipePromptMutation = useMutation<
    RecipePromptResponse,
    ApiError,
    RecipePromptPayload,
    MutationContext
  >({
    mutationFn: async (
      payload: RecipePromptPayload,
    ): Promise<RecipePromptResponse> => {
      return submitRecipePrompt(payload);
    },

    onMutate: async (): Promise<MutationContext> => {
      await queryClient.cancelQueries({
        queryKey: recipesQueryKey,
      });

      const previousRecipes =
        queryClient.getQueryData<Recipe[]>(recipesQueryKey);

      return { previousRecipes };
    },

    onError: (err, _variables, context) => {
      showToast(err.message || err.error || "Something went wrong", "error");

      if (context?.previousRecipes) {
        queryClient.setQueryData(recipesQueryKey, context.previousRecipes);
      }
    },

    onSuccess: (data, variables) => {
      const newRecipe = data.recipe;
      const isNewRecipe = !variables.recipeId;

      queryClient.setQueryData<Recipe[]>(recipesQueryKey, (old = []) => {
        const existingIndex = old.findIndex(
          (recipe) => recipe.id === newRecipe.id,
        );

        if (existingIndex === -1) {
          return [...old, newRecipe];
        }

        return old.map((recipe) =>
          recipe.id === newRecipe.id ? newRecipe : recipe,
        );
      });

      if (!isNewRecipe && !user) {
        addLocalRecipeVersion(newRecipe);
      }

      if (isNewRecipe && !user) {
        addLocalRecipe(newRecipe);
      }

      queryClient.invalidateQueries({ queryKey: recipesQueryKey });
    },
  });

  return {
    submitRecipePrompt: submitRecipePromptMutation.mutateAsync,
    isPending: submitRecipePromptMutation.isPending,
    isSuccess: submitRecipePromptMutation.isSuccess,
  };
}
