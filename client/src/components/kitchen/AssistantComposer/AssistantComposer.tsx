import {
  useRef,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router";
import { useRecipeAssistant } from "../../../hooks/useRecipeAssistant.js";
import { useToast } from "../../../hooks/useToast.js";
import type { Recipe } from "../../../types/recipe.js";
import type { RecipeVersion } from "../../../types/recipe.js";
import AssistantComposerButton from "./AssistantComposerButton.js";
import OpenAssistantComposer from "./OpenAssistantComposer.js";

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

function AssistantComposer(props: AssistantComposerProps) {
  const [prompt, setPrompt] = useState("");
  const composerMode = "Create";
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const isActiveRef = useRef<boolean>(true);
  const { showToast } = useToast();
  const minHeight = 52;
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

  //Track when assistantComposerOpen so Toast UI appears above it
  useEffect(() => {
    document.body.dataset.assistantComposerOpen = isAssistantOpen
      ? "true"
      : "false";

    return () => {
      document.body.dataset.assistantComposerOpen = "false";
    };
  }, [isAssistantOpen]);

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

    // if (composerMode === "Ask") {
    //   if (props.variant === "existing") {
    //     props.setIsQuestionsModalOpen(true);
    //   }
    // }
  }

  return isAssistantOpen ? (
    <OpenAssistantComposer
      prompt={prompt}
      setPrompt={setPrompt}
      canSend={canSend}
      isPending={isPending}
      isNewRecipe={isNewRecipe}
      hasRecipeNavigation={hasRecipeNavigation}
      recipe={recipe}
      recipeVersion={recipeVersion}
      setRecipeVersion={
        props.variant === "existing" ? props.setRecipeVersion : undefined
      }
      textAreaRef={textAreaRef}
      minHeight={minHeight}
      maxHeight={maxHeight}
      onMinimize={() => {
        if (props.variant === "existing") {
          props.setIsAssistantOpen(false);
        }
      }}
      onSubmit={handleSubmitPrompt}
    />
  ) : (
    <AssistantComposerButton
      isPending={isPending}
      onOpen={() => {
        if (props.variant === "existing") {
          props.setIsAssistantOpen(true);
        }
      }}
    />
  );
}

export default AssistantComposer;
