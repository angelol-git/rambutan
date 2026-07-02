import { useState } from "react";
import type { useDraftRecipe } from "../../../hooks/useDraftRecipe";
import type { DraftTag } from "../../../types/tag";
import EditTagItem from "../../tags/EditTagItem";
import TagChip from "../../tags/TagChip";

type RecipeEditTagsProps = {
  tags: NonNullable<ReturnType<typeof useDraftRecipe>["draft"]>["tags"];
  handleDraftTagName: ReturnType<typeof useDraftRecipe>["handleDraftTagName"];
  handleDraftTagColor: ReturnType<typeof useDraftRecipe>["handleDraftTagColor"];
  handleDraftTagDelete: ReturnType<
    typeof useDraftRecipe
  >["handleDraftTagDelete"];
  handleDraftTagAdd: ReturnType<typeof useDraftRecipe>["handleDraftTagAdd"];
};

function RecipeEditTags({
  tags,
  handleDraftTagName,
  handleDraftTagColor,
  handleDraftTagDelete,
  handleDraftTagAdd,
}: RecipeEditTagsProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState<DraftTag>({
    name: "",
    color: "#FFB86C",
  });

  function resetNewTag() {
    setNewTag({
      name: "",
      color: "#FFB86C",
    });
    setIsAddingTag(false);
  }

  function handleAddTag() {
    handleDraftTagAdd(newTag);
    resetNewTag();
  }

  return (
    <section aria-labelledby="edit-tags-heading" className="mb-4 w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3
          id="edit-tags-heading"
          className="font-lora text-secondary text-lg font-medium"
        >
          Tags
        </h3>
        <button
          type="button"
          onClick={() => setIsAddingTag(true)}
          className="interactive-mono text-secondary/80 text-sm uppercase"
        >
          Add tag
        </button>
      </div>
      <div className="text-secondary/85 flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        {tags.map((tag) => {
          return (
            <EditTagItem
              key={tag.id}
              tag={tag}
              handleNameChange={handleDraftTagName}
              handleColorChange={handleDraftTagColor}
              handleDelete={(deletedTag) => {
                handleDraftTagDelete(deletedTag.id);
              }}
              variant="kitchen"
            />
          );
        })}
        {isAddingTag ? (
          <div className="flex items-center gap-3">
            <TagChip
              color={newTag.color}
              background="base"
              className="min-h-0 gap-2 rounded-none border-none bg-transparent px-0 py-0"
            >
              <input
                type="text"
                className="font-lora text-primary placeholder:text-primary/35 border-primary/10 focus:border-primary/20 w-[100px] min-w-[5ch] border-0 border-b bg-transparent px-0 pb-0.5 text-sm italic outline-none"
                value={newTag.name}
                aria-label="New tag name"
                placeholder="Tag name"
                onChange={(event) => {
                  setNewTag((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }));
                }}
              />
            </TagChip>
            <button
              type="button"
              onClick={handleAddTag}
              className="interactive-mono text-secondary/80 hover:text-primary text-xs uppercase transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={resetNewTag}
              className="interactive-mono text-secondary/60 hover:text-primary text-xs uppercase transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : null}
        {!tags.length && !isAddingTag ? (
          <p className="text-secondary/70 text-sm italic">
            No tags have been added yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default RecipeEditTags;
