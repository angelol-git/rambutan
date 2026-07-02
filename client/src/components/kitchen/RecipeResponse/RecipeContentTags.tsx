import type { Recipe } from "../../../types/recipe";

type RecipeContentTagsProps = {
  recipe: Recipe | null;
};

function RecipeContentTags({ recipe }: RecipeContentTagsProps) {
  const tags = recipe?.tags || [];

  if (!tags.length) return null;

  return (
    <div
      aria-label="Recipe tags"
      className="text-primary flex flex-wrap items-center gap-x-4 gap-y-1"
    >
      {tags.map((tag) => {
        return (
          <span
            key={tag.id}
            className="font-lora inline-flex items-center gap-2 text-sm italic"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span>{tag.name}</span>
          </span>
        );
      })}
    </div>
  );
}

export default RecipeContentTags;
