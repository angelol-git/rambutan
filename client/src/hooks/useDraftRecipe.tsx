import { useState, useEffect } from "react";
import type { DraftTag } from "../types/tag";
import type { EditableTag } from "../types/tag";
import type { Recipe, RecipeDetails } from "../types/recipe";
import type {
  DraftArrayField,
  DraftIngredientField,
  DraftIngredient,
  DraftRecipe,
  DraftStringField,
  DraftTextItem,
} from "../types/draftRecipe";

let nextTemporaryTagId = -1;

function getTemporaryTagId() {
  return nextTemporaryTagId--;
}

type ColorString = {
  hex: string;
};

type UseDraftRecipeProps = {
  recipe: Recipe | null;
  recipeVersion: number | null;
  isEditModalOpen: boolean;
};

export function useDraftRecipe({
  recipe,
  recipeVersion,
  isEditModalOpen,
}: UseDraftRecipeProps) {
  const [draft, setDraft] = useState<DraftRecipe | null>(null);

  useEffect(() => {
    if (!recipe || !isEditModalOpen || recipeVersion === null) return;

    const currentVersion = recipe.versions[recipeVersion];
    if (!currentVersion) return;

    const ingredientsWithIds = currentVersion.ingredients.map(
      (ingredient): DraftIngredient => ({
        ...ingredient,
        id: ingredient.id,
        position: ingredient.position,
      }),
    );

    const draftRecipe = {
      recipe_id: recipe.id,
      title: recipe.title || "",
      created_at: recipe.created_at,
      tags: recipe.tags || [],
      ...currentVersion,
      description: currentVersion.description || "",
      notes: currentVersion.notes || "",
      recipeDetails: currentVersion.recipeDetails || {},
      instructions: currentVersion.instructions,
      ingredients: ingredientsWithIds,
    };

    setDraft(draftRecipe);
  }, [recipe, isEditModalOpen, recipeVersion]);

  function handleDraftString(field: DraftStringField, value: string) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [field]: value,
      };
    });
  }

  function handleDraftDetail(field: keyof RecipeDetails, value: string) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        recipeDetails: {
          ...(prev.recipeDetails || {}),
          [field]: value,
        },
      };
    });
  }

  function handleDraftTagName(newName: string, tagId: number) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tags: (prev.tags || []).map((tag) => {
          if (tag.id === tagId) {
            return {
              ...tag,
              name: newName,
            };
          } else {
            return tag;
          }
        }),
      };
    });
  }

  function handleDraftTagColor(color: ColorString, tag: EditableTag) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tags: (prev.tags || []).map((prevTag) => {
          if (prevTag.id === tag.id) {
            return {
              ...prevTag,
              color: color.hex,
            };
          } else {
            return prevTag;
          }
        }),
      };
    });
  }

  function handleDraftTagDelete(tagId: number) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tags: (prev.tags || []).filter((prevTag) => {
          return prevTag.id !== tagId;
        }),
      };
    });
  }

  function handleDraftTagAdd(tag: DraftTag) {
    const trimmedName = tag.name.trim();
    if (!trimmedName) return;

    setDraft((prev) => {
      if (!prev) return prev;

      const hasMatchingTag = (prev.tags || []).some((prevTag) => {
        return prevTag.name.trim().toLowerCase() === trimmedName.toLowerCase();
      });

      if (hasMatchingTag) {
        return prev;
      }

      return {
        ...prev,
        tags: [
          ...(prev.tags || []),
          {
            id: getTemporaryTagId(),
            name: trimmedName,
            color: tag.color || "#FFB86C",
          },
        ],
      };
    });
  }

  function handleDraftInstructionUpdate(value: string, targetIndex: number) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        instructions: (prev.instructions || []).map((item, index) => {
          return targetIndex === index ? { ...item, raw_text: value } : item;
        }),
      };
    });
  }

  function buildIngredientRawText(ingredient: DraftIngredient) {
    const primaryQuantity =
      ingredient.quantity_text?.trim() ||
      ingredient.quantity_value?.toString() ||
      "";
    const primaryUnit = ingredient.unit?.trim() || "";
    const ingredientName = ingredient.ingredient_name?.trim() || "";
    const note = ingredient.note?.trim() || "";
    const optional = ingredient.is_optional ? "optional" : "";

    return [primaryQuantity, primaryUnit, ingredientName, note, optional]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  function parseIngredientNumber(value: string) {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    const numericValue = Number(trimmedValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function handleDraftIngredientUpdate(
    field: DraftIngredientField,
    value: string | boolean,
    targetIndex: number,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ingredients: (prev.ingredients || []).map((item, index) => {
          if (targetIndex !== index) {
            return item;
          }

          const nextItem = { ...item };

          if (field === "is_optional") {
            nextItem.is_optional = Boolean(value);
          } else if (
            field === "quantity_value" ||
            field === "alternate_quantity_value"
          ) {
            nextItem[field] =
              typeof value === "string" ? parseIngredientNumber(value) : null;
          } else if (field === "quantity_text") {
            const nextValue = typeof value === "string" ? value : String(value);
            nextItem.quantity_text = nextValue;
            nextItem.quantity_value = parseIngredientNumber(nextValue);
          } else if (field === "alternate_quantity_text") {
            const nextValue = typeof value === "string" ? value : String(value);
            nextItem.alternate_quantity_text = nextValue;
            nextItem.alternate_quantity_value =
              parseIngredientNumber(nextValue);
          } else {
            nextItem[field] = typeof value === "string" ? value : String(value);
          }

          nextItem.raw_text = buildIngredientRawText(nextItem);
          return nextItem;
        }),
      };
    });
  }

  function handleDraftArrayReorder(
    field: DraftArrayField,
    reorderedArray: DraftTextItem[] | DraftIngredient[],
  ) {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [field]:
          field === "ingredients" || field === "instructions"
            ? reorderedArray.map((item, index) => ({
                ...item,
                position: index + 1,
              }))
            : reorderedArray,
      };
    });
  }

  //TO DO : Update the edit form to handle new ingredient
  function handleDraftArrayPush(field: DraftArrayField, newValue: string) {
    setDraft((prev) => {
      if (!prev) return prev;

      if (field === "instructions") {
        const newItem = {
          id: `${field.slice(0, -1)}-${prev.recipe_id}-${Date.now()}`,
          position: (prev.instructions || []).length + 1,
          raw_text: newValue,
          completed: false,
        };
        return {
          ...prev,
          [field]: [...(prev[field] || []), newItem],
        };
      }
      if (field === "ingredients") {
        const newItem: DraftIngredient = {
          id: `ingredient-${prev.recipe_id}-${Date.now()}`,
          position: (prev.ingredients || []).length + 1,
          raw_text: newValue,
          completed: false,
          ingredient_name: newValue.trim(),
          quantity_value: null,
          quantity_text: null,
          unit: null,
          alternate_quantity_value: null,
          alternate_quantity_text: null,
          alternate_unit: null,
          note: null,
          is_optional: false,
        };
        return {
          ...prev,
          ingredients: [...(prev.ingredients || []), newItem],
        };
      }
      return {
        ...prev,
        [field]: [...(prev[field] || []), newValue],
      };
    });
  }

  function handleDraftArrayDelete(field: DraftArrayField, targetIndex: number) {
    setDraft((prev) => {
      if (!prev) return prev;

      const nextItems = (prev[field] || []).filter((item, index) => {
        return index !== targetIndex;
      });

      return {
        ...prev,
        [field]:
          field === "ingredients" || field === "instructions"
            ? nextItems.map((item, index) => ({
                ...item,
                position: index + 1,
              }))
            : nextItems,
      };
    });
  }

  return {
    draft,
    handleDraftString,
    handleDraftDetail,
    handleDraftTagName,
    handleDraftTagColor,
    handleDraftTagDelete,
    handleDraftTagAdd,
    handleDraftInstructionUpdate,
    handleDraftIngredientUpdate,
    handleDraftArrayDelete,
    handleDraftArrayPush,
    handleDraftArrayReorder,
  };
}
