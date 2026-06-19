import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router";
import HomeRecipeCard from "./HomeRecipeCard";
// import HomeRecipeLine from "./HomeRecipeLine";
import type { Recipe } from "../../types/recipe";

type HomeItemsProps = {
  filteredRecipes: Recipe[];
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
};

function HomeItems({
  filteredRecipes,
  page,
  setPage,
  totalPages,
  totalItems,
}: HomeItemsProps) {
  const isPreviousDisabled = page <= 1;
  const isNextDisabled = totalPages === 0 || page >= totalPages;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="font-semibold">Recipes({totalItems})</div>
        <Link
          to="/kitchen"
          className="text-accent hover:text-accent-hover font-ibm-plex-mono border-accent/60 hover:border-accent-hover cursor-pointer border-b pb-0.5 text-sm font-medium tracking-wider uppercase transition-colors duration-150"
        >
          + ADD RECIPE
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:min-h-[calc(275px*2+1rem)] md:auto-rows-[275px] md:grid-cols-4 lg:min-h-[calc(275px*2+1.5rem)] lg:gap-6">
        {filteredRecipes?.map((recipe) => {
          return <HomeRecipeCard key={recipe.id} recipe={recipe} />;
          // return <HomeRecipeLine key={recipe.id} recipe={recipe} />;
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={isPreviousDisabled}
            className="focus-visible:ring-accent/25 border-accent/45 bg-base hover:border-accent/55 inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <div className="text-sm font-medium">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={isNextDisabled}
            className="focus-visible:ring-accent/25 border-accent/45 bg-base hover:border-accent/55 inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default HomeItems;
