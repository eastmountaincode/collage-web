"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollageImage, ServerMessage } from "@/lib/types";

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

  // --- WebSocket message handling ---
  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      const map = imagesRef.current;

      switch (msg.type) {
        case "init": {
          map.clear();
          for (const img of msg.images) {
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
            // Update DOM directly for smooth remote updates
            const el = document.getElementById(`img-${msg.id}`) as HTMLElement | null;
            if (el) {
              el.style.left = `${msg.x}px`;
              el.style.top = `${msg.y}px`;
              el.setAttribute("data-x", String(msg.x));
              el.setAttribute("data-y", String(msg.y));
            }
          }
          break;
        }
        case "resize": {
          const img = map.get(msg.id);
          if (img) {
            img.x = msg.x;
            img.y = msg.y;
            img.width = msg.width;
            img.height = msg.height;
            const el = document.getElementById(`img-${msg.id}`) as HTMLElement | null;
            if (el) {
              el.style.left = `${msg.x}px`;
              el.style.top = `${msg.y}px`;
              el.style.width = `${msg.width}px`;
              el.style.height = `${msg.height}px`;
              el.setAttribute("data-x", String(msg.x));
              el.setAttribute("data-y", String(msg.y));
            }
          }
          break;
        }
        case "uploaded": {
          map.set(msg.id, {
            id: msg.id,
            x: 0,
            y: 0,
            width: msg.width,
            height: msg.height,
            zIndex: msg.zIndex,
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
      }
    },
    [tick]
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
    async (file: File) => {
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

      let width: number;
      let height: number;
      if (naturalWidth >= naturalHeight) {
        width = 150;
        height = Math.round((150 / naturalWidth) * naturalHeight);
      } else {
        height = 150;
        width = Math.round((150 / naturalHeight) * naturalWidth);
      }

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
        x: 0,
        y: 0,
        width,
        height,
        zIndex,
      });
      tick();

      // Notify server
      sendWs({ type: "uploaded", id: fullId, width, height, zIndex });
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

  const handleMove = useCallback(
    (id: string, x: number, y: number, final?: boolean) => {
      const img = imagesRef.current.get(id);
      if (img) {
        img.x = x;
        img.y = y;
      }
      const data = { type: "move", id, x, y };
      if (final) {
        sendWs(data);
      } else {
        sendThrottled(data);
      }
    },
    [sendWs, sendThrottled]
  );

  const handleResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number, final?: boolean) => {
      const img = imagesRef.current.get(id);
      if (img) {
        img.x = x;
        img.y = y;
        img.width = width;
        img.height = height;
      }
      const data = { type: "resize", id, x, y, width, height };
      if (final) {
        sendWs(data);
      } else {
        sendThrottled(data);
      }
    },
    [sendWs, sendThrottled]
  );

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
    handleMove,
    handleResize,
  };
}
