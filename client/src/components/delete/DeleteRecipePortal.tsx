import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Recipe } from "../../types/recipe";

type DeletePortalProps = {
  recipe: Recipe;
  type: "version" | "all";
  versionCount: number;
  recipeVersion?: number | null;
  onClose: () => void;
  onDelete: () => void;
};
function DeletePortal({
  recipe,
  type,
  versionCount,
  recipeVersion = null,
  onClose,
  onDelete,
}: DeletePortalProps) {
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    //TODO: I am re creating this function multiple times.
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target instanceof Node)) return;

      if (portalRef.current && !portalRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/20 p-4">
      <div
        ref={portalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-recipe-title"
        className="bg-base text-primary flex w-full max-w-[24rem] flex-col gap-6 rounded-[1rem] p-6"
      >
        <div className="flex flex-col gap-3">
          <h2
            id="delete-recipe-title"
            className="font-lora text-xl font-medium"
          >
            Remove this recipe?
          </h2>
          {type === "version" ? (
            <p className="text-secondary flex flex-col gap-0.5">
              <div>
                This removes version{" "}
                <span className="text-primary font-lora font-medium">
                  {recipeVersion !== null ? recipeVersion + 1 : ""}
                </span>{" "}
                of{" "}
              </div>
              <div>
                <span className="text-primary font-lora font-medium">
                  {recipe?.title}
                </span>
                .
              </div>
            </p>
          ) : (
            <p className="text-secondary flex flex-col gap-0.5">
              <div>This permanently removes </div>
              <div className="text-primary font-lora font-medium">
                {recipe?.title}
              </div>
              <div>
                and all of its{" "}
                <span className="text-primary font-lora items-center font-medium">
                  {versionCount}{" "}
                </span>
                {versionCount === 1 ? "version" : "versions"}.
              </div>
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-5">
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary font-ibm-plex-mono cursor-pointer text-sm tracking-[0.08em] uppercase transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="text-rose hover:text-rose/75 font-ibm-plex-mono cursor-pointer text-sm tracking-[0.08em] uppercase transition-colors duration-150"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,

    document.body,
  );
}

export default DeletePortal;
