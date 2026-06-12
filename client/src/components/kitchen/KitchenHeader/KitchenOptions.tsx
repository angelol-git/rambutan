import { Dispatch, SetStateAction } from "react";

function KitchenOptions({
  setIsEditing,
}: {
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="flex gap-4 text-sm">
      <button
        onClick={() => {
          setIsEditing(true);
        }}
        className="cursor-pointer underline"
      >
        Edit
      </button>
      <div className="cursor-pointer underline">Share</div>
    </div>
  );
}

export default KitchenOptions;
