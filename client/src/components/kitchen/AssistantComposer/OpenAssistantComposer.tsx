import {
  ArrowUp,
  LoaderCircle,
  Minimize2,
} from "lucide-react";
import RecipeVersionNavigation from "../RecipeVersionNavigation.js";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Recipe } from "../../../types/recipe.js";

type OpenAssistantComposerProps = {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  canSend: boolean;
  isPending: boolean;
  isNewRecipe: boolean;
  hasRecipeNavigation: boolean;
  recipe?: Recipe;
  recipeVersion?: number;
  setRecipeVersion?: Dispatch<SetStateAction<number>>;
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  minHeight: number;
  maxHeight: number;
  onMinimize: () => void;
  onSubmit: () => void;
};

function OpenAssistantComposer({
  prompt,
  setPrompt,
  canSend,
  isPending,
  isNewRecipe,
  hasRecipeNavigation,
  recipe,
  recipeVersion,
  setRecipeVersion,
  textAreaRef,
  minHeight,
  maxHeight,
  onMinimize,
  onSubmit,
}: OpenAssistantComposerProps) {
  return (
    <div className="border-secondary/30 bg-base shadow-xs focus-within:border-secondary/50 relative w-full rounded-[1.5rem] border transition-colors duration-200">
      <textarea
        rows={1}
        ref={textAreaRef}
        className={`placeholder:text-secondary/65 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[1rem] leading-7 outline-none ${!isNewRecipe ? "pr-12" : ""} ${isPending ? "text-icon-disabled" : "text-primary"}`}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflowY: "auto",
        }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        aria-label="Enter recipe request or changes"
        placeholder="Describe a recipe or revision..."
        disabled={isPending}
      />

      {!isNewRecipe && (
        <button
          onClick={onMinimize}
          className="text-accent hover:bg-mantle hover:text-accent-hover absolute top-3 right-3 inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors duration-150"
          aria-label="Minimize recipe assistant"
        >
          <Minimize2 size={16} strokeWidth={1.5} className="stroke-current" />
        </button>
      )}

      <div
        className={`relative z-1 flex items-end gap-2.5 px-4 pt-2.5 pb-2.5 ${
          !isNewRecipe ? "justify-between" : "justify-end"
        }`}
      >
        {!isNewRecipe && (
          <div className="flex min-h-9 items-center gap-2">
            {hasRecipeNavigation && recipe && recipeVersion !== undefined && setRecipeVersion && (
              <RecipeVersionNavigation
                recipe={recipe}
                recipeVersion={recipeVersion}
                setRecipeVersion={setRecipeVersion}
              />
            )}
          </div>
        )}

        <button
          type="button"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
            canSend
              ? "border-accent bg-accent hover:bg-accent-hover cursor-pointer text-white"
              : "border-secondary/15 text-secondary/55 cursor-not-allowed"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onSubmit();
          }}
          disabled={!canSend}
          aria-label="Submit recipe prompt"
        >
          {isPending ? (
            <LoaderCircle
              size={16}
              strokeWidth={1.5}
              className="animate-spin stroke-current"
            />
          ) : (
            <ArrowUp size={16} strokeWidth={1.5} className="stroke-current" />
          )}
        </button>
      </div>
    </div>
  );
}

export default OpenAssistantComposer;
