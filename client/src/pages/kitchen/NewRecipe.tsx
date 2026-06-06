import { useEffect } from "react";
import AssistantComposer from "../../components/kitchen/AssistantComposer/AssistantComposer";

function NewRecipe() {
  // Hide shell once component is ready
  useEffect(() => {
    window.hideShell?.();
  }, []);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col items-center">
      <div className="flex min-h-0 w-full max-w-screen-md flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center gap-4 p-6 sm:text-center">
          <h2 className="text-primary font-lora text-2xl font-medium">
            What recipe can I help you with?
          </h2>
          <div className="text-secondary">
            Paste a link to any recipe, and I'll extract the ingredients and
            steps.
          </div>
          <div className="text-secondary">
            Ask me to improve a recipe, healthier, quicker, or more flavorful.
          </div>
          <div className="text-secondary">
            Ask to double, halve, or scale the recipe for any number of
            servings.
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="pb-safe pointer-events-auto mx-auto w-full max-w-screen-md px-4 pt-2">
          <AssistantComposer variant="new-recipe" />
        </div>
      </div>
    </div>
  );
}

export default NewRecipe;
