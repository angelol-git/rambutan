import { useRef, useState } from "react";
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
}: KitchenOptionsProps) {
  return (
    <div className="flex gap-4 text-sm">
      <button
        onClick={() => {
          setIsEditModalOpen(true);
        }}
        className="cursor-pointer underline"
      >
        Edit
      </button>
      <div className="cursor-pointer underline">Share</div>
    </div>
  );
}

export default KitchenOptions;
