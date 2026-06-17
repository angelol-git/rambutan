import API_BASE_URL from "../config/api";
import type { Recipe, UpdateRecipeInput } from "../types/recipe";
import type { DraftTag } from "../types/tag";

const backendUrl = API_BASE_URL;

type FetchRecipesParams = {
  page: number;
  pageSize: number;
  selectedTagIds?: Array<string | number>;
};
export type PaginatedRecipesResponse = {
  items: Recipe[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export async function fetchRecipes({
  page,
  pageSize,
  selectedTagIds = [],
}: FetchRecipesParams): Promise<PaginatedRecipesResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  selectedTagIds.forEach((tagId) => {
    searchParams.append("tagId", String(tagId));
  });

  const res = await fetch(`${backendUrl}/recipes/?${searchParams.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to retrieve recipes");
  }

  return res.json();
}

export async function deleteRecipeVersion(
  recipeVersionId: string,
): Promise<true> {
  const res = await fetch(`${backendUrl}/recipes/version/${recipeVersionId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server returned ${res.status}: ${errorText}`);
  }

  return true;
}

export async function deleteRecipe(recipeId: string): Promise<true> {
  const res = await fetch(`${backendUrl}/recipes/${recipeId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server returned ${res.status}: ${errorText}`);
  }

  return true;
}

export async function updateRecipe(
  updatedRecipe: UpdateRecipeInput,
): Promise<true> {
  const res = await fetch(`${backendUrl}/recipes/${updatedRecipe.recipe_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ updatedRecipe }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server returned ${res.status}: ${errorText}`);
  }

  return true;
}

export async function addRecipeTag(
  recipeId: string,
  newTag: DraftTag,
): Promise<true> {
  const res = await fetch(`${backendUrl}/recipes/${recipeId}/tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ newTag }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server returned ${res.status}: ${errorText}`);
  }

  return true;
}
