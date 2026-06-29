import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router";
import KitchenOptions from "./KitchenOptions";
import { MoveLeft } from "lucide-react";
import type { Recipe } from "../../../types/recipe";

type KitchenHeaderProps = {
  recipe: Recipe | null;
  recipeVersion: number;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  editFormId?: string;
  isSticky?: boolean;
};

const KitchenHeader = ({
  recipe,
  recipeVersion,
  isEditing,
  setIsEditing,
  editFormId,
  isSticky = false,
}: KitchenHeaderProps) => {
  return (
    <div
      className={`px-5 pt-5 pb-4 sm:px-6 ${
        isSticky ? "bg-mantle sticky top-0 z-30 rounded-t-2xl" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex w-full items-center justify-between">
          <div className="flex min-w-[2rem] items-center">
            {!isEditing ? (
              <Link
                to="/"
                className="text-secondary hover:text-icon-accent hover:bg-base focus-visible:ring-accent/25 inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Back to home"
              >
                <MoveLeft
                  strokeWidth={1.5}
                  className="stroke-current"
                  size={20}
                />
              </Link>
            ) : (
              <div className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
          {recipe && (
            <KitchenOptions
              recipe={recipe}
              recipeVersion={recipeVersion}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editFormId={editFormId}
            />
          )}
        </div>
        <div className="border-primary/10 mt-4 border-b" />
      </div>
    </div>
  );
};

KitchenHeader.displayName = "KitchenHeader";

export default KitchenHeader;
