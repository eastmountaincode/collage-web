"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CollageImage } from "@/lib/types";
import { CANVAS_W, CANVAS_H } from "@/lib/canvas-types";
import { useCanvasGestures } from "@/hooks/useCanvasGestures";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface CanvasProps {
  images: CollageImage[];
  selectedId: string | null;
  selectImage: (id: string | null) => void;
  handleTransform: (
    id: string, x: number, y: number, w: number, h: number,
    rotation: number, final?: boolean
  ) => void;
}

export function Canvas({ images, selectedId, selectImage, handleTransform }: CanvasProps) {
  useCanvasGestures({ selectImage, handleTransform });

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const available = containerRef.current.clientWidth;
    setScale(Math.min(1, available / CANVAS_W));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) selectImage(null);
  };

  return (
    <div ref={containerRef} className="w-full min-w-0" style={{ maxWidth: CANVAS_W }}>
      <div
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        <div
          id="canvas"
          onClick={handleCanvasClick}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              id={`img-${img.id}`}
              data-id={img.id}
              data-x={img.x}
              data-y={img.y}
              data-locked={img.locked ? "true" : undefined}
              src={`${API_URL}/uploads/${img.id}`}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              className={selectedId === img.id ? "selected" : ""}
              style={{
                left: `${img.x}px`,
                top: `${img.y}px`,
                width: `${img.width}px`,
                height: `${img.height}px`,
                zIndex: img.zIndex,
                transform: `rotate(${img.rotation ?? 0}deg)`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
