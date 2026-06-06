import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import { useOutletContext } from "react-router";
import RecipeResponse from "../../components/kitchen/RecipeResponse/RecipeResponse.js";
import RecipeVersionNavigation from "../../components/kitchen/AssistantComposer/RecipeVersionNavigation.js";
import AssistantComposer from "../../components/kitchen/AssistantComposer/AssistantComposer";
import RecipeEditorModal from "../../components/kitchen/RecipeEditor/RecipeEditorModal.jsx";
import RecipeTags from "../../components/kitchen/RecipeResponse/RecipeTags.jsx";
import NotFound from "../NotFound.jsx";
import { Recipe } from "../../types/recipe.js";

type KitchenOutletContext = {
  recipe: Recipe;
  recipeVersion: number;
  setRecipeVersion: Dispatch<SetStateAction<number>>;
  isEditModalOpen: boolean;
  setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
};
function RecipeWorkspace() {
  const {
    recipe,
    recipeVersion,
    setRecipeVersion,
    isEditModalOpen,
    setIsEditModalOpen,
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
  }, [isAssistantOpen, hasRecipeNavigation]);

  if (!recipe && !isLoading) {
    return <NotFound />;
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="ios-scroll min-h-0 flex-1 overflow-y-auto">
        <div
          ref={replyPanelRef}
          className="mx-auto w-full max-w-screen-md px-4 pt-2"
          style={{ paddingBottom: `${composerHeight + 16}px` }}
        >
          <RecipeTags recipe={recipe} />
          <RecipeResponse
            recipe={recipe}
            recipeVersion={recipeVersion}
            modalAnchorRef={replyPanelRef}
          />
        </div>
      </div>

      <RecipeEditorModal
        recipe={recipe}
        recipeVersion={recipeVersion}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        anchorRef={replyPanelRef}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div
          ref={composerRef}
          className="pb-safe mx-auto w-full max-w-screen-md px-2 pt-2"
        >
          <div className="flex items-center justify-between gap-3">
            {hasRecipeNavigation && !isAssistantOpen && (
              <div className="pointer-events-auto shrink-0">
                <RecipeVersionNavigation
                  recipe={recipe}
                  recipeVersion={recipeVersion}
                  setRecipeVersion={setRecipeVersion}
                />
              </div>
            )}
            <div
              className={`pointer-events-auto flex justify-end ${
                isAssistantOpen ? "flex-1" : "ml-auto shrink-0"
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
  );
}

export default RecipeWorkspace;
