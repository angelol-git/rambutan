import { useLayoutEffect, useRef } from "react";
import type { useDraftRecipe } from "../../../hooks/useDraftRecipe";

type RecipeEditTitleProps = {
  recipeTitle: string;
  handleDraftString: ReturnType<typeof useDraftRecipe>["handleDraftString"];
};

function RecipeEditTitle({
  recipeTitle,
  handleDraftString,
}: RecipeEditTitleProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight);
    const paddingTop = Number.parseFloat(computedStyle.paddingTop);
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom);
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth);
    const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth);
    const maxHeight =
      lineHeight * 2 + paddingTop + paddingBottom + borderTop + borderBottom;

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [recipeTitle]);

  return (
    <label className="mb-2 block">
      <h3 className="font-lora text-secondary mb-2 text-lg font-medium">
        Title
      </h3>
      <textarea
        ref={textareaRef}
        aria-label="Recipe title"
        name="editTitle"
        id="editTitle"
        maxLength={150}
        rows={1}
        value={recipeTitle}
        onChange={(event) => {
          handleDraftString("title", event.target.value);
        }}
        placeholder="Untitled recipe"
        className="font-lora text-primary placeholder:text-primary/35 border-secondary/20 focus:border-secondary/45 w-full overflow-y-hidden resize-none border-0 border-b bg-transparent px-0 pb-1 text-3xl leading-snug font-semibold outline-none md:text-4xl"
        required
      />
    </label>
  );
}

export default RecipeEditTitle;
