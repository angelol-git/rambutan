import { useEffect, useState } from "react";
import type { RecipeIngredient, RecipeInstruction } from "../types/recipe";
import {
  getRecipeCompletionState,
  saveRecipeCompletionState,
} from "../utils/storage";

type UseRecipeCompletionProps = {
  recipeId: string;
  recipeVersionId: string;
  initialIngredients: RecipeIngredient[];
  initialInstructions: RecipeInstruction[];
};

function applyStoredCompletion<T extends { id: string; completed: boolean }>(
  items: T[],
  completedIds: string[],
): T[] {
  return items.map((item) => ({
    ...item,
    completed: completedIds.includes(item.id),
  }));
}

function getCompletedIds(completionMap: Record<string, boolean>): string[] {
  return Object.keys(completionMap);
}

function getCompletedMap(completedIds: string[]): Record<string, boolean> {
  return Object.fromEntries(completedIds.map((id) => [id, true]));
}

export function useRecipeCompletion({
  recipeId,
  recipeVersionId,
  initialIngredients,
  initialInstructions,
}: UseRecipeCompletionProps) {
  const [completedIngredientIds, setCompletedIngredientIds] = useState<
    string[]
  >([]);
  const [completedInstructionIds, setCompletedInstructionIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    const completionState = getRecipeCompletionState(recipeId, recipeVersionId);

    setCompletedIngredientIds(getCompletedIds(completionState.ingredients));
    setCompletedInstructionIds(getCompletedIds(completionState.instructions));
  }, [recipeId, recipeVersionId]);

  const ingredients = applyStoredCompletion(
    initialIngredients,
    completedIngredientIds,
  );
  const instructions = applyStoredCompletion(
    initialInstructions,
    completedInstructionIds,
  );

  function persistCompletion(
    nextCompletedIngredientIds: string[],
    nextCompletedInstructionIds: string[],
  ) {
    saveRecipeCompletionState(recipeId, recipeVersionId, {
      ingredients: getCompletedMap(nextCompletedIngredientIds),
      instructions: getCompletedMap(nextCompletedInstructionIds),
    });
  }

  function toggleIngredientCompletion(ingredientId: string) {
    const nextCompletedIngredientIds = completedIngredientIds.includes(
      ingredientId,
    )
      ? //Uncompleted ingredients are removed from the completion list
        completedIngredientIds.filter((id) => id !== ingredientId)
      : [...completedIngredientIds, ingredientId];

    setCompletedIngredientIds(nextCompletedIngredientIds);
    persistCompletion(nextCompletedIngredientIds, completedInstructionIds);
  }

  function toggleInstructionCompletion(instructionId: string) {
    const nextCompletedInstructionIds = completedInstructionIds.includes(
      instructionId,
    )
      ? //Uncompleted instructions are removed from the completion list
        completedInstructionIds.filter((id) => id !== instructionId)
      : [...completedInstructionIds, instructionId];

    setCompletedInstructionIds(nextCompletedInstructionIds);
    persistCompletion(completedIngredientIds, nextCompletedInstructionIds);
  }

  function resetIngredientCompletion() {
    const nextCompletedIngredientIds: string[] = [];

    setCompletedIngredientIds(nextCompletedIngredientIds);
    persistCompletion(nextCompletedIngredientIds, completedInstructionIds);
  }

  function resetInstructionCompletion() {
    const nextCompletedInstructionIds: string[] = [];

    setCompletedInstructionIds(nextCompletedInstructionIds);
    persistCompletion(completedIngredientIds, nextCompletedInstructionIds);
  }

  return {
    ingredients,
    instructions,
    toggleIngredientCompletion,
    toggleInstructionCompletion,
    resetIngredientCompletion,
    resetInstructionCompletion,
  };
}
