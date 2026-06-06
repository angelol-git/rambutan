import {
  useRef,
  useEffect,
  useState,
  memo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router";
import { useRecipeAssistant } from "../../../hooks/useRecipeAssistant.js";
import { useToast } from "../../../hooks/useToast.js";
import {
  ArrowUp,
  LoaderCircle,
  MessageCircleMore,
  Minimize2,
} from "lucide-react";
import RecipeVersionNavigation from "./RecipeVersionNavigation.js";
import type { Recipe } from "../../../types/recipe.js";
import type { RecipeVersion } from "../../../types/recipe.js";

type ExistingAssistantComposerProps = {
  variant: "existing";
  recipe: Recipe;
  recipeVersion: number;
  setRecipeVersion: Dispatch<SetStateAction<number>>;
  hasRecipeNavigation: boolean;
  isAssistantOpen: boolean;
  setIsAssistantOpen: Dispatch<SetStateAction<boolean>>;
  isQuestionsModalOpen: boolean;
  setIsQuestionsModalOpen: Dispatch<SetStateAction<boolean>>;
};

type NewAssistantComposerProps = {
  variant: "new-recipe";
};

type AssistantComposerProps =
  | ExistingAssistantComposerProps
  | NewAssistantComposerProps;

const AssistantComposer = memo((props: AssistantComposerProps) => {
  const [prompt, setPrompt] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [composerMode, setComposerMode] = useState("Create");
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const isActiveRef = useRef<boolean>(true);
  const { showToast } = useToast();
  const minHeight = 30;
  const maxHeight = 160;
  const isNewRecipe = props.variant === "new-recipe";
  const recipe = props.variant === "existing" ? props.recipe : undefined;
  const recipeVersion =
    props.variant === "existing" ? props.recipeVersion : undefined;
  const hasRecipeNavigation =
    props.variant === "existing" ? props.hasRecipeNavigation : false;
  const isAssistantOpen =
    props.variant === "existing" ? props.isAssistantOpen : true;
  const navigate = useNavigate();
  const { submitRecipePrompt, isPending, isSuccess } =
    useRecipeAssistant(showToast);
  const canSend = prompt.trim().length > 0 && !isPending;

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    setPrompt("");
  }, [recipe?.id]);

  useEffect(() => {
    if (!isExpanded) return;

    function handleClickOutside(e: MouseEvent) {
      if (!(e.target instanceof Node)) return;
      if (isExpandedRef.current && !isExpandedRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (textAreaRef.current && isAssistantOpen) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${Math.min(
        Math.max(textAreaRef.current.scrollHeight, minHeight),
        maxHeight,
      )}px`;
    }
  }, [isAssistantOpen, prompt]);

  useEffect(() => {
    if (isSuccess) {
      setPrompt("");
    }
  }, [isSuccess]);

  async function handleSubmitPrompt() {
    if (!prompt.trim()) return;

    if (composerMode === "Create") {
      try {
        let currentRecipeVersion: RecipeVersion | undefined;

        if (props.variant === "existing") {
          currentRecipeVersion = props.recipe.versions[props.recipeVersion];
        }

        const result = await submitRecipePrompt({
          prompt,
          recipeId: props.variant === "existing" ? props.recipe.id : undefined,
          recipeVersion: currentRecipeVersion,
        });

        showToast("Recipe created successfully!", "success");

        // Composer unmounted, the user is on a different page so do not redirect.
        if (!isActiveRef.current) return;

        if (isNewRecipe) {
          navigate(`/kitchen/${result.recipe.id}`);
        }
      } catch (err) {
        // console.log(err);
        showToast(
          (err as { error?: string }).error || "Something went wrong",
          "error",
          6000,
        );
      }
    }

    if (composerMode === "Ask") {
      if (props.variant === "existing") {
        props.setIsQuestionsModalOpen(true);
      }
    }
  }

  return isAssistantOpen ? (
    <div className="border-secondary/30 bg-base focus-within:border-secondary/60 relative w-full rounded-3xl border transition-colors duration-200">
      <textarea
        rows={1}
        ref={textAreaRef}
        className={`placeholder:text-icon-disabled/90 w-full resize-none bg-transparent px-4 pt-4 leading-6 outline-none ${!isNewRecipe ? "pr-14" : ""} ${isPending ? "text-icon-disabled" : "text-primary"}`}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflowY: "auto",
        }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmitPrompt();
          }
        }}
        aria-label="Enter recipe request or changes"
        placeholder="Enter any recipe or changes..."
        disabled={isPending}
      />

      {!isNewRecipe && (
        <button
          onClick={() => {
            if (props.variant === "existing") {
              props.setIsAssistantOpen(false);
            }
          }}
          className="text-icon-muted hover:bg-overlay0/50 absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-150"
          aria-label="Minimize recipe assistant"
        >
          <Minimize2 size={16} strokeWidth={1.5} className="stroke-current" />
        </button>
      )}
      <div
        className={`relative z-1 flex items-end gap-3 px-3 pt-2 pb-3 ${
          !isNewRecipe ? "justify-between" : "justify-end"
        }`}
      >
        {!isNewRecipe && (
          <div className="flex min-h-11 items-center gap-2">
            {hasRecipeNavigation && (
              <RecipeVersionNavigation
                recipe={recipe!}
                recipeVersion={recipeVersion!}
                setRecipeVersion={
                  props.variant === "existing"
                    ? props.setRecipeVersion
                    : () => {}
                }
              />
            )}
            {/* <select
                value={composerMode}
                disabled={isPending}
                onChange={(event) => {
                  setComposerMode(event.target.value);
                }}
                className={`${
                  composerMode === "Create"
                    ? "bg-base text-secondary"
                    : "bg-overlay2 text-white"
                } w-min px-2 ${isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:brightness-90"} py-1 rounded-2xl duration-150 transition-colors text-sm flex items-center gap-1`}
              >
                <option value="Create">Create</option>
              </select> */}
          </div>
        )}

        <button
          type="button"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-200 ${
            canSend
              ? "bg-accent hover:bg-accent-hover cursor-pointer"
              : "bg-overlay1 cursor-not-allowed"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            handleSubmitPrompt();
          }}
          disabled={!canSend}
          aria-label="Submit recipe prompt"
        >
          {isPending ? (
            <LoaderCircle
              size={20}
              strokeWidth={1.5}
              className="animate-spin stroke-white"
            />
          ) : (
            <ArrowUp size={20} strokeWidth={1.5} className="stroke-white" />
          )}
        </button>
      </div>
    </div>
  ) : (
    <button
      className="border-secondary/15 bg-base text-secondary hover:text-primary flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 transition-colors duration-200"
      onClick={() => {
        if (props.variant === "existing") {
          props.setIsAssistantOpen(true);
        }
      }}
      aria-label="Open recipe assistant"
    >
      <span className="bg-accent flex h-9 w-9 items-center justify-center rounded-full text-white">
        <MessageCircleMore size={20} strokeWidth={1.5} />
      </span>
      <span className="pr-1 text-sm font-medium">Open assistant</span>
    </button>
  );
});

AssistantComposer.displayName = "AssistantComposer";

export default AssistantComposer;
