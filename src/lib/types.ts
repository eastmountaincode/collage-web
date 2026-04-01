export interface CollageImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

// Messages from server
export type ServerMessage =
  | { type: "init"; images: CollageImage[] }
  | { type: "users"; count: number }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "resize"; id: string; x: number; y: number; width: number; height: number }
  | { type: "uploaded"; id: string; width: number; height: number; zIndex: number }
  | { type: "delete"; id: string }
  | { type: "deleteAll" }
  | { type: "toFront"; id: string }
  | { type: "toBack"; id: string };
