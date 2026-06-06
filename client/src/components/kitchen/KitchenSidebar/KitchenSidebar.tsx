import { memo, useEffect, useState } from "react";
import { Link } from "react-router";
import type { UseMutationResult } from "@tanstack/react-query";
import { X, PanelLeftClose, CirclePlus } from "lucide-react";
import logo from "../../../assets/logo.png";
import UserOptions from "../../UserOptions";
import RecipeSidebarItem from "./RecipeSidebarItem";
import type { Recipe } from "../../../types/recipe";
import type { User } from "../../../types/user";

type OpenDeleteModal = (
  recipe: Recipe,
  type: "version" | "all",
  recipeVersion?: number | null,
) => void;

type KitchenSidebarProps = {
  recipes: Recipe[];
  user: User | null;
  logout: UseMutationResult<unknown, Error, void, unknown>;
  isMobile: boolean;
  isSideBarOpen: boolean;
  isSidebarHydrated: boolean;
  hasSidebarInteracted: boolean;
  setIsSideBarOpen: (nextIsOpen: boolean) => void;
  currentRecipe: Recipe | null;
  openDeleteModal: OpenDeleteModal;
};

const KitchenSidebar = memo(
  ({
    recipes,
    user,
    logout,
    isMobile,
    isSideBarOpen,
    isSidebarHydrated,
    hasSidebarInteracted,
    setIsSideBarOpen,
    currentRecipe,
    openDeleteModal,
  }: KitchenSidebarProps) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
      setHasMounted(true);
    }, []);

    return (
      <nav
        className={`bg-mantle inset-y-0 left-0 z-100 flex h-full flex-col gap-4 text-sm ${isMobile ? "fixed" : "relative shrink-0 border-r-1 border-r-gray-300"} ${
          isMobile
            ? isSideBarOpen
              ? "w-70 translate-x-0 p-2"
              : "w-0 -translate-x-full overflow-hidden p-0"
            : isSideBarOpen
              ? "w-70 p-2"
              : "w-0 overflow-hidden p-0"
        } ${
          hasMounted && isSidebarHydrated && hasSidebarInteracted
            ? isMobile
              ? "transition-all duration-200 ease-out"
              : "transition-[width,padding] duration-200 ease-out"
            : "transition-none"
        } `}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="hover:bg-mantle-hover cursor-pointer rounded-lg p-1 duration-150"
          >
            <img src={logo} className="w-8" />
          </Link>
          <button
            onClick={() => {
              setIsSideBarOpen(false);
            }}
            className="hover:bg-mantle-hover cursor-pointer rounded-lg p-2 duration-150"
          >
            {isMobile ? (
              <X
                size={20}
                strokeWidth={1.5}
                className="stroke-icon hover:bg-mantle-hover duration-150"
              />
            ) : (
              <PanelLeftClose
                size={20}
                strokeWidth={1.5}
                className="stroke-icon hover:bg-mantle-hover duration-150"
              />
            )}
          </button>
        </div>
        <button
          onClick={() => {
            if (isMobile) {
              setIsSideBarOpen(false);
            }
          }}
          className="w-full"
        >
          <Link
            to="/kitchen"
            className="hover:bg-mantle-hover flex items-center gap-2 rounded-lg p-2 duration-150"
          >
            <CirclePlus size={18} strokeWidth={1.5} className="stroke-icon" />
            New Recipe
          </Link>
        </button>
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <h2 className="text-secondary">Recipes</h2>
          <div className="flex w-full flex-col overflow-y-auto">
            {recipes.map((recipe) => {
              return (
                <RecipeSidebarItem
                  key={recipe.id}
                  recipe={recipe}
                  isActive={currentRecipe?.id === recipe.id}
                  isMobile={isMobile}
                  setIsSideBarOpen={setIsSideBarOpen}
                  openDeleteModal={openDeleteModal}
                />
              );
            })}
          </div>
        </div>
        <div className="border-secondary/20 mt-auto border-t pt-2">
          <div className="hover:bg-mantle-hover/40 flex items-center justify-between rounded-lg px-1 py-1">
            <UserOptions
              user={user}
              logout={logout}
              openUpwards
              hideUserSummary
              redirectOnLogin="/"
              redirectOnLogout="/"
            />
            <div className="min-w-0 flex-1 px-2">
              <p className="text-primary truncate text-sm">
                {user?.name || user?.email || "Guest"}
              </p>
            </div>
          </div>
        </div>
      </nav>
    );
  },
);

KitchenSidebar.displayName = "KitchenSidebar";

export default KitchenSidebar;
