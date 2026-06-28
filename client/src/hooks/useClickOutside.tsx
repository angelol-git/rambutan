import { useEffect, type RefObject } from "react";

type ClickOutsideTarget = RefObject<HTMLElement | null>;

function useClickOutside(
  refs: ClickOutsideTarget[],
  onOutsideClick: () => void,
) {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      const target = event.target;

      const isInsideTarget = refs.some((ref) => {
        return ref.current?.contains(target) ?? false;
      });

      if (!isInsideTarget) {
        onOutsideClick();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onOutsideClick, refs]);
}

export default useClickOutside;
