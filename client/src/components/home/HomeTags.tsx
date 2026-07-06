import { useEffect, useState } from "react";
import EditTagItem from "../tags/EditTagItem";
import TagChip from "../tags/TagChip";
import useDraftTags from "../../hooks/useDraftTags";
import type { Tag, EditableTagUpdate } from "../../types/tag";

type HomeTagsProps = {
  tags: Tag[];
  selectedTags: Tag[];
  handleTagSelectedClick: (tag: Tag) => void;
  resetSelectedTags: () => void;
  tagCounts: Partial<Record<Tag["id"], number>>;
  deleteTagsAll: (tagIds: Tag["id"][]) => void;
  isDeletingTags: boolean;
  editTagsAll: (updatedTags: EditableTagUpdate[]) => void;
};

function HomeTags({
  tags,
  selectedTags,
  handleTagSelectedClick,
  resetSelectedTags,
  tagCounts,
  deleteTagsAll,
  isDeletingTags,
  editTagsAll,
}: HomeTagsProps) {
  const [tagsToBeDeleted, setTagsToBeDeleted] = useState<Tag[]>([]);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [optimisticTags, setOptimisticTags] = useState<Tag[] | null>(null);
  const {
    draftTags,
    handleDraftTagDelete,
    handleEditDraftTagName,
    handleEditDraftTagColor,
  } = useDraftTags({ tags, isEditingTags, setTagsToBeDeleted });
  const visibleTags = optimisticTags ?? tags;

  useEffect(() => {
    if (!optimisticTags) {
      return;
    }

    const tagsMatchOptimisticState =
      tags.length === optimisticTags.length &&
      tags.every((tag, index) => {
        const optimisticTag = optimisticTags[index];
        return (
          optimisticTag &&
          optimisticTag.id === tag.id &&
          optimisticTag.name === tag.name &&
          optimisticTag.color === tag.color
        );
      });

    if (tagsMatchOptimisticState) {
      setOptimisticTags(null);
    }
  }, [optimisticTags, tags]);

  function handleTagDone() {
    const tagsToUpdate = draftTags.filter((tag) => {
      const original = tags.find((t) => t.id === tag.id);
      return (
        original && (original.name !== tag.name || original.color !== tag.color)
      );
    });

    setOptimisticTags(draftTags);

    if (tagsToBeDeleted.length) {
      deleteTagsAll(tagsToBeDeleted.map((tag) => tag.id));
    }
    if (tagsToUpdate.length) {
      editTagsAll(tagsToUpdate);
    }

    setIsEditingTags(false);
    setTagsToBeDeleted([]);
  }

  if (isEditingTags) {
    return (
      <div>
        <div className="flex items-end justify-between">
          <h2 className="font-semibold">Edit Tags</h2>
          <div className="flex gap-2">
            <button
              onClick={handleTagDone}
              disabled={isDeletingTags}
              className="interactive-mono text-secondary hover:text-primary decoration-secondary/35 hover:decoration-primary rounded-full px-3 py-1 text-xs tracking-[0.08em] uppercase no-underline underline-offset-3 hover:underline"
            >
              Done
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 py-2">
          {draftTags.map((tag) => {
            return (
              <EditTagItem
                key={tag.id}
                tag={tag}
                handleNameChange={handleEditDraftTagName}
                handleColorChange={handleEditDraftTagColor}
                handleDelete={handleDraftTagDelete}
                variant="home"
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <h2 className="font-semibold">Tags</h2>
        {tags.length > 0 && (
          <div className="flex gap-2">
            {selectedTags.length > 0 && (
              <button
                onClick={resetSelectedTags}
                disabled={isDeletingTags}
                className="interactive-mono text-secondary hover:text-primary decoration-secondary/35 hover:decoration-primary rounded-full px-3 py-1 text-xs tracking-[0.08em] uppercase no-underline underline-offset-3 hover:underline"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => {
                setIsEditingTags(true);
              }}
              disabled={isDeletingTags}
              className="interactive-mono text-secondary hover:text-primary decoration-secondary/35 hover:decoration-primary rounded-full px-3 py-1 text-xs tracking-[0.08em] uppercase no-underline underline-offset-3 hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 py-2">
        {visibleTags.length > 0 ? (
          visibleTags.map((tag) => {
            const count = tagCounts[tag.id] || 0;
            const isSelected = selectedTags.some((selectedTag) => {
              return selectedTag.name === tag.name;
            });
            return (
              <TagChip
                as="button"
                onClick={() => {
                  handleTagSelectedClick(tag);
                }}
                className={`hover:bg-tag-hover focus-visible:ring-accent/30 cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected ? "bg-tag-selected" : ""
                }`}
                key={tag.id}
                color={tag.color}
              >
                <div>
                  {tag.name}{" "}
                  <span className="font-ibm-plex-mono text-secondary text-sm">
                    ({count})
                  </span>
                </div>
              </TagChip>
            );
          })
        ) : (
          <div className="text-secondary/70 text-sm italic">
            No tags have been added yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeTags;
