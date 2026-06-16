import { renderHook, waitFor, act, cleanup } from "@testing-library/react";
import { useTags } from "./useTags";
import type { Recipe } from "../types/recipe";
import type { Tag } from "../types/tag";
import type { User } from "../types/user";
import { createQueryClientWrapper } from "../test/queryClient";

const SELECTED_TAGS_STORAGE_KEY_PREFIX = "rambutan-selected-tags";
const dinnerTag: Tag = { id: 1, name: "Dinner", color: "#ff0000" };
const quickTag: Tag = { id: 2, name: "Quick", color: "#00ff00" };

function createRecipe(id: string, tags: Tag[]): Recipe {
  return {
    id,
    title: `Recipe ${id}`,
    tags,
    versions: [],
    created_at: null,
  };
}

describe("useTags", () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("counts tags across recipes", () => {
    const recipes = [
      createRecipe("1", [dinnerTag, quickTag]),
      createRecipe("2", [dinnerTag]),
    ];

    const { result } = renderHook(() => useTags(null, recipes), {
      wrapper: createQueryClientWrapper().wrapper,
    });

    expect(result.current.tagCounts).toEqual({
      1: 2,
      2: 1,
    });
  });

  it("toggles a selected tag on and off", () => {
    const { result } = renderHook(
      () => useTags(null, [createRecipe("1", [dinnerTag])]),
      {
        wrapper: createQueryClientWrapper().wrapper,
      },
    );

    act(() => {
      result.current.handleTagSelectedClick(dinnerTag);
    });

    expect(result.current.selectedTags).toEqual([dinnerTag]);

    act(() => {
      result.current.handleTagSelectedClick(dinnerTag);
    });

    expect(result.current.selectedTags).toEqual([]);
  });

  it("loads selected tags from localStorage for the current user", async () => {
    const user: User = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    localStorage.setItem(
      `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-${user.id}`,
      JSON.stringify([dinnerTag]),
    );

    const { result } = renderHook(
      () => useTags(user, [createRecipe("1", [dinnerTag])]),
      {
        wrapper: createQueryClientWrapper().wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.selectedTags).toEqual([dinnerTag]);
    });
  });

  it("removes stored selected tags that no longer exist in recipes", async () => {
    localStorage.setItem(
      `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-guest`,
      JSON.stringify([dinnerTag]),
    );

    const { result } = renderHook(
      () => useTags(null, [createRecipe("1", [quickTag])]),
      {
        wrapper: createQueryClientWrapper().wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.selectedTags).toEqual([]);
    });
  });
});
