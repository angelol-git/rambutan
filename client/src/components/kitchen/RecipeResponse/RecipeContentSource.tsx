import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import type { RecipeSource } from "../../../types/recipe";

const RAW_TEXT_PREVIEW_LINES = 2;

type RecipeContentSourceProps = {
  source: RecipeSource | null;
};

function countSourceLines(sourceText: string) {
  return sourceText.split(/\r?\n/).length;
}

function RecipeContentSource({ source }: RecipeContentSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useToast();
  const hasSource = source !== null;

  if (!hasSource) return null;

  const shouldToggleRawText =
    source?.type === "raw_text" &&
    countSourceLines(source.value) > RAW_TEXT_PREVIEW_LINES;

  async function handleCopy() {
    const type = "text/plain";
    if (!source) {
      return;
    }
    const clipboardItemData = { [type]: source.value };

    try {
      const clipboardItem = new ClipboardItem(clipboardItemData);
      await navigator.clipboard.write([clipboardItem]);
      showToast("Copied to clipboard!", "success");
    } catch {
      // Clipboard access denied or failed
    }
  }

  return (
    <section className="text-primary text-sm">
      <div className="mb-2 flex items-end gap-2">
        <h3 className="font-lora text-xl font-medium">Source</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="interactive-mono text-secondary hover:text-primary flex items-center justify-center gap-1.5 py-1 text-xs tracking-[0.12em] uppercase"
          aria-label="Copy source"
        >
          <div>Copy</div>
        </button>
      </div>
      <div className="min-w-0">
        {source.type === "url" ? (
          <a
            href={source.value}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-secondary break-all underline decoration-black/20 underline-offset-3 transition-colors duration-150"
          >
            {source.summary}
          </a>
        ) : (
          <>
            {/* source_type: raw_text and instructions */}
            <p
              className={`text-primary break-words whitespace-pre-wrap ${
                source.type === "raw_text" && !isExpanded
                  ? `line-clamp-${RAW_TEXT_PREVIEW_LINES}`
                  : ""
              }`}
            >
              {source.value}
            </p>
            {shouldToggleRawText && (
              <button
                type="button"
                onClick={() => setIsExpanded((expanded) => !expanded)}
                className="interactive-mono hover:text-primary mt-2 text-xs tracking-[0.12em] uppercase"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default RecipeContentSource;
