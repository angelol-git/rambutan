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
    <section
      aria-labelledby="instructions-heading"
      className="mb-5 w-full border-t border-black/8 pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="instructions-heading" className="font-lora text-xl font-medium">
          Instructions
        </h3>
        {instructions.some((item) => item.completed) && (
          <button
            type="button"
            onClick={onResetCompletion}
            className="interactive-mono text-secondary hover:text-primary text-[11px] tracking-[0.12em] uppercase"
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
              className="group relative w-full cursor-pointer rounded-lg px-1 py-1 text-left transition-colors duration-150"
            >
              <div className="flex gap-2">
                <span className="font-lora font-semibold">{index + 1}.</span>
                <RoughStrike
                  completed={item.completed}
                  className={`min-w-0 flex-1 wrap-break-word ${
                    !item.completed
                      ? "group-hover:decoration-secondary/100 group-hover:line-through"
                      : ""
                  }`}
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
