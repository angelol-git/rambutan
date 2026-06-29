import { useEffect, useState } from "react";
import EditTagItem from "../tags/EditTagItem";
import TagChip from "../tags/TagChip";
import useDraftTags from "../../hooks/useDraftTags";
import type { Tag, EditableTagUpdate } from "../../types/tag";

type HomeTagsProps = {
  tags: Tag[];
  selectedTags: Tag[];
  handleTagSelectedClick: (tag: Tag) => void;
  tagCounts: Partial<Record<Tag["id"], number>>;
  deleteTagsAll: (tagIds: Tag["id"][]) => void;
  isDeletingTags: boolean;
  editTagsAll: (updatedTags: EditableTagUpdate[]) => void;
};

function HomeTags({
  tags,
  selectedTags,
  handleTagSelectedClick,
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
              className="bg-accent hover:bg-accent-hover cursor-pointer rounded-lg px-2 py-1 text-sm text-white transition-colors duration-150"
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
          <button
            onClick={() => {
              setIsEditingTags(true);
            }}
            disabled={isDeletingTags}
            className="text-secondary hover:text-primary hover:bg-mantle-hover font-ibm-plex-mono cursor-pointer rounded-full px-3 py-1 text-xs tracking-[0.08em] uppercase transition-colors duration-150"
          >
            Edit
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 py-2">
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
                className={`hover:bg-tag-hover focus-visible:ring-accent/30 cursor-pointer focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected ? "bg-tag-selected" : ""
                }`}
                key={tag.id}
                color={tag.color}
              >
                <div>
                  {tag.name} <span className="text-secondary">({count})</span>
                </div>
              </TagChip>
            );
          })
        ) : (
          <div className="text-secondary/70 text-sm italic">
            Tags are not supported yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeTags;
