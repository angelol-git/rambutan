import { useEffect, useRef, useState } from "react";
import { CircleX, Share, Ellipsis, Trash2, SquarePen } from "lucide-react";
import type { Recipe } from "../../../types/recipe";
import { Dispatch, SetStateAction } from "react";

type OpenDeleteModal = (
  recipe: Recipe,
  type: "version" | "all",
  recipeVersion?: number | null,
) => void;

type KitchenOptionsProps = {
  recipe: Recipe;
  recipeVersion: number;
  setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
  openDeleteModal: OpenDeleteModal;
};

function KitchenOptions({
  recipe,
  recipeVersion,
  setIsEditModalOpen,
  openDeleteModal,
}: KitchenOptionsProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOptionsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target instanceof Node)) return;

      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOptionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOptionsOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOptionsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOptionsOpen}
        aria-label="Kitchen options"
        className={`hover:bg-mantle-hover color-black cursor-pointer rounded-md px-2 py-1 font-bold duration-150 ${
          isOptionsOpen ? "bg-crust" : ""
        }`}
      >
        <Ellipsis size={20} strokeWidth={1.5} className="stroke-icon" />
      </button>

      {isOptionsOpen && (
        <div
          className="bg-base border-secondary/20 absolute right-0 z-50 w-42 rounded-lg border p-2 shadow-xl"
          role="menu"
        >
          <ul className="text-primary flex flex-col">
            {/* <li>
              <button
                onClick={() => setIsOptionsOpen(false)}
                className="w-full flex gap-2 items-center py-2 cursor-pointer hover:bg-mantle-hover duration-150 px-1 rounded-lg"
              >
                <Share size={18} strokeWidth={1.5} className="stroke-icon" />
                <div className="text-sm">Share</div>
              </button>
            </li> */}
            <li>
              <button
                onClick={() => {
                  setIsOptionsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="hover:bg-base-hover flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 duration-150"
              >
                <SquarePen
                  size={18}
                  strokeWidth={1.5}
                  className="stroke-icon"
                />
                <div className="text-sm">Edit</div>
              </button>
            </li>

            <div className="bg-secondary/40 my-1 h-[1px]" />

            <li>
              <button
                onClick={() => {
                  setIsOptionsOpen(false);
                  openDeleteModal(recipe, "version", recipeVersion);
                }}
                className="hover:bg-base-hover flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 duration-150"
              >
                <Trash2 size={18} strokeWidth={1.5} className="stroke-icon" />
                <div className="text-sm">Delete</div>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setIsOptionsOpen(false);
                  openDeleteModal(recipe, "all", recipeVersion);
                }}
                className="text-rose hover:bg-rose/10 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 duration-150"
              >
                <CircleX size={18} strokeWidth={1.5} className="stroke-rose" />
                <div className="text-sm font-medium">
                  Delete All ({recipe.versions.length})
                </div>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default KitchenOptions;
