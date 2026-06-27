import RecipeContentDetails from "./RecipeContentDetails";
import RecipeContentIngredients from "./RecipeContentIngredients";
import RecipeContentInstructions from "./RecipeContentInstructions";
import RecipeContentNotes from "./RecipeContentNotes";
import RecipeContentSource from "./RecipeContentSource";
import RecipeContentVersionInfo from "./RecipeContentVersionInfo";
import { useRecipeCompletion } from "../../../hooks/useRecipeCompletion";
import type { Recipe, RecipeDetails } from "../../../types/recipe";

const EMPTY_RECIPE_DETAILS: RecipeDetails = {
  calories: null,
  servings: null,
  total_time: null,
};

type RecipeContentProps = {
  recipe: Recipe;
  recipeVersion: number;
};

function RecipeContent({ recipe, recipeVersion }: RecipeContentProps) {
  const current = recipe?.versions?.[recipeVersion];
  const recipeVersionId = current?.id ?? "";
  const initialIngredients = current?.ingredients ?? [];
  const initialInstructions = current?.instructions ?? [];

  const {
    recipeDetails = EMPTY_RECIPE_DETAILS,
    description = "",
    notes = "",
    source = null,
  } = current ?? {};

  const {
    ingredients,
    instructions,
    toggleIngredientCompletion,
    toggleInstructionCompletion,
    resetIngredientCompletion,
    resetInstructionCompletion,
  } = useRecipeCompletion({
    recipeId: recipe.id,
    recipeVersionId,
    initialIngredients,
    initialInstructions,
  });

  if (!current) return null;

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex w-full flex-col gap-6 pb-4"
    >
      <div className="flex flex-col gap-3 pb-2">
        <p className="text-secondary font-ibm-plex-mono text-[11px] tracking-[0.12em] uppercase">
          Recipe
        </p>
        <h1 className="font-lora line-clamp-2 text-3xl leading-snug font-semibold wrap-break-word md:text-4xl">
          {recipe?.title}
        </h1>
        <RecipeContentDetails recipeDetails={recipeDetails} />
        {description ? (
          <p className="max-w-2xl wrap-break-word">{description}</p>
        ) : null}
      </div>
      <RecipeContentIngredients
        ingredients={ingredients}
        onToggleCompletion={toggleIngredientCompletion}
        onResetCompletion={resetIngredientCompletion}
      />
      <RecipeContentInstructions
        instructions={instructions}
        onToggleCompletion={toggleInstructionCompletion}
        onResetCompletion={resetInstructionCompletion}
      />
      <div className="border-primary/10 flex flex-col gap-4 border-t pt-5">
        <RecipeContentNotes notes={notes} />
        {notes && source ? (
          <div className="border-primary/10 border-t" aria-hidden="true" />
        ) : null}
        <RecipeContentSource source={source} />
        <RecipeContentVersionInfo
          recipeVersion={recipeVersion}
          versionCount={recipe.versions.length}
        />
      </div>
    </div>
  );
}

export default RecipeContent;
