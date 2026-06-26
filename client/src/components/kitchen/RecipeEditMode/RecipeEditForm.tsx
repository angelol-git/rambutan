import {
  memo,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { OpenDeleteModal } from "../../../hooks/useDeleteRecipe";
import { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import { useRecipeMutations } from "../../../hooks/useRecipes";
import type {
  Recipe,
  RecipeDetails,
  UpdateRecipeInput,
} from "../../../types/recipe";
import RecipeEditTitle from "./RecipeEditTitle";
import RecipeEditDetails from "./RecipeEditDetails";
import RecipeEditDescription from "./RecipeEditDescription";
import RecipeEditNotes from "./RecipeEditNotes";
import RecipeEditIngredients from "./RecipeEditIngredients";
import RecipeEditInstructions from "./RecipeEditInstructions";
import RecipeEditControls from "./RecipeEditControls";
import RecipeContentVersionInfo from "../RecipeResponse/RecipeContentVersionInfo";

const EMPTY_RECIPE_DETAILS: RecipeDetails = {
  calories: null,
  servings: null,
  total_time: null,
};

type RecipeEditFormProps = {
  recipe: Recipe;
  recipeVersion: number;
  isEditing: boolean;
  formId: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
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

// TODO: Maybe update recipe edit form place holder text to have rotating examples
const RecipeEditForm = memo(
  ({
    recipe,
    recipeVersion,
    isEditing,
    formId,
    setIsEditing,
    openDeleteModal,
  }: RecipeEditFormProps) => {
    const { updateRecipe } = useRecipeMutations();
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

    function handleSave(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!draft) return;

      const recipeToSave: UpdateRecipeInput = {
        id: draft.id,
        recipe_id: draft.recipe_id,
        title: draft.title,
        tags: draft.tags,
        description: draft.description,
        notes: draft.notes,
        recipeDetails: draft.recipeDetails,
        source: draft.source,
        instructions: draft.instructions || [],
        ingredients: draft.ingredients || [],
      };

      updateRecipe(recipeToSave);
      setIsEditing(false);
    }

    const recipeTitle = draft?.title || "";
    const recipeDetails = draft?.recipeDetails || EMPTY_RECIPE_DETAILS;
    const recipeDescription = draft?.description || "";
    const recipeNotes = draft?.notes || "";
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
  },
);

// RecipeEditForm.displayName = "RecipeE";

export default RecipeEditForm;
