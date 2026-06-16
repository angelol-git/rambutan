import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useRecipeMutations } from "../../../hooks/useRecipes";
import type { Recipe } from "../../../types/recipe";
import type { DraftTag } from "../../../types/tag";
import TagChip from "../../tags/TagChip";

type RecipeContentTagsProps = {
  recipe: Recipe | null;
};

function RecipeContentTags({ recipe }: RecipeContentTagsProps) {
  const newTagRef = useRef<HTMLInputElement | null>(null);
  const { addRecipeTag } = useRecipeMutations();
  const tags = recipe?.tags || [];
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState<DraftTag>({
    name: "",
    color: "#FFB86C",
  });

  useEffect(() => {
    setIsAddingTag(false);
    setNewTag({ name: "", color: "#FFB86C" });
  }, [recipe?.id]);

  useEffect(() => {
    if (isAddingTag) {
      newTagRef.current?.focus();
    }
  }, [isAddingTag]);

  function handleAddTag() {
    if (!newTag.name.trim()) return;
    if (!recipe) return;
    addRecipeTag({
      recipeId: recipe.id,
      newTag: { ...newTag, name: newTag.name.trim() },
    });

    setNewTag({ name: "", color: "#FFB86C" });
    setIsAddingTag(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.length > 0 &&
        tags.map((tag) => {
          return (
            <TagChip key={tag.id} color={tag.color}>
              {tag.name}
            </TagChip>
          );
        })}
      {isAddingTag && (
        <div className="flex gap-2">
          <TagChip color={newTag.color}>
            <input
              ref={newTagRef}
              onChange={(event) => {
                setNewTag((prev) => ({
                  ...prev,
                  name: event.target.value,
                }));
              }}
              value={newTag.name}
              type="text"
              className="border-secondary/50 text-primary placeholder:text-secondary/70 w-[100px] min-w-[4ch] border-0 border-b bg-transparent pb-0.5 leading-none outline-none"
              aria-label="New tag name"
              placeholder="Tag name"
            />
          </TagChip>

          <button
            type="button"
            onClick={() => {
              setNewTag({ name: "", color: "#FFB86C" });
              setIsAddingTag(false);
            }}
            className="focus-visible:ring-accent/25 group border-accent/35 bg-accent/8 text-accent hover:border-accent/45 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-full border px-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <X
              size={14}
              strokeWidth={1.5}
              className="stroke-accent group-hover:stroke-accent-hover transition-colors"
            />
          </button>
          <button
            type="button"
            onClick={handleAddTag}
            className="focus-visible:ring-accent/25 group border-accent/35 bg-accent/8 text-accent hover:border-accent/45 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-full border px-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Check
              size={14}
              strokeWidth={1.5}
              className="stroke-accent group-hover:stroke-accent-hover transition-colors"
            />
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeContentTags;
