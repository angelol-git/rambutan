import type { DraftRecipe } from "../../../types/draftRecipe";
import type { RecipeDetailValue, RecipeDetails } from "../../../types/recipe";

type RecipeDetailField = keyof RecipeDetails;

type EditRecipeDetailsProps = {
  draft: DraftRecipe | null;
  handleDraftDetail: (field: RecipeDetailField, value: string) => void;
};

type DetailFieldConfig = {
  field: RecipeDetailField;
  label: string;
};

type DetailItemProps = {
  field: RecipeDetailField;
  label: string;
  value: RecipeDetailValue | undefined;
  handleDraftDetail: (field: RecipeDetailField, value: string) => void;
};

const DETAIL_FIELDS: DetailFieldConfig[] = [
  { field: "calories", label: "Calories" },
  { field: "total_time", label: "Total Time" },
  { field: "servings", label: "Servings" },
];

function EditRecipeDetails({
  draft,
  handleDraftDetail,
}: EditRecipeDetailsProps) {
  const recipeDetails = draft?.recipeDetails;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-lora text-secondary text-lg font-medium tracking-wide">
        Recipe Details
      </h3>
      <div>
        <div className="border-crust bg-mantle/50 flex flex-col gap-4 rounded-xl border p-4">
          {DETAIL_FIELDS.map(({ field, label }) => (
            <DetailItem
              key={field}
              field={field}
              label={label}
              value={recipeDetails?.[field]}
              handleDraftDetail={handleDraftDetail}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailItem({
  field,
  label,
  value,
  handleDraftDetail,
}: DetailItemProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={field} className="text-secondary/90 min-w-[80px] text-sm">
        {label}
      </label>
      <input
        id={field}
        name={field}
        type="text"
        value={value ?? ""}
        onChange={(event) => handleDraftDetail(field, event.target.value)}
        className="border-overlay0 text-primary flex-1 border-b bg-transparent focus:outline-none"
      />
    </div>
  );
}

export default EditRecipeDetails;
