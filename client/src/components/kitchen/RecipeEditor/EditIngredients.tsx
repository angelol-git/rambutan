import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import SortableIngredients from "./SortableIngredients";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDraftSortableList } from "../../../hooks/useDraftSortableList";
import type { DraftArrayEditorProps } from "../../../types/draftRecipe";

function EditIngredients({
  draft,
  handleDraftArrayUpdate,
  handleDraftArrayDelete,
  handleDraftArrayPush,
  handleDraftArrayReorder,
}: DraftArrayEditorProps) {
  const ingredients = draft?.ingredients || [];
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const newIngredientRef = useRef<HTMLLIElement | null>(null);
  const newTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const { sensors, handleDragEnd } = useDraftSortableList({
    items: ingredients,
    field: "ingredients",
    handleDraftArrayReorder,
  });

  useEffect(() => {
    if (newIngredientRef.current && newTextAreaRef.current) {
      newIngredientRef.current.scrollIntoView({ behavior: "smooth" });
      newTextAreaRef.current.focus();
    }
  }, [isAddingIngredient]);

  function handleCancel() {
    setIsAddingIngredient(false);
    setNewIngredient("");
  }

  function handleSave() {
    handleDraftArrayPush("ingredients", newIngredient);
    handleCancel();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-lora text-secondary text-lg font-medium">
          Ingredients
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsAddingIngredient((prev) => !prev);
          }}
          className="focus-visible:ring-accent/25 border-accent/45 bg-accent/8 text-accent-hover hover:border-accent/55 hover:bg-accent/18 hover:text-accent-hover inline-flex min-h-8 cursor-pointer items-center justify-center rounded-full border px-3 py-1 text-sm leading-none shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          + Add
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ingredients.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-3.5">
            {ingredients.map((ingredient, index) => (
              <SortableIngredients
                key={ingredient.id}
                id={ingredient.id}
                index={index}
                ingredient={ingredient}
                handleDraftArrayDelete={handleDraftArrayDelete}
                handleDraftArrayUpdate={handleDraftArrayUpdate}
              />
            ))}
            {isAddingIngredient && (
              <li
                ref={newIngredientRef}
                className="bg-mantle/70 border-crust flex items-center gap-2 rounded-xl border px-3 py-2 transition-all hover:shadow-sm"
              >
                <div className="flex w-full gap-2">
                  <textarea
                    ref={newTextAreaRef}
                    className="text-primary w-full resize-none overflow-hidden bg-transparent leading-relaxed outline-none"
                    value={newIngredient}
                    rows={1}
                    placeholder="Enter new ingredient..."
                    aria-label="New ingredient"
                    onChange={(event) => {
                      const el = event.target;
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                      setNewIngredient(event.target.value);
                    }}
                    // onKeyDown={handleKeyDown}
                    onBlur={(event) => {
                      // Check if relatedTarget is the cancel button
                      if (event.relatedTarget?.closest("button")) {
                        handleCancel();
                        return;
                      }
                      handleSave();
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cursor-pointer"
                >
                  <X size={14} color={"#8C7A68"} strokeWidth={1.5} />
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export default EditIngredients;
