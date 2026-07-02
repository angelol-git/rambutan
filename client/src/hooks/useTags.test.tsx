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

  it("does not overwrite stored user tags while the user is still hydrating", async () => {
    const user: User = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    };

    localStorage.setItem(
      `${SELECTED_TAGS_STORAGE_KEY_PREFIX}-${user.id}`,
      JSON.stringify([dinnerTag]),
    );

    const { result, rerender } = renderHook(
      ({ currentUser }: { currentUser: User | null }) =>
        useTags(currentUser, [createRecipe("1", [dinnerTag])]),
      {
        initialProps: {
          currentUser: null,
        },
        wrapper: createQueryClientWrapper().wrapper,
      },
    );

    rerender({ currentUser: user });

    await waitFor(() => {
      expect(result.current.selectedTags).toEqual([dinnerTag]);
    });

    expect(
      localStorage.getItem(`${SELECTED_TAGS_STORAGE_KEY_PREFIX}-${user.id}`),
    ).toBe(JSON.stringify([dinnerTag]));
  });
});
