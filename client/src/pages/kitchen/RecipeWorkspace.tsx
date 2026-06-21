import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { useOutletContext } from "react-router";
import type { OpenDeleteModal } from "../../hooks/useDeleteRecipe.js";
import RecipeContent from "../../components/kitchen/RecipeResponse/RecipeContent.js";
import RecipeVersionNavigation from "../../components/kitchen/RecipeVersionNavigation.js";
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

  if (!recipe && !isLoading) {
    return <NotFound />;
  }

  return (
    <div className="relative flex flex-col">
      <div>
        {!isEditing ? (
          <div className="mx-auto w-full max-w-screen-md px-4">
            <div className="w-full pt-2" style={{ paddingBottom: "16px" }}>
              <RecipeContentTags recipe={recipe} />
              <RecipeContent recipe={recipe} recipeVersion={recipeVersion} />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-screen-md px-4">
            <div className="w-full pt-2">
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
        <div className="pointer-events-none sticky bottom-0 mt-4">
          <div className="mx-auto w-full max-w-screen-md px-2 md:px-4">
            <div className="pb-safe-tight w-full pt-2">
              <div className="flex items-center justify-between">
                {hasRecipeNavigation && !isAssistantOpen ? (
                  <div className="pointer-events-auto shrink-0">
                    <RecipeVersionNavigation
                      recipe={recipe}
                      recipeVersion={recipeVersion}
                      setRecipeVersion={setRecipeVersion}
                    />
                  </div>
                ) : (
                  <div />
                )}
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
