import type { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import type { DraftRecipe } from "../../../types/draftRecipe";

type RecipeEditIngredientsProps = {
  ingredients: DraftRecipe["ingredients"];
  handleDraftIngredientUpdate: ReturnType<
    typeof useDraftRecipe
  >["handleDraftIngredientUpdate"];
  handleDraftArrayDelete: ReturnType<
    typeof useDraftRecipe
  >["handleDraftArrayDelete"];
  handleDraftArrayPush: ReturnType<
    typeof useDraftRecipe
  >["handleDraftArrayPush"];
};

function autoResize(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function RecipeEditIngredients({
  ingredients,
  handleDraftIngredientUpdate,
  handleDraftArrayDelete,
  handleDraftArrayPush,
}: RecipeEditIngredientsProps) {
  const recipeIngredients = ingredients || [];

  return (
    <section aria-labelledby="edit-ingredients-heading" className="mb-4 w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3
          id="edit-ingredients-heading"
          className="font-lora text-secondary text-lg font-medium"
        >
          Ingredients
        </h3>
        <button
          type="button"
          onClick={() => handleDraftArrayPush("ingredients", "")}
          className="interactive-mono text-secondary/80 text-sm uppercase"
        >
          Add ingredient
        </button>
      </div>
      <ul className="flex flex-col gap-2 pt-2">
        {recipeIngredients.map((ingredient, index) => (
          <li key={ingredient.id} className="flex flex-col gap-2">
            <div className="grid grid-cols-[auto_1fr_auto] items-start gap-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Ingredient ${index + 1} quantity`}
                  value={
                    ingredient.quantity_text ??
                    ingredient.quantity_value?.toString() ??
                    ""
                  }
                  onChange={(event) =>
                    handleDraftIngredientUpdate(
                      "quantity_text",
                      event.target.value,
                      index,
                    )
                  }
                  placeholder="1"
                  className="text-primary placeholder:text-primary/35 border-secondary/20 focus:border-secondary/45 w-10 shrink-0 border-0 border-b bg-transparent px-0 pb-1 outline-none"
                />
                <input
                  type="text"
                  aria-label={`Ingredient ${index + 1} unit`}
                  value={ingredient.unit ?? ""}
                  onChange={(event) =>
                    handleDraftIngredientUpdate(
                      "unit",
                      event.target.value,
                      index,
                    )
                  }
                  placeholder="cup"
                  className="text-primary placeholder:text-primary/35 border-secondary/20 focus:border-secondary/45 w-12 shrink-0 border-0 border-b bg-transparent px-0 pb-1 outline-none"
                />
              </div>

              <textarea
                aria-label={`Ingredient ${index + 1} name`}
                value={ingredient.ingredient_name || ""}
                rows={1}
                placeholder="Ingredient"
                onChange={(event) => {
                  autoResize(event.target);
                  handleDraftIngredientUpdate(
                    "ingredient_name",
                    event.target.value,
                    index,
                  );
                }}
                className="text-primary placeholder:text-primary/35 border-secondary/20 focus:border-secondary/45 min-h-[1.75rem] w-full min-w-0 resize-none overflow-hidden border-0 border-b bg-transparent px-0 pb-1 leading-relaxed outline-none"
              />
              <button
                type="button"
                onClick={() => handleDraftArrayDelete("ingredients", index)}
                className="interactive-mono text-secondary/70 mt-1 text-xs uppercase"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecipeEditIngredients;
