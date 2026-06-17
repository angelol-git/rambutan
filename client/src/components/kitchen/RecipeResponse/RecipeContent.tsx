import { useEffect, useState, memo, type RefObject } from "react";
import RecipeContentPromptModal from "./RecipeContentPromptModal";
import RecipeContentDetailsBar from "./RecipeContentDetailsBar";
import RecipeContentFooter from "./RecipeContentFooter";
import RecipeContentIngredients from "./RecipeContentIngredients";
import RecipeContentInstructions from "./RecipeContentInstructions";
import type {
  Recipe,
  RecipeDetails,
  RecipeIngredient,
  RecipeInstruction,
} from "../../../types/recipe";

const EMPTY_RECIPE_DETAILS: RecipeDetails = {
  calories: null,
  servings: null,
  total_time: null,
};

type RecipeContentProps = {
  recipe: Recipe;
  recipeVersion: number;
  modalAnchorRef: RefObject<HTMLDivElement | null>;
};

const RecipeContent = memo(
  ({ recipe, recipeVersion, modalAnchorRef }: RecipeContentProps) => {
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const current = recipe?.versions?.[recipeVersion];
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [instructions, setInstructions] = useState<RecipeInstruction[]>([]);

    const {
      recipeDetails = EMPTY_RECIPE_DETAILS,
      description = "",
      source_prompt = "",
    } = current ?? {};

    useEffect(() => {
      setIngredients(current?.ingredients ?? []);
      setInstructions(current?.instructions ?? []);
    }, [current?.id, current?.ingredients, current?.instructions]);

    if (!current) return null;

    function toggleIngredientCompletion(ingredientId: string) {
      const nextIngredients = ingredients.map((item) =>
        item.id === ingredientId
          ? { ...item, completed: !item.completed }
          : item,
      );

      setIngredients(nextIngredients);
    }

    function toggleInstructionCompletion(instructionId: string) {
      const nextInstructions = instructions.map((item) =>
        item.id === instructionId
          ? { ...item, completed: !item.completed }
          : item,
      );

      setInstructions(nextInstructions);
    }

    function resetIngredientCompletion() {
      const nextIngredients = ingredients.map((item) => ({
        ...item,
        completed: false,
      }));

      setIngredients(nextIngredients);
    }

    function resetInstructionCompletion() {
      const nextInstructions = instructions.map((item) => ({
        ...item,
        completed: false,
      }));

      setInstructions(nextInstructions);
    }

    return (
      <div role="log" aria-live="polite" className="flex flex-col gap-2">
        <h1 className="font-lora line-clamp-2 max-w-screen-md text-3xl leading-snug font-semibold wrap-break-word md:text-4xl">
          {recipe?.title}
        </h1>
        <RecipeContentDetailsBar recipeDetails={recipeDetails} />
        <p className="mb-4 wrap-break-word">{description}</p>
        <RecipeContentIngredients
          ingredients={ingredients}
          onToggleCompletion={toggleIngredientCompletion}
          onResetCompletion={resetIngredientCompletion}
        />
        <RecipeContentInstructions
          instructions={instructions}
          onToggleCompletion={toggleInstructionCompletion}
          onResetCompletion={resetInstructionCompletion}
        />
        <RecipeContentFooter
          sourcePrompt={source_prompt}
          recipeVersion={recipeVersion}
          versionCount={recipe.versions.length}
          onViewPrompt={() => setIsPromptModalOpen(true)}
        />
        <RecipeContentPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          sourcePrompt={source_prompt || ""}
          anchorRef={modalAnchorRef}
        />
      </div>
    );
  },
);

RecipeContent.displayName = "RecipeContent";

export default RecipeContent;
