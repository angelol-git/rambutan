import { useState } from "react";
import { Check, X } from "lucide-react";
import EditTagItem from "../../tags/EditTagItem";
import TagChip from "../../tags/TagChip";
import type { Tag, DraftTag } from "../../../types/tag";

type DraftWithTags = {
  tags?: Tag[];
} | null;

type ColorChange = {
  hex: string;
};

type EditTagProps = {
  draft: DraftWithTags;
  handleDraftTagName: (newName: string, tagId: number) => void;
  handleDraftTagColor: (color: ColorChange, tag: Tag) => void;
  handleDraftTagDelete: (tagId: number) => void;
  handleDraftTagAdd: (tag: DraftTag) => void;
};

function EditTags({
  draft,
  handleDraftTagName,
  handleDraftTagColor,
  handleDraftTagDelete,
  handleDraftTagAdd,
}: EditTagProps) {
  const tags = draft?.tags ?? [];
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-lora text-secondary text-lg font-medium tracking-wide">
          Tags
        </h3>
        <button
          type="button"
          onClick={() => setIsAddingTag(true)}
          className="focus-visible:ring-accent/25 border-accent/45 bg-accent/8 text-accent-hover hover:border-accent/55 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-8 cursor-pointer items-center justify-center rounded-full border px-3 py-1 text-sm leading-none shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          + Add
        </button>
      </div>
      <div className="flex justify-between">
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            {tags.length > 0
              ? tags.map((tag: Tag) => {
                  return (
                    <EditTagItem
                      key={tag.id}
                      tag={tag}
                      handleNameChange={handleDraftTagName}
                      handleColorChange={handleDraftTagColor}
                      handleDelete={handleDraftTagDelete}
                    />
                  );
                })
              : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {isAddingTag ? (
              <>
                <TagChip color={newTag.color}>
                  <input
                    type="text"
                    className="border-secondary/50 text-primary placeholder:text-secondary/70 w-[100px] min-w-[4ch] border-0 border-b bg-transparent px-0 pb-0.5 leading-none outline-none"
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
                  onClick={resetNewTag}
                  className="focus-visible:ring-accent/25 group border-accent/45 bg-accent/8 text-accent-hover hover:border-accent/55 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border px-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <X
                    size={12}
                    strokeWidth={1.5}
                    className="stroke-accent-hover group-hover:stroke-accent-hover transition-colors"
                  />
                </button>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="focus-visible:ring-accent/25 group border-accent/45 bg-accent/8 text-accent-hover hover:border-accent/55 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border px-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Check
                    size={12}
                    strokeWidth={1.5}
                    className="stroke-accent-hover group-hover:stroke-accent-hover transition-colors"
                  />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EditTags;
