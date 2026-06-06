import { Dispatch, FormEvent, RefObject, SetStateAction, useRef } from "react";
import { createPortal } from "react-dom";
import { useRecipeMutations } from "../../../hooks/useRecipes";
import { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import EditTitle from "./EditTitle";
import EditTags from "./EditTags";
import EditRecipeDetails from "./EditRecipeDetails";
import EditDescription from "./EditDescription";
import EditIngredients from "./EditIngredients";
import EditInstructions from "./EditInstructions";
import useModalAnchor from "../../../hooks/useModalAnchor";
import type { Recipe, UpdateRecipeInput } from "../../../types/recipe";

type RecipeEditorModalProps = {
  recipe: Recipe;
  recipeVersion: number;
  isEditModalOpen: boolean;
  setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
  anchorRef: RefObject<HTMLDivElement | null>;
};

function RecipeEditorModal({
  recipe,
  recipeVersion,
  isEditModalOpen,
  setIsEditModalOpen,
  anchorRef,
}: RecipeEditorModalProps) {
  const modalRef = useRef(null);
  const anchorStyle = useModalAnchor(anchorRef, isEditModalOpen);
  const { updateRecipe } = useRecipeMutations();
  const {
    draft,
    handleDraftString,
    handleDraftDetail,
    handleDraftTagName,
    handleDraftTagColor,
    handleDraftTagDelete,
    handleDraftTagAdd,
    handleDraftArrayUpdate,
    handleDraftArrayDelete,
    handleDraftArrayPush,
    handleDraftArrayReorder,
  } = useDraftRecipe({
    recipe,
    recipeVersion,
    isEditModalOpen,
  });

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;

    // Convert instructions from objects back to strings for saving
    const recipeToSave: UpdateRecipeInput = {
      id: draft.id,
      recipe_id: draft.recipe_id,
      title: draft.title,
      tags: draft.tags,
      description: draft.description,
      recipeDetails: draft.recipeDetails,
      source_prompt: draft.source_prompt,
      instructions: (draft.instructions || []).map((item) => item.text),
      ingredients: (draft.ingredients || []).map((item) => item.text),
    };
    updateRecipe(recipeToSave);
    setIsEditModalOpen(false);
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] bg-black/10 backdrop-blur-xs transition-opacity duration-300 ${isEditModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={() => setIsEditModalOpen(false)}
    >
      <div
        className="fixed inset-x-0 bottom-0 flex items-end justify-center lg:inset-y-0 lg:items-end"
        style={anchorStyle}
      >
        <div
          ref={modalRef}
          className={`bg-base flex max-h-[90dvh] w-full transform flex-col overflow-y-auto overscroll-contain rounded-t-xl px-4 pt-5 pb-8 shadow-lg transition-transform duration-300 ease-out lg:rounded-xl lg:px-5 lg:pt-6 lg:pb-10 ${isEditModalOpen ? "translate-y-0" : "translate-y-full"}`}
          style={{ WebkitOverflowScrolling: "touch" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="hover:bg-base-hover transition-color w-18 cursor-pointer rounded-lg px-2 py-1 duration-150"
            >
              Cancel
            </button>
            <h2 className="font-bold">Edit Recipe</h2>
            <button
              onClick={handleSave}
              className="hover:bg-base-hover transition-color w-18 cursor-pointer rounded-lg px-2 py-1 duration-150"
            >
              Save
            </button>
          </div>
          <form className="flex flex-col gap-6 pb-2">
            <EditTitle draft={draft} handleDraftString={handleDraftString} />
            <EditTags
              draft={draft}
              handleDraftTagName={handleDraftTagName}
              handleDraftTagColor={handleDraftTagColor}
              handleDraftTagDelete={handleDraftTagDelete}
              handleDraftTagAdd={handleDraftTagAdd}
            />
            <EditRecipeDetails
              draft={draft}
              handleDraftDetail={handleDraftDetail}
            />
            <EditDescription
              draft={draft}
              handleDraftString={handleDraftString}
            />
            <EditIngredients
              draft={draft}
              handleDraftArrayUpdate={handleDraftArrayUpdate}
              handleDraftArrayDelete={handleDraftArrayDelete}
              handleDraftArrayPush={handleDraftArrayPush}
              handleDraftArrayReorder={handleDraftArrayReorder}
            />
            <EditInstructions
              draft={draft}
              handleDraftArrayUpdate={handleDraftArrayUpdate}
              handleDraftArrayDelete={handleDraftArrayDelete}
              handleDraftArrayPush={handleDraftArrayPush}
              handleDraftArrayReorder={handleDraftArrayReorder}
            />
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default RecipeEditorModal;
