"use client";

import { useEffect, useRef, useState, useCallback, type DragEvent } from "react";
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
  onDropImage?: (file: File, point: { x: number; y: number }) => Promise<void>;
  alignDesktop?: "start" | "center";
}

function containsFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function Canvas({
  images,
  selectedId,
  selectImage,
  handleTransform,
  onDropImage,
  alignDesktop = "center",
}: CanvasProps) {
  useCanvasGestures({ selectImage, handleTransform });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragDepthRef = useRef(0);
  const [scale, setScale] = useState(1);
  const [dropState, setDropState] = useState<"idle" | "ready" | "uploading">("idle");

  const updateScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const availableWidth = container.clientWidth;
    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const main = container.closest("main");
    const bottomPadding = main
      ? Number.parseFloat(window.getComputedStyle(main).paddingBottom) || 0
      : 0;
    const mobileToolbar = document.querySelector<HTMLElement>("[data-mobile-toolbar]");
    const mobileToolbarHeight = mobileToolbar
      && window.getComputedStyle(mobileToolbar).display !== "none"
      ? mobileToolbar.getBoundingClientRect().height
      : 0;
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

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!onDropImage || !containsFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDropState("ready");
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!onDropImage || !containsFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!onDropImage || !containsFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDropState("idle");
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    if (!onDropImage || !containsFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;

    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));
    if (!file) {
      setDropState("idle");
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
    };

    setDropState("uploading");
    try {
      await onDropImage(file, point);
    } catch {
      // The toolbar upload follows the same silent failure behavior.
    } finally {
      setDropState("idle");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 flex justify-center ${alignDesktop === "start" ? "md:justify-start" : ""}`}
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
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {dropState !== "idle" && (
            <div className="canvas-drop-indicator" aria-hidden="true">
              {dropState === "uploading" ? "Uploading..." : "Drop image here"}
            </div>
          )}
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
