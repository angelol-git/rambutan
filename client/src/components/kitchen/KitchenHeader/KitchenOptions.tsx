import { Dispatch, SetStateAction } from "react";

type KitchenOptionsProps = {
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
};

function KitchenOptions({ isEditing, setIsEditing }: KitchenOptionsProps) {
  return isEditing ? (
    <div className="flex gap-6 text-sm">
      <button
        onClick={() => {
          setIsEditing(false);
        }}
        className="interactive-mono tracking-[0.08em] uppercase"
      >
        Cancel
      </button>
      <div className="interactive-mono tracking-[0.08em] uppercase">
        Save
      </div>
    </div>
  ) : (
    <div className="flex gap-6 text-sm">
      <button
        onClick={() => {
          setIsEditing(true);
        }}
        className="interactive-mono tracking-[0.08em] uppercase"
      >
        Edit
      </button>
      <div className="interactive-mono tracking-[0.08em] uppercase">
        Share
      </div>
    </div>
  );
}

export default KitchenOptions;
