import type { DraftRecipe, DraftStringField } from "../../../types/draftRecipe";

type EditDescriptionProps = {
  draft: DraftRecipe | null;
  handleDraftString: (field: DraftStringField, value: string) => void;
};

function EditDescription({ draft, handleDraftString }: EditDescriptionProps) {
  const description = draft?.description || "";

  return (
    <section className="flex flex-col gap-3">
      <label className="font-lora text-secondary text-lg font-medium tracking-wide">
        Description
      </label>
      <div className="border-crust bg-mantle/50 rounded-xl border p-4">
        <div className="flex w-full flex-col gap-3">
          <textarea
            id="description"
            name="description"
            rows={5}
            value={description}
            onChange={(event) => {
              handleDraftString("description", event.target.value);
            }}
            className="text-primary border-secondary/20 border-b"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                handleDraftString("description", "");
              }}
              className="cursor-pointer text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EditDescription;
