import { LoaderCircle, MessageCircleMore } from "lucide-react";

type AssistantComposerButtonProps = {
  isPending: boolean;
  onOpen: () => void;
};

function AssistantComposerButton({
  isPending,
  onOpen,
}: AssistantComposerButtonProps) {
  return (
    <button
      className="bg-accent hover:bg-accent-hover inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white transition-colors duration-200"
      onClick={onOpen}
      aria-label="Open recipe assistant"
    >
      {isPending ? (
        <LoaderCircle
          size={23}
          strokeWidth={1.5}
          className="animate-spin stroke-current"
        />
      ) : (
        <MessageCircleMore
          size={23}
          strokeWidth={1.5}
          className="stroke-white"
        />
      )}
    </button>
  );
}

export default AssistantComposerButton;
