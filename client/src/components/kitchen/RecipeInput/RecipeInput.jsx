import { useRef, useEffect } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";

function RecipeInput({
  askMessage,
  setAskMessage,
  sendAskMessage,
  isReplyLoading,
}) {
  const textAreaRef = useRef(null);
  const minHeight = 24;
  const maxHeight = 160;

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${Math.min(
        Math.max(textAreaRef.current.scrollHeight, minHeight),
        maxHeight,
      )}px`;
    }
  }, [askMessage]);

  return (
    <div className="bg-crust flex rounded-2xl p-2">
      <textarea
        rows={1}
        ref={textAreaRef}
        className="placeholder:text-grey-500 w-full resize-none rounded-xl px-2 leading-6 outline-none"
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflowY: "auto",
        }}
        value={askMessage}
        onChange={(e) => setAskMessage(e.target.value)}
        placeholder="Ask a question about your recipe..."
        aria-label="Ask a question about your recipe"
      />

      <button
        className="bg-lavender hover:bg-accent-dark flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full p-0 text-white"
        onClick={() => {
          if (askMessage.trim().length === 0) return;
          sendAskMessage(askMessage);
          setAskMessage("");
        }}
      >
        {isReplyLoading ? (
          <LoaderCircle size={20} strokeWidth={1.5} className="stroke-white" />
        ) : (
          <ArrowUp size={20} strokeWidth={1.5} className="stroke-white" />
        )}
      </button>
    </div>
  );
}

export default RecipeInput;
