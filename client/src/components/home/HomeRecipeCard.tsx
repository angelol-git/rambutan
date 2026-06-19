import { Link } from "react-router";
import type { Recipe } from "../../types/recipe";

function HomeRecipeCard({ recipe }: { recipe: Recipe }) {
  function formatDate(dateString: Recipe["created_at"]) {
    if (!dateString) {
      return;
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    return new Date(dateString).toLocaleDateString(undefined, options);
  }
  return (
    <Link
      to={`/kitchen/${recipe.id}`}
      key={recipe.id}
      className="group block h-[250px] w-full cursor-pointer md:h-[275px] md:w-[230px] md:flex-shrink-0"
    >
      <div className="relative h-full w-full">
        <div className="bg-mantle border-primary/10 group-hover:border-accent/35 absolute inset-0 z-20 flex h-full w-full origin-left transform flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-200 ease-out group-hover:-rotate-y-15">
          <div className="flex flex-col gap-3">
            <h3 className="font-lora line-clamp-2 min-h-[3.25rem] text-xl leading-snug font-medium">
              {recipe.title}
            </h3>
            <p className="text-secondary line-clamp-4 text-sm leading-6">
              {recipe.versions?.[recipe.versions.length - 1]?.description || ""}
            </p>
          </div>
          <div className="border-primary/10 flex items-center justify-between border-t pt-4">
            <p className="text-secondary text-sm">
              {formatDate(recipe.created_at)}
            </p>
          </div>
        </div>
        <div className="bg-primary/40 absolute inset-0 z-10 rounded-2xl" />
      </div>
    </Link>
  );
}

export default HomeRecipeCard;
