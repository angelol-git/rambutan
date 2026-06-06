import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import type {
  DraftArrayEditorProps,
  DraftTextItem,
} from "../../../types/draftRecipe";

type SortableInstructionProps = {
  id: DraftTextItem["id"];
  index: number;
  instruction: DraftTextItem;
  handleDraftArrayUpdate: DraftArrayEditorProps["handleDraftArrayUpdate"];
  handleDraftArrayDelete: DraftArrayEditorProps["handleDraftArrayDelete"];
};

function SortableInstruction({
  id,
  index,
  instruction,
  handleDraftArrayUpdate,
  handleDraftArrayDelete,
}: SortableInstructionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const dragTransform = transform
    ? { ...transform, scaleX: 1, scaleY: 1 }
    : null;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(dragTransform),
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
      <div className="flex w-full gap-2">
        <div className="flex">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`hover:bg-crust/50 cursor-grab touch-none rounded p-1 transition-colors active:cursor-grabbing ${
              isDragging ? "cursor-grabbing" : ""
            }`}
            aria-label={`Drag to reorder instruction ${index + 1}`}
            style={{ touchAction: "none" }}
          >
            <GripVertical
              size={16}
              className={`flex flex-col ${
                isDragging ? "stroke-accent" : "stroke-secondary/50"
              }`}
            />
          </button>
          <span className="font-lora font-semibold">{index + 1}. </span>
        </div>
        <textarea
          className="text-primary w-full resize-none overflow-hidden bg-transparent leading-relaxed outline-none"
          value={instruction.text}
          rows={1}
          aria-label={`Instruction step ${index + 1}`}
          onChange={(event) => {
            const el = event.target;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            handleDraftArrayUpdate("instructions", event.target.value, index);
          }}
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          handleDraftArrayDelete("instructions", index);
        }}
        className="hover:bg-rose/10 cursor-pointer rounded p-1 transition-colors"
      >
        <X size={14} color={"#8C7A68"} strokeWidth={1.5} />
      </button>
    </li>
  );
}

export default SortableInstruction;
