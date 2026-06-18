import { memo } from "react";
import type { OpenDeleteModal } from "../../../hooks/useDeleteRecipe";
import { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import type { Recipe, RecipeDetails } from "../../../types/recipe";
import RecipeEditTitle from "./RecipeEditTitle";
import RecipeEditDetails from "./RecipeEditDetails";
import RecipeEditDescription from "./RecipeEditDescription";
import RecipeEditIngredients from "./RecipeEditIngredients";
import RecipeEditInstructions from "./RecipeEditInstructions";
import RecipeEditControls from "./RecipeEditControls";

const EMPTY_RECIPE_DETAILS: RecipeDetails = {
  calories: null,
  servings: null,
  total_time: null,
};

type RecipeEditFormProps = {
  recipe: Recipe;
  recipeVersion: number;
  isEditing: boolean;
  openDeleteModal: OpenDeleteModal;
};

// function renderIngredient(ingredient: RecipeIngredient) {
//   const hasPrimaryMeasurement =
//     ingredient.quantity_text != null || ingredient.quantity_value != null;

//   const hasAlternateMeasurement =
//     ingredient.alternate_quantity_text != null ||
//     ingredient.alternate_quantity_value != null;

//   return (
//     <div className="grid grid-cols-[90px_1fr] items-start gap-1">
//       <div className="flex flex-col">
//         {hasPrimaryMeasurement && (
//           <span>
//             <span>
//               {ingredient.quantity_text ??
//                 ingredient.quantity_value?.toString()}
//             </span>
//             {ingredient.unit && <span className="ml-1">{ingredient.unit}</span>}
//           </span>
//         )}
//         {hasAlternateMeasurement && (
//           <div className="text-secondary text-xs">
//             <span>(</span>
//             <span>
//               {ingredient.alternate_quantity_text ??
//                 ingredient.alternate_quantity_value?.toString()}
//             </span>
//             {ingredient.alternate_unit && (
//               <span className="ml-1">{ingredient.alternate_unit}</span>
//             )}
//             <span>)</span>
//           </div>
//         )}
//       </div>
//       <div className="flex flex-col items-start">
//         {ingredient.ingredient_name && (
//           <span>{ingredient.ingredient_name}</span>
//         )}
//         {ingredient.note && (
//           <span className="text-secondary text-xs">({ingredient.note})</span>
//         )}
//         {ingredient.is_optional && <span>optional</span>}
//       </div>
//     </div>
//   );
// }

const RecipeEditForm = memo(
  ({
    recipe,
    recipeVersion,
    isEditing,
    openDeleteModal,
  }: RecipeEditFormProps) => {
    const {
      draft,
      handleDraftDetail,
      handleDraftString,
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

    const recipeTitle = draft?.title || "";
    const recipeDetails = draft?.recipeDetails || EMPTY_RECIPE_DETAILS;
    const recipeDescription = draft?.description || "";
    const recipeIngredients = draft?.ingredients || [];
    const recipeInstructions = draft?.instructions || [];
    return (
      <div role="log" aria-live="polite" className="flex flex-col gap-2 pb-12">
        <RecipeEditTitle
          recipeTitle={recipeTitle}
          handleDraftString={handleDraftString}
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
        <RecipeEditControls
          recipe={recipe}
          recipeVersion={recipeVersion}
          openDeleteModal={openDeleteModal}
        />

        {/*
        {source_prompt && (
          <div className="text-secondary mt-4 flex max-w-full justify-between gap-4 text-sm">
            <div className="flex w-full max-w-full min-w-0 flex-col items-start gap-2 py-2">
              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="hover:bg-base-hover cursor-pointer rounded-lg p-1 underline transition-colors duration-150"
              >
                View Prompt
              </button>
            </div>
            {recipe.versions.length > 1 && (
              <p
                className="whitespace-nowrap"
                aria-label={`Version ${recipeVersion + 1} of ${
                  recipe.versions.length
                }`}
              >
                {recipeVersion + 1} of {recipe.versions.length}
              </p>
            )}
          </div>
        )}
        <RecipeContentPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          sourcePrompt={source_prompt || ""}
          anchorRef={modalAnchorRef}
        /> */}
      </div>
    );
  },
);

// RecipeEditForm.displayName = "RecipeE";

export default RecipeEditForm;
