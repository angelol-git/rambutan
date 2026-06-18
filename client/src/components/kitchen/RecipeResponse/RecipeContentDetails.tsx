import type { RecipeDetails, RecipeDetailValue } from "../../../types/recipe";

type RecipeContentDetailsProps = {
  recipeDetails: RecipeDetails;
};

function formatApproxValue(value: RecipeDetailValue) {
  if (value === null || value === undefined || value === "") return "N/A";
  return `${value}`;
}

function RecipeContentDetails({
  recipeDetails,
}: RecipeContentDetailsProps) {
  return (
    <div
      role="group"
      aria-label="Recipe details"
      className="text-secondary flex break-inside-avoid flex-wrap items-center gap-x-4 py-2"
    >
      <div className="font-lora flex items-center gap-1 font-medium text-green-900/80 italic">
        <div>{formatApproxValue(recipeDetails.calories)}</div>
        Calories
      </div>

      <div className="font-lora flex items-center gap-1 font-medium text-green-900/80 italic">
        Cooks in
        <div>{formatApproxValue(recipeDetails.total_time)}</div>
        min
      </div>
      <div className="font-lora flex items-center gap-1 font-medium text-green-900/80 italic">
        Serves
        <div>{formatApproxValue(recipeDetails.servings)}</div>
      </div>
    </div>
  );
}

export default RecipeContentDetails;
