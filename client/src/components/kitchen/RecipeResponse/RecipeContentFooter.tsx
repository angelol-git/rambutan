type RecipeContentFooterProps = {
  sourcePrompt: string;
  recipeVersion: number;
  versionCount: number;
  onViewPrompt: () => void;
};

function RecipeContentFooter({
  sourcePrompt,
  recipeVersion,
  versionCount,
  onViewPrompt,
}: RecipeContentFooterProps) {
  if (!sourcePrompt) return null;

  return (
    <div className="text-secondary mt-4 flex max-w-full justify-between gap-4 text-sm">
      <div className="flex w-full max-w-full min-w-0 flex-col items-start gap-2 py-2">
        <button
          type="button"
          onClick={onViewPrompt}
          className="hover:bg-base-hover font-ibm-plex-mono cursor-pointer rounded-lg p-1 uppercase transition-colors duration-150"
        >
          View Prompt
        </button>
      </div>
      {versionCount > 1 && (
        <p
          className="whitespace-nowrap"
          aria-label={`Version ${recipeVersion + 1} of ${versionCount}`}
        >
          {recipeVersion + 1} of {versionCount}
        </p>
      )}
    </div>
  );
}

export default RecipeContentFooter;
