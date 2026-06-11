import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router";
import HomeRecipeCard from "./HomeRecipeCard";
import type { Recipe } from "../../types/recipe";

type OpenDeleteModalProp = (
  recipe: Recipe,
  type: "version" | "all",
  recipeVersion?: number | null,
) => void;

type HomeItemsProps = {
  filteredRecipes: Recipe[];
  openDeleteModal: OpenDeleteModalProp;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  totalItems: number;
};

function HomeItems({
  filteredRecipes,
  openDeleteModal,
  page,
  setPage,
  totalPages,
  totalItems,
}: HomeItemsProps) {
  const isPreviousDisabled = page <= 1;
  const isNextDisabled = totalPages === 0 || page >= totalPages;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="font-semibold">Items({totalItems})</div>
        <Link
          to="/kitchen"
          className="focus-visible:ring-accent/25 border-accent/45 bg-accent/8 text-accent-hover hover:border-accent/55 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-8 cursor-pointer items-center justify-center rounded-full border px-3 py-1 text-sm leading-none shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          + Recipe
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:flex md:flex-wrap lg:gap-6">
        {filteredRecipes?.map((recipe) => {
          return (
            <HomeRecipeCard
              key={recipe.id}
              recipe={recipe}
              openDeleteModal={openDeleteModal}
            />
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={isPreviousDisabled}
            className="focus-visible:ring-accent/25 border-accent/45 bg-base hover:border-accent/55 inline-flex min-h-9 items-center justify-center rounded-full border px-4 py-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
            className="focus-visible:ring-accent/25 border-accent/45 bg-base hover:border-accent/55 inline-flex min-h-9 items-center justify-center rounded-full border px-4 py-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default HomeItems;
