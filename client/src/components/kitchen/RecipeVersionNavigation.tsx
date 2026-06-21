import { memo, Dispatch, SetStateAction } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Recipe } from "../../types/recipe";

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
      <div className="border-primary/18 bg-base text-secondary shadow-xs flex h-9 shrink-0 items-center gap-0.5 rounded-full border px-0.5">
        <button
          onClick={handlePrevious}
          disabled={recipeVersion === 0}
          className="hover:bg-mantle-hover/55 hover:text-primary flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Previous version"
        >
          <ChevronLeft size={14} strokeWidth={1.6} />
        </button>

        <span className="font-ibm-plex-mono min-w-[2.75rem] text-center text-[10px] tracking-[0.08em] uppercase tabular-nums">
          {recipeVersion + 1}
          <span className="text-secondary/60 mx-0.5">/</span>
          {totalVersions}
        </span>
        <button
          onClick={handleNext}
          disabled={recipeVersion === totalVersions - 1}
          className="hover:bg-mantle-hover/55 hover:text-primary flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Next version"
        >
          <ChevronRight size={14} strokeWidth={1.6} />
        </button>
      </div>
    );
  },
);

RecipeVersionNavigation.displayName = "RecipeVersionNavigation";

export default RecipeVersionNavigation;
