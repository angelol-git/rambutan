import { useLayoutEffect, useRef } from "react";
import rough from "roughjs";

interface RoughStrikeProps {
  completed: boolean;
  children: React.ReactNode;
  className?: string;
  singleLine?: boolean;
  firstLineOnly?: boolean;
}

type LineSegment = {
  x1: number;
  x2: number;
  y: number;
};

const LINE_STYLE = {
  stroke: "currentColor",
  strokeWidth: 2,
  disableMultiStroke: true,
  preserveVertices: true,
  bowing: 1.1,
};

function getTextNodes(node: Node): Text[] {
  const textNodes: Text[] = [];

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      textNodes.push(child as Text);
      continue;
    }

    if (
      child.nodeType === Node.ELEMENT_NODE &&
      child.nodeName.toLowerCase() !== "svg"
    ) {
      textNodes.push(...getTextNodes(child));
    }
  }

  return textNodes;
}

function getTextRects(container: HTMLElement): DOMRect[] {
  return getTextNodes(container).flatMap((textNode) => {
    const range = document.createRange();
    range.selectNodeContents(textNode);
    return Array.from(range.getClientRects());
  });
}

function toLineSegment(rect: DOMRect, containerRect: DOMRect): LineSegment {
  return {
    x1: rect.left - containerRect.left,
    x2: rect.right - containerRect.left,
    y: rect.top - containerRect.top + rect.height / 2,
  };
}

function getFirstLineSegment(
  rects: DOMRect[],
  containerRect: DOMRect,
): LineSegment | null {
  let firstLineBottom: number | null = null;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let y: number | null = null;

  for (const rect of rects) {
    if (firstLineBottom == null) {
      firstLineBottom = rect.bottom;
    } else if (rect.top >= firstLineBottom - 1) {
      break;
    }

    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    y = rect.top - containerRect.top + rect.height / 2;
  }

  if (y == null || !Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  return {
    x1: left - containerRect.left,
    x2: right - containerRect.left,
    y,
  };
}

/*
 * Overlays an absolute positioned SVG on top
 */
export function RoughStrike({
  completed,
  children,
  className,
  singleLine,
  firstLineOnly,
}: RoughStrikeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  //Runs after React has committed changes to the DOM but before the browser repaints the screen
  //UseEffect would run after the text has been painted on
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const updateSvg = () => {
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      if (!completed) return;

      const containerRect = container.getBoundingClientRect();
      const width = containerRect.width;
      const height = containerRect.height;

      if (width === 0 || height === 0) return;

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const rc = rough.svg(svg);
      const drawSegment = (segment: LineSegment, roughness: number) => {
        svg.appendChild(
          rc.line(segment.x1, segment.y, segment.x2, segment.y, {
            ...LINE_STYLE,
            roughness,
          }),
        );
      };

      //singleLine are ingredient measurement (quantity + unit)
      if (singleLine) {
        drawSegment({ x1: 0, x2: width, y: height / 2 }, 1.2);
        return;
      }

      //multiline are ingredient text (name + note) and instructions/steps
      const textRects = getTextRects(container);

      //Draw a line through the first of ingredient text (name + note)
      if (firstLineOnly) {
        const firstLineSegment = getFirstLineSegment(textRects, containerRect);
        if (firstLineSegment) {
          drawSegment(firstLineSegment, 1.2);
        }
        return;
      }

      //Draw multiple lines through the ingredients
      for (const rect of textRects) {
        drawSegment(toLineSegment(rect, containerRect), 1.2);
      }
    };

    updateSvg();

    const observer = new ResizeObserver(updateSvg);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [completed, firstLineOnly, singleLine]);

  return (
    <span ref={containerRef} className={`relative ${className || ""}`}>
      {children}
      <svg
        ref={svgRef}
        className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden"
      />
    </span>
  );
}
