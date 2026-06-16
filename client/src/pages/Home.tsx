import { useEffect, useState } from "react";
import UserOptions from "../components/UserOptions";
import HomeTags from "../components/home/HomeTags";
import HomeItems from "../components/home/HomeItems";
import DeleteRecipePortal from "../components/delete/DeleteRecipePortal";
import { useUser } from "../hooks/useUser";
import { useRecipes } from "../hooks/useRecipes";
import { useTags } from "../hooks/useTags";
import { useDeleteRecipe } from "../hooks/useDeleteRecipe";

function Home() {
  const [page, setPage] = useState(1);
  const { user, logout, isLoading: isUserLoading } = useUser();
  const {
    recipes,
    pagination,
    isLoading: isRecipesLoading,
  } = useRecipes({
    page,
    pageSize: 8,
  });

  const {
    uniqueTags,
    selectedTags,
    handleTagSelectedClick,
    tagCounts,
    deleteTagsAll,
    isDeletingTags,
    editTagsAll,
  } = useTags(user, recipes);

  const { deleteModal, closeDeleteModal, handleDelete } = useDeleteRecipe();

  useEffect(() => {
    document.title = "Rambutan";
  }, []);

  useEffect(() => {
    if (!isUserLoading && !isRecipesLoading) {
      window.hideShell?.();
    }
  }, [isUserLoading, isRecipesLoading]);

  const filteredRecipes = (recipes ?? []).filter((recipe) => {
    if (selectedTags.length === 0) return true;

    return recipe.tags.some((recipeTag) => {
      return selectedTags.some(
        (selectedTag) => selectedTag.name === recipeTag.name,
      );
    });
  });

  useEffect(() => {
    setPage(1);
  }, [selectedTags]);

  return (
    <div className="text-primary bg-base flex min-h-screen flex-col items-center p-6 lg:p-10">
      <div className="flex w-full max-w-screen-lg flex-col gap-5">
        <header className="flex items-center justify-between">
          <h1 className="font-lora text-4xl font-medium">Rambutan</h1>
          <UserOptions user={user} logout={logout} />
        </header>
        <main className="flex flex-col gap-4">
          <HomeTags
            tags={uniqueTags}
            selectedTags={selectedTags}
            handleTagSelectedClick={handleTagSelectedClick}
            tagCounts={tagCounts}
            deleteTagsAll={deleteTagsAll}
            isDeletingTags={isDeletingTags}
            editTagsAll={editTagsAll}
          />

          <HomeItems
            filteredRecipes={filteredRecipes}
            page={page}
            setPage={setPage}
            totalPages={pagination?.totalPages ?? 0}
            totalItems={pagination?.totalItems ?? 0}
          />
        </main>
      </div>
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

export default Home;
