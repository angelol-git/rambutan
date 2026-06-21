import { Link } from "react-router";
import type { Recipe } from "../../types/recipe";

function HomeRecipeCard({ recipe }: { recipe: Recipe }) {
  const stackCount = Math.min(Math.max(recipe.versions.length - 1, 0), 3);
  const stackOffsetX = 3;
  const stackOffsetY = 4;
  const stackColors = [
    "var(--color-overlay0)",
    "var(--color-green)",
    "var(--color-blue)",
  ];
  const versionLabel = recipe.versions.length === 1 ? "VERSION" : "VERSIONS";

  return (
    <Link
      to={`/kitchen/${recipe.id}`}
      key={recipe.id}
      className="group block w-full cursor-pointer sm:w-[230px] sm:flex-shrink-0"
      style={{
        paddingBottom: `${stackCount * stackOffsetY}px`,
      }}
    >
      <div className="relative h-[180px] w-full sm:h-[275px]">
        {/* Recipe Card Stacked Effect: Every new version is another card, max of 3 back cards*/}
        {Array.from({ length: stackCount }, (_, index) => {
          const layer = stackCount - index;
          const stackLayer = index + 1;

          return (
            <div
              key={`stack-${recipe.id}-${layer}`}
              className="border-primary/20 bg-base absolute inset-0 rounded-2xl border transition-all duration-200 ease-out"
              style={{
                // backgroundColor: stackColors[(layer - 1) % stackColors.length],
                zIndex: stackLayer,
                transform: `translate(${layer * stackOffsetX}px, ${layer * stackOffsetY}px)`,
              }}
            />
          );
        })}
        <div className="bg-mantle border-primary/10 group-hover:border-accent/35 absolute inset-0 z-20 flex h-full w-full flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ease-out group-hover:-translate-y-0.5">
          <div className="flex flex-col gap-4">
            <h3 className="font-lora line-clamp-2 text-lg leading-snug font-medium md:min-h-[3.25rem] md:text-xl">
              {recipe.title}
            </h3>
            <p className="text-secondary line-clamp-2 text-sm leading-6 md:line-clamp-4">
              {recipe.versions?.[recipe.versions.length - 1]?.description || ""}
            </p>
          </div>
          <div className="border-primary/10 flex items-center justify-between border-t pt-3 md:pt-4">
            <p className="text-secondary font-ibm-plex-mono text-[11px] tracking-[0.12em] uppercase">
              {recipe.versions.length} {versionLabel}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default HomeRecipeCard;
