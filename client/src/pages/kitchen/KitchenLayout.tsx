import { useEffect, useState, useMemo } from "react";
import { Outlet, useParams } from "react-router";
import KitchenSidebar from "../../components/kitchen/KitchenSidebar/KitchenSidebar";
import KitchenHeader from "../../components/kitchen/KitchenHeader/KitchenHeader.js";
import DeleteRecipePortal from "../../components/delete/DeleteRecipePortal.js";
import { useDeleteRecipe } from "../../hooks/useDeleteRecipe.js";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";
import { useRecipes } from "../../hooks/useRecipes";
import { useKitchenSidebar } from "../../hooks/useKitchenSidebar";
import useIsMobile from "../../hooks/useIsMobile";

const KitchenLayout = () => {
  const { id } = useParams();
  const { user, logout, isLoading: isUserLoading } = useUser();
  const { recipes, isLoading } = useRecipes({ page: 1, pageSize: 1000 });
  const isMobile = useIsMobile();
  const { isSideBarOpen, setIsSideBarOpen, isSidebarHydrated } =
    useKitchenSidebar(user, isMobile, isUserLoading);
  const { showToast } = useToast();
  const recipe = useMemo(() => {
    if (!id) return null;
    return recipes.find((r) => r.id === id) || null;
  }, [recipes, id]);

  const [recipeVersion, setRecipeVersion] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [hasSidebarInteracted, setHasSidebarInteracted] =
    useState<boolean>(false);

  const { deleteModal, openDeleteModal, closeDeleteModal, handleDelete } =
    useDeleteRecipe({
      getRedirectPath: ({ type, recipe }) => {
        const isDeletingActiveRecipe = recipe?.id === id;
        const isDeletingLastVersion =
          type === "version" && recipe?.versions?.length === 1;

        if (
          isDeletingActiveRecipe &&
          (type === "all" || isDeletingLastVersion)
        ) {
          return "/kitchen";
        }

        return null;
      },
    });

  const handleSidebarOpenChange = (nextIsOpen: boolean) => {
    setHasSidebarInteracted(true);
    setIsSideBarOpen(nextIsOpen);
  };

  const contextValue = useMemo(
    () => ({
      recipe,
      recipeVersion,
      setRecipeVersion,
      isMobile,
      isSideBarOpen,
      setIsSideBarOpen,
      showToast,
      openDeleteModal,
      isEditModalOpen,
      setIsEditModalOpen,
      isLoading,
    }),
    [
      recipe,
      recipeVersion,
      setRecipeVersion,
      isMobile,
      isSideBarOpen,
      setIsSideBarOpen,
      showToast,
      openDeleteModal,
      isEditModalOpen,
      setIsEditModalOpen,
      isLoading,
    ],
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

  return (
    <div
      className={`bg-base text-primary relative flex h-[100dvh] w-full overflow-hidden overscroll-contain`}
    >
      <KitchenSidebar
        recipes={recipes ?? []}
        user={user}
        logout={logout}
        isMobile={isMobile}
        isSideBarOpen={isSideBarOpen}
        isSidebarHydrated={isSidebarHydrated}
        hasSidebarInteracted={hasSidebarInteracted}
        setIsSideBarOpen={handleSidebarOpenChange}
        currentRecipe={recipe}
        openDeleteModal={openDeleteModal}
      />
      {isMobile && isSideBarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30"
          onClick={() => handleSidebarOpenChange(false)}
        />
      )}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <KitchenHeader
          recipe={recipe}
          recipeVersion={recipeVersion}
          isSideBarOpen={isSideBarOpen}
          setIsSideBarOpen={handleSidebarOpenChange}
          setIsEditModalOpen={setIsEditModalOpen}
          openDeleteModal={openDeleteModal}
          isMobile={isMobile}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet context={contextValue} />
        </div>
      </main>
      {deleteModal.isOpen && deleteModal.recipe && deleteModal.type && (
        <DeleteRecipePortal
          recipe={deleteModal.recipe}
          type={deleteModal.type}
          onClose={closeDeleteModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default KitchenLayout;
