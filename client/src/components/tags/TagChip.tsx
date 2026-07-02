import type { ElementType, ReactNode, HTMLAttributes } from "react";

type TagChipProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  color?: string;
  children?: ReactNode;
  background?: "mantle" | "base";
  variant?: "default" | "recipe";
};

const BACKGROUND_CLASS_NAMES = {
  mantle: "bg-mantle",
  base: "bg-base",
} as const;

const VARIANT_CLASS_NAMES = {
  default:
    "min-h-8 gap-2 rounded-full border px-3 py-1 leading-none border-primary/10",
  recipe:
    "min-h-7 gap-2 rounded-lg border px-2.5 py-1 text-sm leading-none border-primary/8",
} as const;

const COLOR_DOT_CLASS_NAMES = {
  default: "h-3.5 w-3.5",
  recipe: "h-3 w-3",
} as const;

function TagChip({
  as: Component = "div",
  color,
  background = "mantle",
  variant = "default",
  className = "",
  children,
  ...props
}: TagChipProps) {
  return (
    <Component
      className={`${BACKGROUND_CLASS_NAMES[background]} ${VARIANT_CLASS_NAMES[variant]} text-primary inline-flex w-fit items-center transition-colors ${className}`.trim()}
      {...props}
    >
      {color ? (
        <div
          className={`${COLOR_DOT_CLASS_NAMES[variant]} shrink-0 rounded-full`}
          style={{ backgroundColor: color }}
        />
      ) : null}
      {children}
    </Component>
  );
}

export default TagChip;
