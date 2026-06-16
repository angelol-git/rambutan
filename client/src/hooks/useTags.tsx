import { useMemo, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTagsAll, editTagsAll } from "../api/tags.js";
import { deleteLocalTagsAll, editLocalTagsAll } from "../utils/storage";
import type { Tag, EditableTagUpdate } from "../types/tag";
import type { User } from "../types/user";
import type { Recipe } from "../types/recipe";

const SELECTED_TAGS_STORAGE_KEY_PREFIX = "rambutan-selected-tags";

export function useTags(user: User | null, recipes: Recipe[] = []) {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!user?.id) {
      // For guest users, try to load from localStorage
      try {
        const stored = localStorage.getItem(
          `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-guest`,
        );
        if (stored) {
          setSelectedTags(JSON.parse(stored));
        } else {
          setSelectedTags([]);
        }
      } catch {
        // Silently ignore localStorage parse errors
        setSelectedTags([]);
      }
      return;
    }

    try {
      const stored = localStorage.getItem(
        `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-${user.id}`,
      );
      if (stored) {
        setSelectedTags(JSON.parse(stored));
      }
    } catch {
      // Silently ignore localStorage parse errors
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(
        `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-${user.id}`,
        JSON.stringify(selectedTags),
      );
    } else {
      // Save guest user selected tags
      localStorage.setItem(
        `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-guest`,
        JSON.stringify(selectedTags),
      );
    }
  }, [selectedTags, user?.id]);

  const uniqueTags = useMemo(() => {
    if (!recipes.length) return [];

    const map = new Map();
    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag: Tag) => {
        if (!map.has(tag.id)) {
          map.set(tag.id, tag);
        }
      });
    });

    return Array.from(map.values());
  }, [recipes]);

  //Deselects all associated tags if all items are deleted
  useEffect(() => {
    setSelectedTags((prev) => {
      const stillValid = prev.filter((selectedTag) =>
        uniqueTags.some((uniqueTag) => uniqueTag.id === selectedTag.id),
      );
      return stillValid.length === prev.length ? prev : stillValid;
    });
  }, [uniqueTags]);

  const tagCounts = useMemo<Partial<Record<Tag["id"], number>>>(() => {
    if (!recipes.length) return {};

    return recipes.reduce<Partial<Record<Tag["id"], number>>>((acc, recipe) => {
      recipe.tags.forEach((tag) => {
        acc[tag.id] = (acc[tag.id] ?? 0) + 1;
      });
      return acc;
    }, {});
  }, [recipes]);

  const deleteTagsAllMutation = useMutation({
    mutationFn: async (tagIds: Array<Tag["id"]>) => {
      if (user) {
        return deleteTagsAll(tagIds);
      } else {
        return deleteLocalTagsAll(tagIds);
      }
    },

    onMutate: async (tagIds: Array<Tag["id"]>) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });

      const previousRecipes = queryClient.getQueryData<Recipe[]>(["recipes"]);
      queryClient.setQueryData<Recipe[]>(["recipes"], (old) => {
        if (!old) return old;
        return old.map((recipe: Recipe) => {
          return {
            ...recipe,
            tags: recipe.tags.filter((t: Tag) => !tagIds.includes(t.id)),
          };
        });
      });

      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const editTagsAllMutation = useMutation({
    mutationFn: async (updatedTags: EditableTagUpdate[]) => {
      if (user) {
        return editTagsAll(updatedTags);
      } else {
        return editLocalTagsAll(updatedTags);
      }
    },

    onMutate: async (updatedTags: EditableTagUpdate[]) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });

      const previousRecipes = queryClient.getQueryData<Recipe[]>(["recipes"]);

      queryClient.setQueryData<Recipe[]>(["recipes"], (old) => {
        if (!old) return old;

        return old.map((recipe) => {
          return {
            ...recipe,
            tags: recipe.tags.map((tag) => {
              const updatedTag = updatedTags.find((t) => t.id === tag.id);

              if (!updatedTag) {
                return tag;
              }

              return {
                ...tag,
                name: updatedTag.name ?? tag.name,
                color: updatedTag.color ?? tag.color,
              };
            }),
          };
        });
      });

      return { previousRecipes };
    },

    onError: (err, variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  function handleTagSelectedClick(tag: Tag) {
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.id === tag.id);
      if (exists) {
        return prev.filter((t) => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  }

  return {
    uniqueTags,
    selectedTags,
    handleTagSelectedClick,
    tagCounts,
    deleteTagsAll: deleteTagsAllMutation.mutate,
    isDeletingTags: deleteTagsAllMutation.isPending,
    editTagsAll: editTagsAllMutation.mutate,
    isEditingTags: editTagsAllMutation.isPending,
  };
}
