import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import type {
  DraftArrayEditorProps,
  DraftTextItem,
} from "../../../types/draftRecipe";

type SortableIngredientsProps = {
  id: DraftTextItem["id"];
  index: number;
  ingredient: DraftTextItem;
  handleDraftArrayUpdate: DraftArrayEditorProps["handleDraftArrayUpdate"];
  handleDraftArrayDelete: DraftArrayEditorProps["handleDraftArrayDelete"];
};

function SortableIngredients({
  id,
  index,
  ingredient,
  handleDraftArrayUpdate,
  handleDraftArrayDelete,
}: SortableIngredientsProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: "relative",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-mantle/70 border-crust flex items-center gap-2 rounded-xl border p-2 transition-all hover:shadow-sm ${
        isDragging ? "ring-accent/50 shadow-lg ring-2" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`hover:bg-crust/50 cursor-grab touch-none rounded p-1 transition-colors active:cursor-grabbing ${
          isDragging ? "cursor-grabbing" : ""
        }`}
        aria-label={`Drag to reorder ingredient ${index + 1}`}
        style={{ touchAction: "none" }}
      >
        <GripVertical
          size={16}
          className={`flex flex-col ${
            isDragging ? "stroke-accent" : "stroke-secondary/50"
          }`}
        />
      </button>
      <textarea
        className="text-primary w-full resize-none overflow-hidden bg-transparent leading-relaxed outline-none"
        value={ingredient.text}
        rows={1}
        aria-label={`Ingredient ${index + 1}`}
        onChange={(event) => {
          const el = event.target;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
          handleDraftArrayUpdate("ingredients", event.target.value, index);
        }}
        ref={(el) => {
          if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
      />

      <button
        type="button"
        onClick={() => {
          handleDraftArrayDelete("ingredients", index);
        }}
        className="hover:bg-rose/10 rounded p-1 transition-colors"
      >
        <X size={14} color={"#8C7A68"} strokeWidth={1.5} />
      </button>
    </li>
  );
}

export default SortableIngredients;
