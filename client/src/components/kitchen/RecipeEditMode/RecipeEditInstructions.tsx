import type { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import type { DraftRecipe } from "../../../types/draftRecipe";

type RecipeEditInstructionsProps = {
  instructions: DraftRecipe["instructions"];
  handleDraftInstructionUpdate: ReturnType<
    typeof useDraftRecipe
  >["handleDraftInstructionUpdate"];
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

function RecipeEditInstructions({
  instructions,
  handleDraftInstructionUpdate,
  handleDraftArrayDelete,
  handleDraftArrayPush,
}: RecipeEditInstructionsProps) {
  const recipeInstructions = instructions || [];

  return (
    <section
      aria-labelledby="edit-instructions-heading"
      className="mb-4 w-full"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3
          id="edit-instructions-heading"
          className="font-lora text-secondary text-lg font-medium"
        >
          Instructions
        </h3>
        <button
          type="button"
          onClick={() => handleDraftArrayPush("instructions", "")}
          className="interactive-mono text-secondary/80 text-sm uppercase"
        >
          Add step
        </button>
      </div>
      <ol className="flex list-decimal flex-col gap-2 pt-2">
        {recipeInstructions.map((instruction, index) => (
          <li key={instruction.id} className="flex gap-2">
            <span className="font-lora mt-1 font-semibold">{index + 1}.</span>
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <textarea
                aria-label={`Instruction ${index + 1}`}
                value={instruction.raw_text || ""}
                rows={2}
                placeholder="Step"
                onChange={(event) => {
                  autoResize(event.target);
                  handleDraftInstructionUpdate(event.target.value, index);
                }}
                className="text-primary placeholder:text-primary/35 border-secondary/20 focus:border-secondary/45 min-h-[3.5rem] w-full resize-none overflow-hidden border-0 border-b bg-transparent px-0 pb-1 leading-relaxed outline-none"
              />
              <button
                type="button"
                onClick={() => handleDraftArrayDelete("instructions", index)}
                className="interactive-mono text-secondary/70 mt-1 text-xs uppercase"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default RecipeEditInstructions;
