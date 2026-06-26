import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useParams } from "react-router";
import DeleteRecipePortal from "../../components/delete/DeleteRecipePortal.js";
import KitchenHeader from "../../components/kitchen/KitchenHeader/KitchenHeader.js";
import AssistantComposer from "../../components/kitchen/AssistantComposer/AssistantComposer";
import RecipeEditForm from "../../components/kitchen/RecipeEditMode/RecipeEditForm.jsx";
import RecipeVersionNavigation from "../../components/kitchen/RecipeVersionNavigation.js";
import RecipeContent from "../../components/kitchen/RecipeResponse/RecipeContent.js";
import RecipeContentTags from "../../components/kitchen/RecipeResponse/RecipeContentTags.jsx";
import { useDeleteRecipe } from "../../hooks/useDeleteRecipe.js";
import { useRecipes } from "../../hooks/useRecipes";
import type { Recipe } from "../../types/recipe.js";
import NotFoundPage from "../NotFoundPage";

/*
 * Save button and form data lives in a different component,
 * to use native onSubmit handler need to wire id from form attribute
 */
const RECIPE_EDIT_FORM_ID = "recipe-edit-form";

function RecipePageSkeleton() {
  return (
    <div className="bg-base text-primary relative min-h-screen w-full">
      <main className="relative w-full">
        <div className="mx-auto flex w-full max-w-4xl px-3 py-2 pb-4 md:px-5">
          <div className="relative flex w-full">
            <div className="bg-mantle border-primary/10 relative z-20 flex w-full flex-col rounded-2xl border py-8 md:min-h-[calc(100dvh-1rem)]">
              <div className="bg-mantle sticky top-0 z-30 px-5 pt-5 pb-4 sm:px-6">
                <div className="mx-auto w-full max-w-4xl">
                  <div className="border-primary/10 mt-4 border-b" />
                </div>
              </div>
              <div className="flex-1" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RecipePage() {
  const { id } = useParams();
  const { recipes, isLoading } = useRecipes({ page: 1, pageSize: 1000 });
  const recipe = useMemo(() => {
    if (!id) return null;
    return recipes.find((r) => r.id === id) || null;
  }, [recipes, id]);

  const [recipeVersion, setRecipeVersion] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] =
    useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const { deleteModal, openDeleteModal, closeDeleteModal, handleDelete } =
    useDeleteRecipe({
      onDeleteVersion: (nextRecipeVersion) => {
        setRecipeVersion(nextRecipeVersion);
        setIsEditing(false);
      },
    });
  const hasRecipeNavigation = (recipe?.versions?.length ?? 0) > 1;
  const stackCount = Math.min(
    Math.max((recipe?.versions?.length ?? 1) - 1, 0),
    3,
  );
  const stackOffsetX = 4;
  const stackOffsetY = 6;

  useEffect(() => {
    if (recipe?.versions?.length) {
      // TODO: Currently setting the recipe version to the latest.
      // should open the last version before closed otherwise set to latest
      setRecipeVersion(recipe.versions.length - 1);
    } else {
      setRecipeVersion(0);
    }
  }, [recipe?.id, recipe?.versions?.length]);

  // Changes the document/tab title to recipe title
  useEffect(() => {
    if (recipe?.title) {
      document.title = recipe.title;
    }
  }, [recipe?.title]);

  useEffect(() => {
    if (!isEditing) return;
    setIsAssistantOpen(false);
    setIsQuestionsModalOpen(false);
  }, [isEditing]);

  if (isLoading) {
    return <RecipePageSkeleton />;
  }

  if (!recipe && !isLoading) {
    return <NotFoundPage />;
  }

  return (
    <div className="bg-base text-primary relative min-h-screen w-full">
      <main className="relative w-full">
        <div className="mx-auto flex w-full max-w-4xl px-3 py-2 pb-4 md:px-5">
          <div className="relative flex w-full">
            {stackCount > 0 && (
              <div
                className="border-primary/20 bg-base absolute inset-0 rounded-2xl border md:hidden"
                style={{
                  zIndex: 1,
                  transform: "translate(4px, 6px)",
                }}
              />
            )}
            {Array.from({ length: stackCount }, (_, index) => {
              const layer = stackCount - index;

              return (
                <div
                  key={`kitchen-stack-${layer}`}
                  className="border-primary/20 bg-base absolute inset-0 hidden rounded-2xl border md:block"
                  style={{
                    zIndex: index + 1,
                    transform: `translate(${layer * stackOffsetX}px, ${layer * stackOffsetY}px)`,
                  }}
                />
              );
            })}
            <div className="bg-mantle border-primary/10 relative z-20 flex w-full flex-col rounded-2xl border md:min-h-[calc(100dvh-1rem)]">
              <KitchenHeader
                recipe={recipe}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editFormId={RECIPE_EDIT_FORM_ID}
                isSticky
              />
              <div className="relative flex flex-col md:min-h-0 md:flex-1">
                <div className="md:min-h-0 md:flex-1">
                  {!isEditing ? (
                    <div className="mx-auto w-full max-w-4xl px-5 md:min-h-0 md:flex-1 md:overflow-y-auto md:px-8">
                      <div
                        className="w-full pt-2"
                        style={{ paddingBottom: "16px" }}
                      >
                        <RecipeContentTags recipe={recipe} />
                        <RecipeContent
                          recipe={recipe}
                          recipeVersion={recipeVersion}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto w-full max-w-4xl px-5 md:min-h-0 md:flex-1 md:overflow-y-auto md:px-8">
                      <div className="w-full pt-2">
                        <RecipeEditForm
                          recipe={recipe}
                          recipeVersion={recipeVersion}
                          isEditing={isEditing}
                          formId={RECIPE_EDIT_FORM_ID}
                          setIsEditing={setIsEditing}
                          openDeleteModal={openDeleteModal}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="pointer-events-none sticky bottom-0 mt-4">
                    <div className="mx-auto w-full max-w-4xl px-3 md:px-8">
                      <div className="pb-safe-tight w-full pt-2">
                        <div className="flex items-center justify-between">
                          {hasRecipeNavigation && !isAssistantOpen ? (
                            <div className="pointer-events-auto shrink-0">
                              <RecipeVersionNavigation
                                recipe={recipe}
                                recipeVersion={recipeVersion}
                                setRecipeVersion={
                                  setRecipeVersion as Dispatch<
                                    SetStateAction<number>
                                  >
                                }
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
                              recipe={recipe as Recipe}
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
            </div>
          </div>
        </div>
      </main>
      {deleteModal.isOpen && deleteModal.recipe && deleteModal.type && (
        <DeleteRecipePortal
          recipe={deleteModal.recipe}
          type={deleteModal.type}
          versionCount={deleteModal.recipe.versions.length}
          recipeVersion={deleteModal.recipeVersion}
          onClose={closeDeleteModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default RecipePage;
