import { useEffect, useState, memo, type RefObject } from "react";
import RecipePromptModal from "./RecipePromptModal";
import RecipeDetailsBar from "./RecipeDetailsBar";
import type {
  Recipe,
  RecipeDetails,
  RecipeIngredient,
  RecipeInstruction,
} from "../../../types/recipe";
import { useRecipeMutations } from "../../../hooks/useRecipes";
import { RoughStrike } from "../../../utils/RoughStrike";

const EMPTY_RECIPE_DETAILS: RecipeDetails = {
  calories: null,
  servings: null,
  total_time: null,
};

type RecipeResponseProps = {
  recipe: Recipe;
  recipeVersion: number;
  modalAnchorRef: RefObject<HTMLDivElement | null>;
};

function renderIngredient(ingredient: RecipeIngredient) {
  const hasPrimaryMeasurement =
    ingredient.quantity_text != null || ingredient.quantity_value != null;

  const hasAlternateMeasurement =
    ingredient.alternate_quantity_text != null ||
    ingredient.alternate_quantity_value != null;

  const measurementCell = (
    <RoughStrike
      completed={ingredient.completed}
      singleLine
      className="inline-flex w-fit items-center gap-1 justify-self-start self-start align-top"
    >
      {hasPrimaryMeasurement && (
        <span>
          {ingredient.quantity_text ?? ingredient.quantity_value?.toString()}
          {ingredient.unit && <span className="ml-1">{ingredient.unit}</span>}
        </span>
      )}
      {hasAlternateMeasurement && (
        <span className="text-secondary text-xs">
          (
          {ingredient.alternate_quantity_text ??
            ingredient.alternate_quantity_value?.toString()}
          {ingredient.alternate_unit && (
            <span className="ml-1">{ingredient.alternate_unit}</span>
          )}
          )
        </span>
      )}
    </RoughStrike>
  );

  const textCell = (
    <div className="relative min-w-0 self-start">
      {ingredient.completed && (
        <RoughStrike
          completed
          singleLine
          className="absolute top-[0.7em] left-0 -translate-x-full -translate-y-1/2"
        >
          <span aria-hidden className="block w-4" />
        </RoughStrike>
      )}
      <RoughStrike
        completed={ingredient.completed}
        firstLineOnly
        className="inline-block align-top"
      >
        {ingredient.ingredient_name && (
          <span>
            {ingredient.ingredient_name}{" "}
            {ingredient.note && (
              <span className="text-secondary text-xs">
                ({ingredient.note})
              </span>
            )}
          </span>
        )}
      </RoughStrike>
      {/* {ingredient.is_optional && (
        <RoughStrike completed={completed} singleLine>
          <span className="text-secondary text-xs">optional</span>
        </RoughStrike>
      )} */}
    </div>
  );

  return { measurementCell, textCell };
}

