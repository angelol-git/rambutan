import { Link } from "react-router";
import type { Recipe } from "../../types/recipe";

function HomeRecipeLine({ recipe }: { recipe: Recipe }) {
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
      className="flex w-full cursor-pointer items-end justify-between"
    >
      <h3 className="font-lora text-lg underline decoration-1 underline-offset-6 md:text-xl">
        {recipe.title}
      </h3>
      <p className="text-secondary text-sm">{formatDate(recipe.created_at)}</p>
    </Link>
  );
}

export default HomeRecipeLine;
