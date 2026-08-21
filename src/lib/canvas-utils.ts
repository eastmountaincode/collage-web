import { CANVAS_W, CANVAS_H, EDGE_ZONE, CORNER_ZONE, type Zone } from "./canvas-types";

/**
 * Convert screen coordinates to canvas coordinates,
 * accounting for CSS zoom and canvas position.
 */
export function screenToCanvas(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect
): { x: number; y: number } {
  const scaleX = CANVAS_W / canvasRect.width;
  const scaleY = CANVAS_H / canvasRect.height;
  return {
    x: (clientX - canvasRect.left) * scaleX,
    y: (clientY - canvasRect.top) * scaleY,
  };
}

/**
 * Convert a screen-space delta to canvas-space delta.
 */
export function screenDeltaToCanvas(
  dx: number,
  dy: number,
  canvasRect: DOMRect
): { dx: number; dy: number } {
  const scaleX = CANVAS_W / canvasRect.width;
  const scaleY = CANVAS_H / canvasRect.height;
  return { dx: dx * scaleX, dy: dy * scaleY };
}

/**
 * Detect which zone of an image the pointer is in.
 * Handles rotation by un-rotating the pointer relative to image center.
 */
export function getZone(
  canvasX: number,
  canvasY: number,
  imgX: number,
  imgY: number,
  imgW: number,
  imgH: number,
  rotation: number
): Zone {
  // Image center in canvas space
  const cx = imgX + imgW / 2;
  const cy = imgY + imgH / 2;

  // Pointer relative to center
  const relX = canvasX - cx;
  const relY = canvasY - cy;

  // Un-rotate the pointer
  const rad = (-rotation * Math.PI) / 180;
  const localX = relX * Math.cos(rad) - relY * Math.sin(rad);
  const localY = relX * Math.sin(rad) + relY * Math.cos(rad);

  // Now check zones in un-rotated local space (origin = center)
  const halfW = imgW / 2;
  const halfH = imgH / 2;
  const lx = localX + halfW; // 0..imgW
  const ly = localY + halfH; // 0..imgH

  const nearL = lx < EDGE_ZONE;
  const nearR = lx > imgW - EDGE_ZONE;
  const nearT = ly < EDGE_ZONE;
  const nearB = ly > imgH - EDGE_ZONE;
  const cornerL = lx < CORNER_ZONE;
  const cornerR = lx > imgW - CORNER_ZONE;
  const cornerT = ly < CORNER_ZONE;
  const cornerB = ly > imgH - CORNER_ZONE;

  if (cornerT && cornerL) return "rotate-nw";
  if (cornerT && cornerR) return "rotate-ne";
  if (cornerB && cornerL) return "rotate-sw";
  if (cornerB && cornerR) return "rotate-se";
  if (nearT) return "n";
  if (nearB) return "s";
  if (nearL) return "w";
  if (nearR) return "e";
  return "move";
}

export function cursorForZone(zone: Zone): string {
  switch (zone) {
    case "move": return "grab";
    case "n": case "s": return "ns-resize";
    case "e": case "w": return "ew-resize";
    default: return "alias";
  }
}

export function writeEl(
  el: HTMLElement,
  x: number, y: number, w: number, h: number, rot: number
) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.transform = `rotate(${rot}deg)`;
  el.setAttribute("data-x", String(x));
  el.setAttribute("data-y", String(y));
}

/**
 * Check if the rotated bounding box fits within the canvas.
 * Returns true if it fits, false if it would go out of bounds.
 */
export function fitsInCanvas(x: number, y: number, w: number, h: number, rotDeg = 0): boolean {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const bbW = w * cos + h * sin;
  const bbH = w * sin + h * cos;

  // Margin = how much the bounding box extends beyond the rect on each side
  const mx = (bbW - w) / 2;
  const my = (bbH - h) / 2;

  const minX = mx;
  const minY = my;
  const maxX = CANVAS_W - w - mx;
  const maxY = CANVAS_H - h - my;

  return x >= minX - 0.5 && x <= maxX + 0.5 && y >= minY - 0.5 && y <= maxY + 0.5;
}

/**
 * Clamp a move (position only) to stay within canvas.
 * For move operations, we DO want to clamp so the image slides along the wall.
 */
export function clampMove(x: number, y: number, w: number, h: number, rotDeg = 0) {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const bbW = w * cos + h * sin;
  const bbH = w * sin + h * cos;
  const mx = (bbW - w) / 2;
  const my = (bbH - h) / 2;

  return {
    x: Math.max(mx, Math.min(CANVAS_W - w - mx, x)),
    y: Math.max(my, Math.min(CANVAS_H - h - my, y)),
  };
}

export function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function angle(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}
