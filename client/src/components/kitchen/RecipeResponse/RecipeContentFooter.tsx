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
    <div className="text-secondary mt-4 flex max-w-full justify-between gap-4 border-t border-black/8 pt-4 text-sm">
      <div className="flex w-full max-w-full min-w-0 flex-col items-start gap-2 py-2">
        <button
          type="button"
          onClick={onViewPrompt}
          className="interactive-mono hover:text-primary text-[11px] tracking-[0.12em] uppercase"
        >
          View Prompt
        </button>
      </div>
      {versionCount > 1 && (
        <p
          className="font-ibm-plex-mono whitespace-nowrap text-[11px] tracking-[0.12em] uppercase"
          aria-label={`Version ${recipeVersion + 1} of ${versionCount}`}
        >
          Version {recipeVersion + 1} of {versionCount}
        </p>
      )}
    </div>
  );
}

export default RecipeContentFooter;
