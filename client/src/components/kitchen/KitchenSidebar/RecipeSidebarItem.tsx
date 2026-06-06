import { memo, useState } from "react";
import { Link } from "react-router";
import RecipeOptions from "../../RecipeOptions";
import type { Recipe } from "../../../types/recipe";

type OpenDeleteModal = (
  recipe: Recipe,
  type: "version" | "all",
  recipeVersion?: number | null,
) => void;

type RecipeSidebarItemProps = {
  recipe: Recipe;
  isActive: boolean;
  isMobile: boolean;
  setIsSideBarOpen: (nextIsOpen: boolean) => void;
  openDeleteModal: OpenDeleteModal;
};

const RecipeSidebarItem = memo(
  ({
    recipe,
    isActive,
    isMobile,
    setIsSideBarOpen,
    openDeleteModal,
  }: RecipeSidebarItemProps) => {
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    return (
      <Link
        to={`/kitchen/${recipe.id}`}
        state={{ recipe }}
        onClick={() => {
          if (isMobile) {
            setIsSideBarOpen(false);
          }
        }}
        className={`hover:bg-mantle-hover flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 duration-150 ${isActive ? "bg-overlay0" : ""} ${isOptionsOpen ? "bg-mantle-hover" : ""}`}
      >
        <p className="truncate">{recipe.title}</p>

        <RecipeOptions
          recipe={recipe}
          isOptionsOpen={isOptionsOpen}
          setIsOptionsOpen={setIsOptionsOpen}
          openDeleteModal={openDeleteModal}
        />
      </Link>
    );
  },
);

RecipeSidebarItem.displayName = "RecipeSidebarItem";

export default RecipeSidebarItem;
