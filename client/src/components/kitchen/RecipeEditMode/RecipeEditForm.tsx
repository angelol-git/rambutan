import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { OpenDeleteModal } from "../../../hooks/useDeleteRecipe";
import { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import { useRecipeMutations } from "../../../hooks/useRecipes";
import type {
  Recipe,
  RecipeDetails,
  UpdateRecipeVersionInput,
} from "../../../types/recipe";
import RecipeEditTitle from "./RecipeEditTitle";
import RecipeEditDetails from "./RecipeEditDetails";
import RecipeEditDescription from "./RecipeEditDescription";
import RecipeEditNotes from "./RecipeEditNotes";
import RecipeEditIngredients from "./RecipeEditIngredients";
import RecipeEditInstructions from "./RecipeEditInstructions";
import RecipeEditTags from "./RecipeEditTags";
import RecipeEditControls from "./RecipeEditControls";
import RecipeContentVersionInfo from "../RecipeResponse/RecipeContentVersionInfo";

const EMPTY_RECIPE_DETAILS: RecipeDetails = {
  calories: null,
  servings: null,
  total_time: null,
};

function normalizeDetailValue(value: string | number | null | undefined) {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const numericValue = Number(trimmedValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeRecipeDetails(recipeDetails: RecipeDetails): RecipeDetails {
  return {
    calories: normalizeDetailValue(recipeDetails.calories),
    servings: normalizeDetailValue(recipeDetails.servings),
    total_time: normalizeDetailValue(recipeDetails.total_time),
  };
}

type RecipeEditFormProps = {
  recipe: Recipe;
  recipeVersion: number;
  isEditing: boolean;
  formId: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  openDeleteModal: OpenDeleteModal;
};

function RecipeEditForm({
  recipe,
  recipeVersion,
  isEditing,
  formId,
  setIsEditing,
  openDeleteModal,
}: RecipeEditFormProps) {
  const {
    updateRecipeMetadataAsync,
    updateRecipeTagsAsync,
    updateRecipeVersionAsync,
  } = useRecipeMutations();
  const {
    draft,
    handleDraftDetail,
    handleDraftString,
    handleDraftTagName,
    handleDraftTagColor,
    handleDraftTagDelete,
    handleDraftTagAdd,
    handleDraftIngredientUpdate,
    handleDraftInstructionUpdate,
    handleDraftArrayDelete,
    handleDraftArrayPush,
  } = useDraftRecipe({
    recipe,
    recipeVersion,
    isEditModalOpen: isEditing,
  });
  const current = recipe?.versions?.[recipeVersion];

  if (!current) return null;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const requests: Array<Promise<unknown>> = [];

    //Checks recipe metadata differences
    const trimmedDraftTitle = draft.title.trim();
    const trimmedCurrentTitle = recipe.title.trim();

    if (trimmedDraftTitle !== trimmedCurrentTitle) {
      requests.push(
        updateRecipeMetadataAsync({
          recipeId: recipe.id,
          title: trimmedDraftTitle,
        }),
      );
    }

    //Checks recipe version differences
    const nextVersionUpdate: UpdateRecipeVersionInput = {
      recipeId: recipe.id,
      versionId: draft.id,
      description: draft.description,
      notes: draft.notes,
      instructions: draft.instructions || [],
      ingredients: draft.ingredients || [],
      recipeDetails: normalizeRecipeDetails(
        draft.recipeDetails || EMPTY_RECIPE_DETAILS,
      ),
      source: draft.source,
    };
    const currentVersionUpdate: UpdateRecipeVersionInput = {
      recipeId: recipe.id,
      versionId: current.id,
      description: current.description ?? "",
      notes: current.notes ?? "",
      instructions: current.instructions ?? [],
      ingredients: current.ingredients ?? [],
      recipeDetails: normalizeRecipeDetails(
        current.recipeDetails || EMPTY_RECIPE_DETAILS,
      ),
      source: current.source,
    };

    if (
      JSON.stringify(nextVersionUpdate) !== JSON.stringify(currentVersionUpdate)
    ) {
      requests.push(updateRecipeVersionAsync(nextVersionUpdate));
    }

    if (JSON.stringify(draft.tags) !== JSON.stringify(recipe.tags)) {
      requests.push(
        updateRecipeTagsAsync({
          recipeId: recipe.id,
          tags: draft.tags,
        }),
      );
    }

    try {
      await Promise.all(requests);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save recipe edits", error);
    }
  }

  const recipeTitle = draft?.title || "";
  const recipeDetails = draft?.recipeDetails || EMPTY_RECIPE_DETAILS;
  const recipeDescription = draft?.description || "";
  const recipeNotes = draft?.notes || "";
  const recipeTags = draft?.tags || [];
  const recipeIngredients = draft?.ingredients || [];
  const recipeInstructions = draft?.instructions || [];
  return (
    <form
      id={formId}
      onSubmit={handleSave}
      className="flex flex-col gap-2 pb-12"
    >
      <div role="log" aria-live="polite" className="flex flex-col gap-2">
        <RecipeEditTitle
          recipeTitle={recipeTitle}
          handleDraftString={handleDraftString}
        />
        <RecipeEditTags
          tags={recipeTags}
          handleDraftTagName={handleDraftTagName}
          handleDraftTagColor={handleDraftTagColor}
          handleDraftTagDelete={handleDraftTagDelete}
          handleDraftTagAdd={handleDraftTagAdd}
        />
        <RecipeEditDetails
          recipeDetails={recipeDetails}
          handleDraftDetail={handleDraftDetail}
        />

        <RecipeEditDescription
          recipeDescription={recipeDescription}
          handleDraftString={handleDraftString}
        />

        <RecipeEditIngredients
          ingredients={recipeIngredients}
          handleDraftIngredientUpdate={handleDraftIngredientUpdate}
          handleDraftArrayDelete={handleDraftArrayDelete}
          handleDraftArrayPush={handleDraftArrayPush}
        />

        <RecipeEditInstructions
          instructions={recipeInstructions}
          handleDraftInstructionUpdate={handleDraftInstructionUpdate}
          handleDraftArrayDelete={handleDraftArrayDelete}
          handleDraftArrayPush={handleDraftArrayPush}
        />
        <RecipeEditNotes
          recipeNotes={recipeNotes}
          handleDraftString={handleDraftString}
        />
        <RecipeContentVersionInfo
          recipeVersion={recipeVersion}
          versionCount={recipe.versions.length}
        />
        <RecipeEditControls
          recipe={recipe}
          recipeVersion={recipeVersion}
          openDeleteModal={openDeleteModal}
        />
      </div>
    </form>
  );
}

export default RecipeEditForm;
