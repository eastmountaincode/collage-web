export const CANVAS_W = 900;
export const CANVAS_H = 1100;
export const MIN_SIZE = 25;
export const EDGE_ZONE = 14;
export const CORNER_ZONE = 20;

export type Zone =
  | "move"
  | "n" | "s" | "e" | "w"
  | "rotate-nw" | "rotate-ne" | "rotate-sw" | "rotate-se";

/** Desktop drag state — tracks position internally, never reads from DOM */
export interface DragState {
  imageId: string;
  el: HTMLElement;
  zone: Zone;
  prevScreenX: number;
  prevScreenY: number;
  // Live tracked values (written to DOM each frame)
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  // Snapshot at drag start (for rotation reference)
  startRot: number;
  centerScreenX: number;
  centerScreenY: number;
  startPointerAngle: number;
  // Aspect ratio preserved during resize
  aspect: number;
  // Tap detection
  downTime: number;
  moved: boolean;
}

/** Touch pinch/drag state */
export interface PinchState {
  imageId: string;
  el: HTMLElement;
  pointers: Map<number, { x: number; y: number }>;
  // Live tracked values for single-finger drag
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  // Snapshot when 2nd finger arrives (for pinch reference)
  startDist: number;
  startAngle: number;
  snapX: number;
  snapY: number;
  snapW: number;
  snapH: number;
  snapRot: number;
  // Tap detection
  moved: boolean;
  downTime: number;
}
