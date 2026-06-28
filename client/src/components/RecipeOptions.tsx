import { useRef, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { CircleX, Ellipsis } from "lucide-react";
import useClickOutside from "../hooks/useClickOutside";
import type { OpenDeleteModal } from "../hooks/useDeleteRecipe";
import type { Recipe } from "../types/recipe";

type RecipeOptionsProps = {
  recipe: Recipe;
  isOptionsOpen: boolean;
  setIsOptionsOpen: Dispatch<SetStateAction<boolean>>;
  openDeleteModal: OpenDeleteModal;
};

function RecipeOptions({
  recipe,
  isOptionsOpen,
  setIsOptionsOpen,
  openDeleteModal,
}: RecipeOptionsProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(
    [buttonRef, portalRef],
    () => {
      setIsOptionsOpen(false);
    },
  );

  return (
    <div className="relative">
      <button
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOptionsOpen(true);
        }}
        aria-haspopup="true"
        aria-expanded={isOptionsOpen}
        aria-label="Recipe options"
        className="color-black hover:bg-mantle-hover cursor-pointer rounded-md bg-red-500 px-2 py-1 font-bold duration-150"
        ref={buttonRef}
      >
        <Ellipsis size={24} strokeWidth={1.5} className="stroke-icon" />
      </button>

      {isOptionsOpen &&
        createPortal(
          <div
            ref={portalRef}
            style={{
              position: "fixed",
              top: buttonRef.current?.getBoundingClientRect().bottom + "px",
              left: `${buttonRef.current?.getBoundingClientRect().left ?? 0 - 100}px`,
            }}
            className="bg-base border-secondary/20 z-1000 w-42 rounded-lg border p-2 shadow-lg"
            role="menu"
          >
            <ul className="text-primary flex flex-col">
              {/* <li className="w-full">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsOptionsOpen(false);
                  }}
                  className="w-full px-3 py-3 flex justify-between items-center cursor-pointer rounded-lg duration-150 hover:bg-mantle-hover transition-colors"
                >
                  <div className="text-sm font-medium">Share</div>
                  <Share
                    size={20}
                    strokeWidth={1.5}
                    className="stroke-icon opacity-80"
                  />
                </button>
              </li> */}

              {/* <div className="h-[1px] bg-secondary/30 mx-2 my-1" /> */}

              <li className="w-full">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openDeleteModal(recipe, "all");
                    setIsOptionsOpen(false);
                  }}
                  className="hover:bg-rose/10 text-rose flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors duration-150"
                >
                  <CircleX
                    size={18}
                    strokeWidth={1.5}
                    className="stroke-rose"
                  />
                  <div className="text-sm font-medium">
                    Delete All ({recipe.versions.length})
                  </div>
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default RecipeOptions;
