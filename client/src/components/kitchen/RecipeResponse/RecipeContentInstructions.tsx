import type { RecipeInstruction } from "../../../types/recipe";
import { RoughStrike } from "../../../utils/RoughStrike";

type RecipeContentInstructionsProps = {
  instructions: RecipeInstruction[];
  // eslint-disable-next-line no-unused-vars
  onToggleCompletion(instructionId: string): void;
  onResetCompletion: () => void;
};

function RecipeContentInstructions({
  instructions,
  onToggleCompletion,
  onResetCompletion,
}: RecipeContentInstructionsProps) {
  if (instructions.length === 0) return null;

  return (
    <section aria-labelledby="instructions-heading" className="mb-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <h3 id="instructions-heading" className="font-lora text-lg font-medium">
          Instructions
        </h3>
        {instructions.some((item) => item.completed) && (
          <button
            type="button"
            onClick={onResetCompletion}
            className="text-secondary/80 hover:text-primary font-ibm-plex-mono cursor-pointer text-sm uppercase"
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
              onClick={() => onToggleCompletion(item.id)}
              aria-pressed={item.completed}
              className="hover:bg-base-hover relative w-full cursor-pointer rounded-lg px-1 py-1 text-left transition-colors duration-150"
            >
              <div className="flex gap-2">
                <span className="font-lora font-semibold">{index + 1}.</span>
                <RoughStrike
                  completed={item.completed}
                  className="min-w-0 flex-1 wrap-break-word"
                >
                  {item.raw_text}
                </RoughStrike>
              </div>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default RecipeContentInstructions;
