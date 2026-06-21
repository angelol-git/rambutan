import { useEffect, useState, useMemo } from "react";
import { Outlet, useParams } from "react-router";
import KitchenHeader from "../../components/kitchen/KitchenHeader/KitchenHeader.js";
import DeleteRecipePortal from "../../components/delete/DeleteRecipePortal.js";
import { useDeleteRecipe } from "../../hooks/useDeleteRecipe.js";
import { useToast } from "../../hooks/useToast";
import { useRecipes } from "../../hooks/useRecipes";

const KitchenLayout = () => {
  const { id } = useParams();
  const { recipes, isLoading } = useRecipes({ page: 1, pageSize: 1000 });

  const { showToast } = useToast();
  const recipe = useMemo(() => {
    if (!id) return null;
    return recipes.find((r) => r.id === id) || null;
  }, [recipes, id]);

  const [recipeVersion, setRecipeVersion] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { deleteModal, openDeleteModal, closeDeleteModal, handleDelete } =
    useDeleteRecipe({
      onDeleteVersion: setRecipeVersion,
    });

  const contextValue = useMemo(
    () => ({
      recipe,
      recipeVersion,
      setRecipeVersion,
      showToast,
      openDeleteModal,
      isEditing,
      setIsEditing,
      isLoading,
    }),
    [recipe, recipeVersion, showToast, openDeleteModal, isEditing, isLoading],
  );
  // Reset recipeVersion when recipe changes
  useEffect(() => {
    if (recipe?.versions?.length) {
      setRecipeVersion(recipe.versions.length - 1);
    } else {
      setRecipeVersion(0);
    }
  }, [recipe?.id, recipe?.versions?.length]);

  // Update document title when recipe changes
  useEffect(() => {
    if (recipe?.title) {
      document.title = recipe.title;
    }
  }, [recipe?.title]);

  const stackCount = Math.min(
    Math.max((recipe?.versions?.length ?? 1) - 1, 0),
    3,
  );
  const stackOffsetX = 4;
  const stackOffsetY = 6;

  return (
    <div className={`bg-base text-primary relative min-h-screen w-full`}>
      <main className="relative w-full">
        <div className="mx-auto flex w-full max-w-screen-md px-2 py-2 pb-4">
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
            <div className="bg-mantle border-primary/10 relative z-20 flex w-full flex-col rounded-2xl border">
              <KitchenHeader
                recipe={recipe}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
              <div>
                <Outlet context={contextValue} />
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
};

export default KitchenLayout;
