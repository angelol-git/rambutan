import { RefObject } from "react";
import { createPortal } from "react-dom";
import { Copy } from "lucide-react";
import { useToast } from "../../../hooks/useToast";
import useModalAnchor from "../../../hooks/useModalAnchor";

type RecipePromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sourcePrompt: string;
  anchorRef: RefObject<HTMLDivElement | null>;
};

function RecipePromptModal({
  isOpen,
  onClose,
  sourcePrompt,
  anchorRef,
}: RecipePromptModalProps) {
  const { showToast } = useToast();
  const anchorStyle = useModalAnchor(anchorRef, isOpen);

  async function handleCopy() {
    const type = "text/plain";
    const clipboardItemData = { [type]: sourcePrompt };
    try {
      const clipboardItem = new ClipboardItem(clipboardItemData);
      await navigator.clipboard.write([clipboardItem]);
      showToast("Copied to clipboard!", "success");
      onClose();
    } catch {
      // Clipboard access denied or failed
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] bg-black/10 transition-opacity duration-300 ${
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 flex items-end justify-center lg:inset-y-0 lg:items-end"
        style={anchorStyle}
      >
        <div
          className={`bg-base flex h-[90dvh] w-full transform flex-col overflow-y-auto overscroll-contain rounded-t-xl px-4 pt-6 pb-10 shadow-lg transition-transform duration-300 ease-out lg:rounded-xl ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary hover:bg-base-hover flex h-9 w-18 cursor-pointer items-center justify-center rounded-lg px-2 transition-colors duration-150"
            >
              Close
            </button>
            <div className="flex flex-col items-center">
              <h2 className="font-bold">Source Prompt</h2>
            </div>
            <button
              onClick={handleCopy}
              className="text-secondary hover:text-primary hover:bg-base-hover flex h-9 w-18 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 transition-colors duration-150"
              aria-label="Copy source prompt"
            >
              <Copy size={18} />
              <div>Copy</div>
            </button>
          </div>

          <div className="border-crust bg-modal/45 flex-1 rounded-2xl border p-5">
            <p className="text-primary leading-7 break-words whitespace-pre-wrap">
              {sourcePrompt}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default RecipePromptModal;
