import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { storageGet, storageSet } from "../lib/storage";

export interface OverlayLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  updatedAt: number;
}

const OVERLAY_LAYOUT_STORAGE_KEY = "overlayLayout";
const VIEWPORT_GUTTER = 8;
const MIN_WIDTH = 380;
const MIN_HEIGHT = 520;

function getLayoutLimits() {
  const maxWidth = Math.max(280, Math.floor(window.innerWidth * 0.9));
  const maxHeight = Math.max(420, Math.floor(window.innerHeight * 0.92));
  return {
    minWidth: Math.min(MIN_WIDTH, maxWidth),
    minHeight: Math.min(MIN_HEIGHT, maxHeight),
    maxWidth,
    maxHeight
  };
}

function getDefaultLayout(): OverlayLayout {
  const limits = getLayoutLimits();
  return {
    x: 24,
    y: 24,
    width: Math.min(440, limits.maxWidth),
    height: Math.min(760, limits.maxHeight),
    updatedAt: Date.now()
  };
}

function clampLayout(layout: OverlayLayout): OverlayLayout {
  const limits = getLayoutLimits();
  const width = Math.min(limits.maxWidth, Math.max(limits.minWidth, layout.width));
  const height = Math.min(limits.maxHeight, Math.max(limits.minHeight, layout.height));
  const maxX = Math.max(VIEWPORT_GUTTER, window.innerWidth - width - VIEWPORT_GUTTER);
  const maxY = Math.max(VIEWPORT_GUTTER, window.innerHeight - height - VIEWPORT_GUTTER);
  return {
    ...layout,
    x: Math.min(maxX, Math.max(VIEWPORT_GUTTER, layout.x)),
    y: Math.min(maxY, Math.max(VIEWPORT_GUTTER, layout.y)),
    width,
    height
  };
}

type Interaction = {
  pointerId: number;
  mode: "drag" | `resize-${ResizeDirection}`;
  startClientX: number;
  startClientY: number;
  startLayout: OverlayLayout;
};

type ResizeDirection =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

function clampDimension(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resizeLayout(
  startLayout: OverlayLayout,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number
) {
  const limits = getLayoutLimits();
  const fromLeft = direction.includes("left");
  const fromRight = direction.includes("right");
  const fromTop = direction.includes("top");
  const fromBottom = direction.includes("bottom");
  let { x, y, width, height } = startLayout;

  if (fromLeft) {
    const right = startLayout.x + startLayout.width;
    const maxWidth = Math.min(limits.maxWidth, right - VIEWPORT_GUTTER);
    width = clampDimension(startLayout.width - deltaX, limits.minWidth, maxWidth);
    x = right - width;
  } else if (fromRight) {
    const maxWidth = Math.min(
      limits.maxWidth,
      window.innerWidth - startLayout.x - VIEWPORT_GUTTER
    );
    width = clampDimension(startLayout.width + deltaX, limits.minWidth, maxWidth);
  }

  if (fromTop) {
    const bottom = startLayout.y + startLayout.height;
    const maxHeight = Math.min(limits.maxHeight, bottom - VIEWPORT_GUTTER);
    height = clampDimension(startLayout.height - deltaY, limits.minHeight, maxHeight);
    y = bottom - height;
  } else if (fromBottom) {
    const maxHeight = Math.min(
      limits.maxHeight,
      window.innerHeight - startLayout.y - VIEWPORT_GUTTER
    );
    height = clampDimension(startLayout.height + deltaY, limits.minHeight, maxHeight);
  }

  return clampLayout({ ...startLayout, x, y, width, height });
}

export function FloatingOverlay(props: { children: ReactNode }) {
  const [layout, setLayout] = useState(getDefaultLayout);
  const [isReady, setIsReady] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const layoutRef = useRef(layout);
  const interactionRef = useRef<Interaction | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  layoutRef.current = layout;

  const saveLayout = useCallback(async (nextLayout: OverlayLayout) => {
    const value = { ...clampLayout(nextLayout), updatedAt: Date.now() };
    layoutRef.current = value;
    setLayout(value);
    await storageSet(OVERLAY_LAYOUT_STORAGE_KEY, value);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void storageGet(OVERLAY_LAYOUT_STORAGE_KEY, getDefaultLayout()).then((stored) => {
      if (cancelled) return;
      const next = clampLayout(stored);
      layoutRef.current = next;
      setLayout(next);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      interactionRef.current = null;
      setIsInteracting(false);
      const next = clampLayout(layoutRef.current);
      layoutRef.current = next;
      setLayout(next);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        void saveLayout(layoutRef.current);
      }, 160);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [saveLayout]);

  const startInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    const resizeDirection = target.closest<HTMLElement>("[data-overlay-resize]")?.dataset.overlayResize as ResizeDirection | undefined;
    const isInteractiveControl = Boolean(target.closest("button, input, textarea, select, a, [contenteditable='true'], [data-no-drag]"));
    const isDragHandle = Boolean(target.closest(".drag-handle"));
    const mode: Interaction["mode"] | null = resizeDirection
      ? `resize-${resizeDirection}`
      : isDragHandle && !isInteractiveControl
        ? "drag"
        : null;
    if (!mode) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      pointerId: event.pointerId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLayout: layoutRef.current
    };
    setIsInteracting(true);
  };

  const moveInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    if (event.buttons === 0) {
      interactionRef.current = null;
      setIsInteracting(false);
      return;
    }
    const deltaX = event.clientX - interaction.startClientX;
    const deltaY = event.clientY - interaction.startClientY;
    const next = interaction.mode === "drag"
      ? { ...interaction.startLayout, x: interaction.startLayout.x + deltaX, y: interaction.startLayout.y + deltaY }
      : resizeLayout(
          interaction.startLayout,
          interaction.mode.slice("resize-".length) as ResizeDirection,
          deltaX,
          deltaY
        );
    const clamped = clampLayout(next);
    layoutRef.current = clamped;
    setLayout(clamped);
  };

  const endInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (interactionRef.current?.pointerId !== event.pointerId) return;
    interactionRef.current = null;
    setIsInteracting(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    void saveLayout(layoutRef.current);
  };

  return (
    <div
      className={`floating-overlay-frame ${isInteracting ? "is-interacting" : ""}`}
      style={{
        width: layout.width,
        height: layout.height,
        transform: `translate3d(${layout.x}px, ${layout.y}px, 0)`,
        visibility: isReady ? "visible" : "hidden"
      }}
      onPointerDown={startInteraction}
      onPointerMove={moveInteraction}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
      onLostPointerCapture={endInteraction}
    >
      {props.children}
      <div className="overlay-resize-handle overlay-resize-top" data-overlay-resize="top" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-right" data-overlay-resize="right" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-bottom" data-overlay-resize="bottom" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-left" data-overlay-resize="left" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-corner overlay-resize-top-left" data-overlay-resize="top-left" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-corner overlay-resize-top-right" data-overlay-resize="top-right" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-corner overlay-resize-bottom-right" data-overlay-resize="bottom-right" aria-hidden="true" />
      <div className="overlay-resize-handle overlay-resize-corner overlay-resize-bottom-left" data-overlay-resize="bottom-left" aria-hidden="true" />
    </div>
  );
}
