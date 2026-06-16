import type { RecipeIngredient } from "../../../types/recipe";
import { RoughStrike } from "../../../utils/RoughStrike";

type RecipeContentIngredientsProps = {
  ingredients: RecipeIngredient[];
  // eslint-disable-next-line no-unused-vars
  onToggleCompletion(ingredientId: string): void;
  onResetCompletion: () => void;
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
      className="inline-flex max-w-full items-center gap-1 justify-self-start break-words"
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
    <div className="relative min-w-0 pl-5">
      {ingredient.completed && (
        <RoughStrike
          completed
          singleLine
          className="text-secondary absolute top-[0.7em] left-0 -translate-y-1/2"
        >
          <span aria-hidden className="block w-4" />
        </RoughStrike>
      )}
      <RoughStrike
        completed={ingredient.completed}
        firstLineOnly
        className="inline-block max-w-full min-w-0 break-words"
      >
        {ingredient.ingredient_name && (
          <span className="break-words">
            {ingredient.ingredient_name}{" "}
            {ingredient.note && (
              <span className="text-secondary text-xs">
                ({ingredient.note})
              </span>
            )}
          </span>
        )}
      </RoughStrike>
    </div>
  );

  return { measurementCell, textCell };
}

function RecipeContentIngredients({
  ingredients,
  onToggleCompletion,
  onResetCompletion,
}: RecipeContentIngredientsProps) {
  if (ingredients.length === 0) return null;

  return (
    <section aria-labelledby="ingredients-heading" className="mb-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <h3 id="ingredients-heading" className="font-lora text-lg font-medium">
          Ingredients
        </h3>
        {ingredients.some((item) => item.completed) && (
          <button
            type="button"
            onClick={onResetCompletion}
            className="text-secondary/80 hover:text-primary font-ibm-plex-mono cursor-pointer text-sm uppercase"
          >
            Reset
          </button>
        )}
      </div>
      <ul className="grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] gap-x-4 gap-y-2 pt-2">
        {ingredients.map((item) => {
          const { measurementCell, textCell } = renderIngredient(item);

          return (
            <li key={item.id} className="col-span-2 grid grid-cols-subgrid">
              <button
                type="button"
                onClick={() => onToggleCompletion(item.id)}
                aria-pressed={item.completed}
                className="hover:bg-base-hover col-span-2 grid min-w-0 cursor-pointer grid-cols-subgrid items-start rounded-lg px-1 text-left transition-colors duration-150"
              >
                {measurementCell}
                {textCell}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RecipeContentIngredients;
