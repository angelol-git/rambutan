import { useEffect, useRef, useState } from "react";
import { Flame, Clock, Utensils, Info } from "lucide-react";
import type {
  RecipeDetails,
  RecipeDetailValue,
} from "../../../types/recipe";

type RecipeDetailsBarProps = {
  recipeDetails: RecipeDetails;
};

function formatApproxValue(value: RecipeDetailValue) {
  if (value === null || value === undefined || value === "") return "N/A";
  return `~${value}`;
}

function RecipeDetailsBar({ recipeDetails }: RecipeDetailsBarProps) {
  const [isDetailsPopoverOpen, setIsDetailsPopoverOpen] = useState(false);
  const detailsPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isDetailsPopoverOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!(event.target instanceof Node)) return;
      if (!detailsPopoverRef.current?.contains(event.target)) {
        setIsDetailsPopoverOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDetailsPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDetailsPopoverOpen]);

  return (
    <div
      role="group"
      aria-label="Recipe details"
      className="text-secondary flex break-inside-avoid flex-wrap items-center gap-x-4 gap-y-2 py-2"
    >
      <div className="flex items-center gap-1">
        <Flame size={18} strokeWidth={1.5} className="stroke-secondary" />
        <div>{formatApproxValue(recipeDetails.calories)}</div>
        kcal
      </div>
      <div className="flex items-center gap-1">
        <Clock size={18} strokeWidth={1.5} className="stroke-secondary" />
        <div>{formatApproxValue(recipeDetails.total_time)}</div>
        mins
      </div>
      <div className="flex items-center gap-1">
        <Utensils size={18} strokeWidth={1.5} className="stroke-secondary" />
        <div>{formatApproxValue(recipeDetails.servings)}</div>
        servings
      </div>
      <div
        ref={detailsPopoverRef}
        className="relative ml-auto flex items-center"
      >
        <button
          type="button"
          className="text-secondary/60 hover:text-secondary focus:text-secondary cursor-pointer"
          onClick={() => setIsDetailsPopoverOpen((open) => !open)}
          aria-expanded={isDetailsPopoverOpen}
          aria-label="Recipe details may be estimated"
        >
          <Info size={16} strokeWidth={1.5} />
        </button>
        {isDetailsPopoverOpen && (
          <div
            className="bg-base text-primary border-overlay0 absolute top-full right-0 z-20 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-lg border px-3 py-2 text-xs shadow-sm"
            role="tooltip"
          >
            Calories, total time, and servings may be estimated.
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeDetailsBar;
