import { createPortal } from "react-dom";
import type { ToastType } from "../context/ToastContext";

type ToastProps = {
  message: string;
  onClose: () => void;
  type?: ToastType;
};

function Toast({ message, onClose, type = "error" }: ToastProps) {
  const isAssistantComposerOpen =
    document.body.dataset.assistantComposerOpen === "true";

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed left-1/2 z-[200] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 transition-[bottom] duration-200 ${
        isAssistantComposerOpen ? "bottom-32" : "bottom-4"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-4 rounded-[1rem] px-4 py-3 shadow-lg ${
          type === "error" ? "bg-rose text-white" : "bg-accent text-white"
        }`}
      >
        <div className="flex min-w-0 items-center">
          <span className="min-w-0 text-sm leading-6 break-words">
            {message}
          </span>
        </div>
        <button
          type="button"
          className="interactive-mono shrink-0 text-xs tracking-[0.08em] text-white uppercase hover:text-white/80"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default Toast;
