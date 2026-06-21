import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import { useOutletContext } from "react-router";
import type { OpenDeleteModal } from "../../hooks/useDeleteRecipe.js";
import RecipeContent from "../../components/kitchen/RecipeResponse/RecipeContent.js";
import AssistantComposer from "../../components/kitchen/AssistantComposer/AssistantComposer";
import RecipeEditForm from "../../components/kitchen/RecipeEditMode/RecipeEditForm.jsx";
import RecipeContentTags from "../../components/kitchen/RecipeResponse/RecipeContentTags.jsx";
import NotFound from "../NotFound.jsx";
import { Recipe } from "../../types/recipe.js";

type KitchenOutletContext = {
  recipe: Recipe;
  recipeVersion: number;
  setRecipeVersion: Dispatch<SetStateAction<number>>;
  openDeleteModal: OpenDeleteModal;
  isEditing: boolean;
  isLoading: boolean;
};
function RecipeWorkspace() {
  const {
    recipe,
    recipeVersion,
    setRecipeVersion,
    openDeleteModal,
    isEditing,
    isLoading,
  } = useOutletContext<KitchenOutletContext>();

  const [isQuestionsModalOpen, setIsQuestionsModalOpen] =
    useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [composerHeight, setComposerHeight] = useState<number>(0);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const replyPanelRef = useRef<HTMLDivElement | null>(null);
  const hasRecipeNavigation = recipe?.versions?.length > 1;

  useEffect(() => {
    if (recipe) {
      window.hideShell?.();
    }
  }, [recipe]);

  useEffect(() => {
    if (!isEditing) return;

    setIsAssistantOpen(false);
    setIsQuestionsModalOpen(false);
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) return;

    const node = composerRef.current;
    if (!node) return;

    const updateComposerHeight = () => {
      setComposerHeight(node.offsetHeight);
    };

    updateComposerHeight();

    const observer = new ResizeObserver(updateComposerHeight);
    observer.observe(node);
    window.addEventListener("resize", updateComposerHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateComposerHeight);
    };
  }, [isEditing, isAssistantOpen, hasRecipeNavigation]);

  if (!recipe && !isLoading) {
    return <NotFound />;
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="ios-scroll min-h-0 flex-1 overflow-y-auto">
        {!isEditing ? (
          <div className="mx-auto w-full max-w-screen-md px-4">
            <div
              ref={replyPanelRef}
              className="w-full pt-2"
              style={{ paddingBottom: `${composerHeight + 16}px` }}
            >
              <RecipeContentTags recipe={recipe} />
              <RecipeContent recipe={recipe} recipeVersion={recipeVersion} />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-screen-md px-4">
            <div ref={replyPanelRef} className="w-full pt-2">
              <RecipeEditForm
                recipe={recipe}
                recipeVersion={recipeVersion}
                isEditing={isEditing}
                openDeleteModal={openDeleteModal}
              />
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="mx-auto w-full max-w-screen-md">
            <div ref={composerRef} className="pb-safe w-full pt-2">
              <div className="flex items-center justify-end gap-3">
                <div
                  className={`pointer-events-auto flex justify-end ${
                    isAssistantOpen ? "flex-1" : "shrink-0"
                  }`}
                >
                  <AssistantComposer
                    recipe={recipe}
                    recipeVersion={recipeVersion}
                    setRecipeVersion={setRecipeVersion}
                    hasRecipeNavigation={hasRecipeNavigation}
                    isAssistantOpen={isAssistantOpen}
                    setIsAssistantOpen={setIsAssistantOpen}
                    isQuestionsModalOpen={isQuestionsModalOpen}
                    setIsQuestionsModalOpen={setIsQuestionsModalOpen}
                    variant="existing"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeWorkspace;
