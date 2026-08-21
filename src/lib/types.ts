export interface CollageImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  locked?: boolean;
}

// Messages from server
export type ServerMessage =
  | { type: "init"; images: CollageImage[] }
  | { type: "users"; count: number }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "resize"; id: string; x: number; y: number; width: number; height: number }
  | { type: "transform"; id: string; x: number; y: number; width: number; height: number; rotation: number }
  | { type: "uploaded"; id: string; x?: number; y?: number; width: number; height: number; zIndex: number }
  | { type: "delete"; id: string }
  | { type: "deleteAll" }
  | { type: "toFront"; id: string }
  | { type: "toBack"; id: string }
  | { type: "lock"; id: string; locked: boolean };
