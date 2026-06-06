import { DraftRecipe, DraftStringField } from "../../../types/draftRecipe";

type EditTitleProps = {
  draft: DraftRecipe | null;
  handleDraftString: (field: DraftStringField, value: string) => void;
};
function EditTitle({ draft, handleDraftString }: EditTitleProps) {
  return (
    <section className="flex flex-col gap-3">
      <label className="font-lora text-secondary text-lg font-medium tracking-wide">
        Title
      </label>
      <div className="border-crust bg-mantle/50 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex w-full flex-col gap-2">
            <input
              name="editTitle"
              id="editTitle"
              type="text"
              maxLength={150}
              value={draft?.title || ""}
              className="border-overlay0 border-b px-2 pb-1"
              onChange={(event) => {
                handleDraftString("title", event.target.value);
              }}
              required
            />
          </div>
          <button
            type="button"
            onClick={() => {
              handleDraftString("title", "");
            }}
            className="cursor-pointer text-xs"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}

export default EditTitle;
