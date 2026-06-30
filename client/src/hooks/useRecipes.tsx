import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRecipeTag,
  deleteRecipe,
  deleteRecipeVersion,
  fetchRecipes,
  updateRecipeMetadata,
  updateRecipeTags,
  updateRecipeVersion,
  type PaginatedRecipesResponse,
} from "../api/recipes";
import type {
  Recipe,
  UpdateRecipeMetadataInput,
  UpdateRecipeTagsInput,
  UpdateRecipeVersionInput,
} from "../types/recipe";
import type { DraftTag } from "../types/tag";
import {
  addLocalRecipe,
  addLocalRecipeTag,
  clearRecipeCompletionState,
  clearRecipeCompletions,
  deleteLocalRecipeAll,
  deleteLocalRecipeVersion,
  getLocalRecipes,
  updateLocalRecipeMetadata,
  updateLocalRecipeTags,
  updateLocalRecipeVersion,
} from "../utils/storage";
import { useUser } from "./useUser.js";

type DeleteRecipeMutationProps = {
  recipeId: string;
  recipeVersionId: string;
};

type AddRecipeTagMutationInput = {
  recipeId: string;
  newTag: DraftTag;
};

type UseRecipesParams = {
  page: number;
  pageSize: number;
  selectedTagIds?: Array<string | number>;
};

export function useRecipeMutations() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const deleteRecipeVersionMutation = useMutation({
    mutationFn: async ({
      recipeId,
      recipeVersionId,
    }: DeleteRecipeMutationProps) => {
      if (user) {
        return deleteRecipeVersion(recipeId, recipeVersionId);
      }

      return deleteLocalRecipeVersion(recipeId, recipeVersionId);
    },
    onSuccess: (_, { recipeId, recipeVersionId }) => {
      clearRecipeCompletionState(recipeId, recipeVersionId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      if (user) {
        await deleteRecipe(recipeId);
        return;
      }

      deleteLocalRecipeAll(recipeId);
    },
    onSuccess: (_, recipeId) => {
      clearRecipeCompletions(recipeId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const updateRecipeMetadataMutation = useMutation({
    mutationFn: async (updatedRecipe: UpdateRecipeMetadataInput) => {
      if (user) {
        return updateRecipeMetadata(updatedRecipe);
      }

      return updateLocalRecipeMetadata(updatedRecipe);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const updateRecipeVersionMutation = useMutation({
    mutationFn: async (updatedRecipe: UpdateRecipeVersionInput) => {
      if (user) {
        return updateRecipeVersion(updatedRecipe);
      }

      return updateLocalRecipeVersion(updatedRecipe);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const updateRecipeTagsMutation = useMutation({
    mutationFn: async (updatedRecipe: UpdateRecipeTagsInput) => {
      if (user) {
        return updateRecipeTags(updatedRecipe);
      }

      return updateLocalRecipeTags(updatedRecipe);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const addRecipeTagMutation = useMutation({
    mutationFn: async ({ recipeId, newTag }: AddRecipeTagMutationInput) => {
      if (user) {
        return addRecipeTag(recipeId, newTag);
      }

      return addLocalRecipeTag(recipeId, newTag);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const addLocalRecipeMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      addLocalRecipe(recipe);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  return {
    addLocalRecipe: addLocalRecipeMutation.mutate,
    addRecipeTag: addRecipeTagMutation.mutate,
    deleteRecipe: deleteRecipeMutation.mutate,
    deleteRecipeVersion: deleteRecipeVersionMutation.mutate,
    updateRecipeMetadata: updateRecipeMetadataMutation.mutate,
    updateRecipeMetadataAsync: updateRecipeMetadataMutation.mutateAsync,
    updateRecipeTags: updateRecipeTagsMutation.mutate,
    updateRecipeTagsAsync: updateRecipeTagsMutation.mutateAsync,
    updateRecipeVersion: updateRecipeVersionMutation.mutate,
    updateRecipeVersionAsync: updateRecipeVersionMutation.mutateAsync,
  };
}

export function useRecipes({
  page,
  pageSize,
  selectedTagIds = [],
}: UseRecipesParams) {
  const { user } = useUser();

  const recipesQueryKey = [
    "recipes",
    user?.id || "guest_recipes",
    page,
    pageSize,
    selectedTagIds,
  ] as const;

  const recipesQuery = useQuery<PaginatedRecipesResponse>({
    queryKey: recipesQueryKey,
    queryFn: async () => {
      if (user) {
        return fetchRecipes({ page, pageSize, selectedTagIds });
      }

      const allLocalRecipes = getLocalRecipes();
      const filteredLocalRecipes =
        selectedTagIds.length === 0
          ? allLocalRecipes
          : allLocalRecipes.filter((recipe) =>
              recipe.tags.some((tag) => selectedTagIds.includes(tag.id)),
            );
      const totalItems = filteredLocalRecipes.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        items: filteredLocalRecipes.slice(start, end),
        page,
        pageSize,
        totalItems,
        totalPages,
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    ...recipesQuery,
    pagination: recipesQuery.data
      ? {
          page: recipesQuery.data.page,
          pageSize: recipesQuery.data.pageSize,
          totalItems: recipesQuery.data.totalItems,
          totalPages: recipesQuery.data.totalPages,
        }
      : null,
    recipes: recipesQuery.data?.items ?? [],
  };
}
