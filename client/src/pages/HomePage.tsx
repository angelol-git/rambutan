import { useEffect, useState } from "react";
import UserOptions from "../components/UserOptions";
import HomeTags from "../components/home/HomeTags";
import HomeItems from "../components/home/HomeItems";
import { useUser } from "../hooks/useUser";
import { useRecipes } from "../hooks/useRecipes";
import { useTags } from "../hooks/useTags";

function HomePageSkeleton() {
  return (
    <div className="text-primary bg-base flex min-h-screen flex-col items-center p-6 lg:p-10">
      <div className="flex w-full max-w-screen-lg flex-col gap-5">
        <header className="flex items-center justify-between">
          <h1 className="font-lora text-4xl font-medium">Rambutan</h1>
          <div />
        </header>
        <main className="flex flex-col gap-6">
          <div className="font-semibold">Tags</div>
          <div className="font-semibold">Recipes</div>
        </main>
      </div>
    </div>
  );
}

function HomePage() {
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
    resetSelectedTags,
    tagCounts,
    deleteTagsAll,
    isDeletingTags,
    editTagsAll,
  } = useTags(user, recipes);

  useEffect(() => {
    document.title = "Rambutan";
  }, []);

  const isLoading = isUserLoading || isRecipesLoading;

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

  if (isLoading) {
    return <HomePageSkeleton />;
  }

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
            resetSelectedTags={resetSelectedTags}
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
    </div>
  );
}

export default HomePage;
