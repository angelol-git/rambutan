import { useState } from "react";
import AssistantComposer from "../../components/kitchen/AssistantComposer/AssistantComposer";
import KitchenHeader from "../../components/kitchen/KitchenHeader/KitchenHeader.js";

function NewRecipePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <KitchenHeader
        recipe={null}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />

      <div className="flex min-h-0 flex-1 items-center justify-center pb-30">
        <div className="w-full max-w-screen-md">
          <div className="flex flex-1 flex-col gap-4 p-6 sm:text-center">
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
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-screen-md">
          <div className="pb-safe-tight pointer-events-auto w-full px-4 pt-2">
            <AssistantComposer variant="new-recipe" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewRecipePage;
