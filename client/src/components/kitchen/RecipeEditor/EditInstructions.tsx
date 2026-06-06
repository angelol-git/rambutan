import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableInstruction from "./SortableInstruction";
import { useDraftSortableList } from "../../../hooks/useDraftSortableList";
import type { DraftArrayEditorProps } from "../../../types/draftRecipe";

function EditInstructions({
  draft,
  handleDraftArrayUpdate,
  handleDraftArrayDelete,
  handleDraftArrayPush,
  handleDraftArrayReorder,
}: DraftArrayEditorProps) {
  const instructions = draft?.instructions || [];
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);
  const [newInstruction, setNewInstruction] = useState("");
  const newInstructionRef = useRef<HTMLOListElement | null>(null);
  const newTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const { sensors, handleDragEnd } = useDraftSortableList({
    items: instructions,
    field: "instructions",
    handleDraftArrayReorder,
  });

  useEffect(() => {
    if (newInstructionRef.current && newTextAreaRef.current) {
      newInstructionRef.current.scrollIntoView({ behavior: "smooth" });
      newTextAreaRef.current.focus();
    }
  }, [isAddingInstruction]);

  function handleCancel() {
    setIsAddingInstruction(false);
    setNewInstruction("");
  }

  function handleSave() {
    handleDraftArrayPush("instructions", newInstruction);
    handleCancel();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-lora text-secondary text-lg font-medium">
          Instructions
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsAddingInstruction((prev) => !prev);
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
          items={instructions.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol ref={newInstructionRef} className="list-decimal space-y-3">
            {instructions.map((instruction, index) => (
              <SortableInstruction
                key={instruction.id}
                id={instruction.id}
                index={index}
                instruction={instruction}
                handleDraftArrayUpdate={handleDraftArrayUpdate}
                handleDraftArrayDelete={handleDraftArrayDelete}
              />
            ))}
            {isAddingInstruction && (
              <li className="bg-mantle/70 border-crust flex items-center gap-2 rounded-xl border px-3 py-2 transition-all hover:shadow-sm">
                <div className="flex w-full gap-2">
                  <span className="font-lora font-semibold">
                    {instructions.length + 1}.{" "}
                  </span>
                  <textarea
                    ref={newTextAreaRef}
                    className="text-primary w-full resize-none overflow-hidden bg-transparent leading-relaxed outline-none"
                    value={newInstruction}
                    rows={1}
                    placeholder="Enter new instruction..."
                    aria-label="New instruction"
                    onChange={(event) => {
                      const el = event.target;
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                      setNewInstruction(event.target.value);
                    }}
                    onBlur={(event) => {
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
          </ol>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export default EditInstructions;
