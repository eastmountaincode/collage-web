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
    const container = containerRef.current;
    if (!container) return;

    const availableWidth = container.clientWidth;
    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const main = container.closest("main");
    const bottomPadding = main
      ? Number.parseFloat(window.getComputedStyle(main).paddingBottom) || 0
      : 0;
    const visibleToolbar = window.matchMedia("(max-width: 639px)").matches
      ? Array.from(document.querySelectorAll<HTMLElement>("[data-toolbar]"))
          .find((toolbar) => toolbar.getBoundingClientRect().height > 0)
      : null;
    const mobileToolbar = visibleToolbar?.parentElement;
    const mobileToolbarHeight = mobileToolbar?.getBoundingClientRect().height ?? 0;
    const availableHeight = Math.max(
      0,
      window.innerHeight - containerTop - bottomPadding - mobileToolbarHeight
    );

    setScale(Math.min(
      1,
      availableWidth / CANVAS_W,
      availableHeight / CANVAS_H
    ));
  }, []);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", updateScale);
    document.fonts.ready.then(updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [updateScale]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) selectImage(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 flex justify-center"
      style={{ maxWidth: CANVAS_W }}
    >
      <div
        className="shrink-0"
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
