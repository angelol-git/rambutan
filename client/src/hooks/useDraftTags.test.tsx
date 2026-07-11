import { renderHook, act, waitFor } from "@testing-library/react";
import useDraftTags from "./useDraftTags";
import type { Tag } from "../types/tag";

const tags: Tag[] = [
  { id: 1, name: "Dinner", color: "#ff0000" },
  { id: 2, name: "Quick", color: "#00ff00" },
];
const setTagsToBeDeleted = vi.fn();

describe("useDeleteRecipe", () => {
  it("initializes draftTags from tags when edit mode is enabled", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useDraftTags({ tags, isEditingTags: true, setTagsToBeDeleted }),
    );

    // Assert
    await waitFor(() => {
      expect(result.current.draftTags).toEqual(tags);
    });
  });

  it("updates a tag name by id", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useDraftTags({ tags, isEditingTags: true, setTagsToBeDeleted }),
    );

    // Act
    act(() => {
      result.current.handleEditDraftTagName("Lunch", 1);
    });

    // Assert
    await waitFor(() => {
      expect(result.current.draftTags).toEqual([
        { id: 1, name: "Lunch", color: "#ff0000" },
        { id: 2, name: "Quick", color: "#00ff00" },
      ]);
    });
  });

  it("removes a tag from draftTags and appends it to tagsToBeDeleted", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useDraftTags({ tags, isEditingTags: true, setTagsToBeDeleted }),
    );

    // Act
    act(() => {
      result.current.handleDraftTagDelete(tags[0]);
    });

    // Assert
    expect(result.current.draftTags).toEqual([tags[1]]);

    expect(setTagsToBeDeleted).toHaveBeenCalledTimes(1);
    const updateFn = setTagsToBeDeleted.mock.calls[0][0];
    expect(updateFn([])).toEqual([tags[0]]);
  });
});
