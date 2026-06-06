import { memo, Dispatch, SetStateAction } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Recipe } from "../../../types/recipe";

type RecipeVersionNavigationProps = {
  recipe: Recipe;
  recipeVersion: number;
  setRecipeVersion: Dispatch<SetStateAction<number>>;
};

const RecipeVersionNavigation = memo(
  ({
    recipe,
    recipeVersion,
    setRecipeVersion,
  }: RecipeVersionNavigationProps) => {
    const totalVersions = recipe?.versions?.length ?? 0;

    function handleNext(event: React.MouseEvent<HTMLButtonElement>) {
      event.stopPropagation();
      if (totalVersions > recipeVersion + 1) {
        setRecipeVersion((prev) => prev + 1);
      }
    }

    function handlePrevious(event: React.MouseEvent<HTMLButtonElement>) {
      event.stopPropagation();
      if (recipeVersion > 0) {
        setRecipeVersion((prev) => prev - 1);
      }
    }

    return (
      <div className="border-secondary/15 bg-mantle flex h-11 shrink-0 items-center gap-2 rounded-full border px-2">
        <button
          onClick={handlePrevious}
          disabled={recipeVersion === 0}
          className="text-secondary flex h-8 w-6 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous version"
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>

        <span className="text-secondary min-w-14 text-center text-sm font-medium tabular-nums">
          {recipeVersion + 1}
          <span className="text-icon-muted">/{totalVersions}</span>
        </span>
        <button
          onClick={handleNext}
          disabled={recipeVersion === totalVersions - 1}
          className="text-secondary flex h-8 w-6 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next version"
        >
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      </div>
    );
  },
);

RecipeVersionNavigation.displayName = "RecipeVersionNavigation";

export default RecipeVersionNavigation;
