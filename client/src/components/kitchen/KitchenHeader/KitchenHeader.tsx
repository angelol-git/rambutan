import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router";
import KitchenOptions from "./KitchenOptions";
import { ArrowLeft } from "lucide-react";
import type { Recipe } from "../../../types/recipe";

type KitchenHeaderProps = {
  recipe: Recipe | null;
  recipeVersion: number;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
};

const KitchenHeader = ({ recipe, setIsEditing }: KitchenHeaderProps) => {
  return (
    <div className="flex justify-center px-4 pt-4 md:pt-8">
      <div className="flex w-full max-w-screen-md flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="hover:bg-mantle-hover w-min cursor-pointer rounded-lg p-1 duration-150"
          >
            <ArrowLeft strokeWidth={1.5} className="stroke-icon" size={18} />
          </Link>
          {recipe && (
            <div className="block md:hidden">
              <KitchenOptions setIsEditing={setIsEditing} />
            </div>
          )}
        </div>
        <div className="flex w-full items-center justify-between">
          <h1 className="font-lora line-clamp-2 max-w-screen-md text-3xl leading-snug font-semibold md:text-4xl">
            {recipe?.title}
          </h1>
          {recipe && (
            <div className="hidden md:block">
              <KitchenOptions setIsEditing={setIsEditing} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

KitchenHeader.displayName = "KitchenHeader";

export default KitchenHeader;
