"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollageImage, ServerMessage } from "@/lib/types";
import { CANVAS_W, CANVAS_H } from "@/lib/canvas-types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useCollage() {
  const imagesRef = useRef<Map<string, CollageImage>>(new Map());
  const [, setRenderTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const throttleTimerRef = useRef<number | null>(null);
  const lastSendTimeRef = useRef(0);

  const tick = useCallback(() => {
    setRenderTick((n) => n + 1);
  }, []);

  // Update an image element's position/size/rotation directly in the DOM.
  // Avoids React re-render which would restart GIF animations.
  const updateImageEl = useCallback(
    (id: string, x: number, y: number, w?: number, h?: number, rot?: number) => {
      const el = document.getElementById(`img-${id}`) as HTMLElement | null;
      if (!el) return;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.setAttribute("data-x", String(x));
      el.setAttribute("data-y", String(y));
      if (w !== undefined) el.style.width = `${w}px`;
      if (h !== undefined) el.style.height = `${h}px`;
      if (rot !== undefined) el.style.transform = `rotate(${rot}deg)`;
    },
    []
  );

  // --- WebSocket message handling ---
  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      const map = imagesRef.current;

      switch (msg.type) {
        case "init": {
          map.clear();
          for (const img of msg.images) {
            // Ensure rotation exists for backward compat
            if (img.rotation === undefined) img.rotation = 0;
            map.set(img.id, img);
          }
          tick();
          break;
        }
        case "users": {
          setUserCount(msg.count);
          break;
        }
        case "move": {
          const img = map.get(msg.id);
          if (img) {
            img.x = msg.x;
            img.y = msg.y;
          }
          // Direct DOM update — avoids React re-render which restarts GIF animations
          updateImageEl(msg.id, msg.x, msg.y);
          break;
        }
        case "resize": {
          const img = map.get(msg.id);
          if (img) {
            img.x = msg.x;
            img.y = msg.y;
            img.width = msg.width;
            img.height = msg.height;
          }
          updateImageEl(msg.id, msg.x, msg.y, msg.width, msg.height);
          break;
        }
        case "transform": {
          const img = map.get(msg.id);
          if (img) {
            img.x = msg.x;
            img.y = msg.y;
            img.width = msg.width;
            img.height = msg.height;
            img.rotation = msg.rotation;
          }
          updateImageEl(msg.id, msg.x, msg.y, msg.width, msg.height, msg.rotation);
          break;
        }
        case "uploaded": {
          map.set(msg.id, {
            id: msg.id,
            x: msg.x ?? 0,
            y: msg.y ?? 0,
            width: msg.width,
            height: msg.height,
            zIndex: msg.zIndex,
            rotation: 0,
          });
          tick();
          break;
        }
        case "delete": {
          map.delete(msg.id);
          setSelectedId((prev) => (prev === msg.id ? null : prev));
          tick();
          break;
        }
        case "deleteAll": {
          map.clear();
          setSelectedId(null);
          tick();
          break;
        }
        case "toFront": {
          const target = map.get(msg.id);
          if (!target) break;
          const oldZ = target.zIndex;
          const maxZ = Math.max(...Array.from(map.values()).map((i) => i.zIndex));
          target.zIndex = maxZ;
          for (const [id, img] of map) {
            if (id !== msg.id && img.zIndex > oldZ) {
              img.zIndex -= 1;
            }
          }
          tick();
          break;
        }
        case "toBack": {
          const target = map.get(msg.id);
          if (!target) break;
          const oldZ = target.zIndex;
          target.zIndex = 0;
          for (const [id, img] of map) {
            if (id !== msg.id && img.zIndex < oldZ) {
              img.zIndex += 1;
            }
          }
          tick();
          break;
        }
        case "lock": {
          const img = map.get(msg.id);
          if (img) img.locked = msg.locked;
          tick();
          break;
        }
      }
    },
    [tick, updateImageEl]
  );

  // --- WebSocket connection ---
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [handleServerMessage]);

  // --- Send helper with throttle ---
  const sendWs = useCallback((data: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  const sendThrottled = useCallback(
    (data: object) => {
      const now = Date.now();
      if (now - lastSendTimeRef.current >= 25) {
        lastSendTimeRef.current = now;
        sendWs(data);
      } else {
        if (throttleTimerRef.current !== null) {
          clearTimeout(throttleTimerRef.current);
        }
        throttleTimerRef.current = window.setTimeout(() => {
          lastSendTimeRef.current = Date.now();
          sendWs(data);
          throttleTimerRef.current = null;
        }, 25 - (now - lastSendTimeRef.current));
      }
    },
    [sendWs]
  );

  // --- Actions ---
  const selectImage = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const uploadImage = useCallback(
    async (file: File, dropPoint?: { x: number; y: number }) => {
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "png";
      const renamedFile = new File([file], `${id}.${ext}`, { type: file.type });

      const formData = new FormData();
      formData.append("file", renamedFile);

      const resp = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error("Upload failed");
      }

      // Calculate dimensions
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = objectUrl;
      });

      const { naturalWidth, naturalHeight } = img;
      URL.revokeObjectURL(objectUrl);

      // Scale to 300px on longest side
      const INITIAL_SIZE = 300;
      let width: number;
      let height: number;
      if (naturalWidth >= naturalHeight) {
        width = INITIAL_SIZE;
        height = Math.round((INITIAL_SIZE / naturalWidth) * naturalHeight);
      } else {
        height = INITIAL_SIZE;
        width = Math.round((INITIAL_SIZE / naturalHeight) * naturalWidth);
      }

      // Toolbar uploads are centered. Desktop drops are centered on the cursor
      // and clamped so the full image remains on the canvas.
      const x = dropPoint
        ? Math.max(0, Math.min(CANVAS_W - width, Math.round(dropPoint.x - width / 2)))
        : Math.round((CANVAS_W - width) / 2);
      const y = dropPoint
        ? Math.max(0, Math.min(CANVAS_H - height, Math.round(dropPoint.y - height / 2)))
        : Math.round((CANVAS_H - height) / 2);

      // Calculate zIndex
      const existingImages = Array.from(imagesRef.current.values());
      const zIndex =
        existingImages.length > 0
          ? Math.max(...existingImages.map((i) => i.zIndex)) + 1
          : 0;

      const fullId = `${id}.${ext}`;

      // Add to local state
      imagesRef.current.set(fullId, {
        id: fullId,
        x,
        y,
        width,
        height,
        zIndex,
        rotation: 0,
      });
      tick();

      // Notify server
      sendWs({ type: "uploaded", id: fullId, x, y, width, height, zIndex });
    },
    [tick, sendWs]
  );

  const deleteImage = useCallback(() => {
    if (!selectedId) return;
    imagesRef.current.delete(selectedId);
    sendWs({ type: "delete", id: selectedId });
    setSelectedId(null);
    tick();
  }, [selectedId, sendWs, tick]);

  const deleteAll = useCallback(() => {
    imagesRef.current.clear();
    sendWs({ type: "deleteAll" });
    setSelectedId(null);
    tick();
  }, [sendWs, tick]);

  const sendToFront = useCallback(() => {
    if (!selectedId) return;
    sendWs({ type: "toFront", id: selectedId });
    // Apply locally too
    handleServerMessage({ type: "toFront", id: selectedId });
  }, [selectedId, sendWs, handleServerMessage]);

  const sendToBack = useCallback(() => {
    if (!selectedId) return;
    sendWs({ type: "toBack", id: selectedId });
    handleServerMessage({ type: "toBack", id: selectedId });
  }, [selectedId, sendWs, handleServerMessage]);

  const toggleLock = useCallback(() => {
    if (!selectedId) return;
    const img = imagesRef.current.get(selectedId);
    if (!img) return;
    const locked = !img.locked;
    img.locked = locked;
    sendWs({ type: "lock", id: selectedId, locked });
    tick();
  }, [selectedId, sendWs, tick]);

  const handleTransform = useCallback(
    (id: string, x: number, y: number, width: number, height: number, rotation: number, final?: boolean) => {
      const img = imagesRef.current.get(id);
      if (!img) return;
      // Don't allow transforms on locked images
      if (img.locked) return;
      if (img) {
        img.x = x;
        img.y = y;
        img.width = width;
        img.height = height;
        img.rotation = rotation;
      }
      const data = { type: "transform", id, x, y, width, height, rotation };
      if (final) {
        sendWs(data);
      } else {
        sendThrottled(data);
      }
    },
    [sendWs, sendThrottled]
  );

  const takeScreenshot = useCallback(async () => {
    const canvas = document.getElementById("canvas") as HTMLElement | null;
    if (!canvas) return;

    // Temporarily reset transform so html2canvas captures at full size
    const origTransform = canvas.style.transform;
    canvas.style.transform = "none";

    try {
      const html2canvas = (await import("html2canvas")).default;
      const result = await html2canvas(canvas, {
        backgroundColor: window.getComputedStyle(canvas).backgroundColor,
        scale: 1,
        width: CANVAS_W,
        height: CANVAS_H,
        useCORS: true,
        allowTaint: false,
      });
      const url = result.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "collage.png";
      a.click();
    } finally {
      canvas.style.transform = origTransform;
    }
  }, []);

  // Build images array from map
  const images = Array.from(imagesRef.current.values());

  return {
    images,
    selectedId,
    userCount,
    isConnected,
    selectImage,
    uploadImage,
    deleteImage,
    deleteAll,
    sendToFront,
    sendToBack,
    toggleLock,
    handleTransform,
    takeScreenshot,
  };
}
