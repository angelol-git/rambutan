import API_BASE_URL from "../config/api";
import type { Recipe, RecipeVersion } from "../types/recipe";

const backendUrl = `${API_BASE_URL}/kitchen`;

export type RecipePromptPayload = {
  prompt: string;
  recipeId?: string;
  recipeVersion?: RecipeVersion;
};

export type RecipePromptResponse = {
  recipe: Recipe;
};

export async function submitRecipePrompt(
  payload: RecipePromptPayload,
): Promise<RecipePromptResponse> {
  const res = await fetch(`${backendUrl}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      prompt: payload.prompt,
      recipeId: payload.recipeId,
      recipeVersion: payload.recipeVersion,
    }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw data;
  }

  const data = await res.json();
  return { recipe: data.recipe ?? data.reply };
}