const RecipeResponse = memo(
  ({ recipe, recipeVersion, modalAnchorRef }: RecipeResponseProps) => {
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const { updateRecipe } = useRecipeMutations();
    const current = recipe?.versions?.[recipeVersion];
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [instructions, setInstructions] = useState<RecipeInstruction[]>([]);

    const {
      recipeDetails = EMPTY_RECIPE_DETAILS,
      description = "",
      source_prompt = "",
    } = current ?? {};

    useEffect(() => {
      setIngredients(current?.ingredients ?? []);
      setInstructions(current?.instructions ?? []);
    }, [current?.id, current?.ingredients, current?.instructions]);

    if (!current) return null;

    function persistRecipeItems(
      nextIngredients: RecipeIngredient[],
      nextInstructions: RecipeInstruction[],
    ) {
      updateRecipe({
        id: current.id,
        recipe_id: recipe.id,
        title: recipe.title,
        tags: recipe.tags,
        description,
        ingredients: nextIngredients,
        instructions: nextInstructions,
        recipeDetails,
        source_prompt,
      });
    }

    function toggleIngredientCompletion(ingredientId: string) {
      const nextIngredients = ingredients.map((item) =>
        item.id === ingredientId
          ? { ...item, completed: !item.completed }
          : item,
      );

      setIngredients(nextIngredients);
      persistRecipeItems(nextIngredients, instructions);
    }

    function toggleInstructionCompletion(instructionId: string) {
      const nextInstructions = instructions.map((item) =>
        item.id === instructionId
          ? { ...item, completed: !item.completed }
          : item,
      );

      setInstructions(nextInstructions);
      persistRecipeItems(ingredients, nextInstructions);
    }

    function resetIngredientCompletion() {
      const nextIngredients = ingredients.map((item) => ({
        ...item,
        completed: false,
      }));

      setIngredients(nextIngredients);
      persistRecipeItems(nextIngredients, instructions);
    }

    function resetInstructionCompletion() {
      const nextInstructions = instructions.map((item) => ({
        ...item,
        completed: false,
      }));

      setInstructions(nextInstructions);
      persistRecipeItems(ingredients, nextInstructions);
    }

    return (
      <div role="log" aria-live="polite" className="flex flex-col gap-2">
        <h1 className="font-lora line-clamp-2 max-w-screen-md text-3xl leading-snug font-semibold md:text-4xl">
          {recipe?.title}
        </h1>
        <RecipeDetailsBar recipeDetails={recipeDetails} />
        <p className="mb-4 break-inside-avoid">{description}</p>

        {ingredients.length > 0 && (
          <section
            aria-labelledby="ingredients-heading"
            className="mb-4 w-full"
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id="ingredients-heading"
                className="font-lora text-lg font-medium"
              >
                Ingredients
              </h3>
              {ingredients.some((item) => item.completed) && (
                <button
                  type="button"
                  onClick={resetIngredientCompletion}
                  className="text-secondary/80 hover:text-primary cursor-pointer text-sm underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>
            <ul className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 pt-2">
              {ingredients.map((item) => {
                const { measurementCell, textCell } = renderIngredient(item);

                return (
                  <li
                    key={item.id}
                    className="col-span-2 grid grid-cols-subgrid"
                  >
                    <button
                      type="button"
                      onClick={() => toggleIngredientCompletion(item.id)}
                      aria-pressed={item.completed}
                      className="hover:bg-base-hover col-span-2 grid cursor-pointer grid-cols-subgrid items-start rounded-lg px-2 py-1 text-left transition-colors duration-150"
                    >
                      {measurementCell}
                      {textCell}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {instructions.length > 0 && (
          <section
            aria-labelledby="instructions-heading"
            className="mb-4 w-full"
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id="instructions-heading"
                className="font-lora text-lg font-medium"
              >
                Instructions
              </h3>
              {instructions.some((item) => item.completed) && (
                <button
                  type="button"
                  onClick={resetInstructionCompletion}
                  className="text-secondary/80 hover:text-primary cursor-pointer text-sm underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>
            <ol className="flex flex-col gap-2 pt-2">
              {instructions.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleInstructionCompletion(item.id)}
                    aria-pressed={item.completed}
                    className="hover:bg-base-hover relative w-full cursor-pointer rounded-lg px-2 py-1 text-left transition-colors duration-150"
                  >
                    <div className="flex gap-2">
                      <span className="font-lora font-semibold">
                        {index + 1}.
                      </span>
                      <RoughStrike
                        completed={item.completed}
                        className="min-w-0 flex-1"
                      >
                        {item.raw_text}
                      </RoughStrike>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}
        {source_prompt && (
          <div className="text-secondary mt-4 flex max-w-full justify-between gap-4 text-sm">
            <div className="flex w-full max-w-full min-w-0 flex-col items-start gap-2 py-2">
              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="hover:bg-base-hover cursor-pointer rounded-lg p-1 underline transition-colors duration-150"
              >
                View Prompt
              </button>
            </div>
            {recipe.versions.length > 1 && (
              <p
                className="whitespace-nowrap"
                aria-label={`Version ${recipeVersion + 1} of ${
                  recipe.versions.length
                }`}
              >
                {recipeVersion + 1} of {recipe.versions.length}
              </p>
            )}
          </div>
        )}
        <RecipePromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          sourcePrompt={source_prompt || ""}
          anchorRef={modalAnchorRef}
        />
      </div>
    );
  },
);

RecipeResponse.displayName = "RecipeResponse";

export default RecipeResponse;
