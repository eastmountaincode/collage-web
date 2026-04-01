"use client";

import { useEffect, useRef } from "react";
import interact from "interactjs";
import type { CollageImage } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface CanvasProps {
  images: CollageImage[];
  selectedId: string | null;
  selectImage: (id: string | null) => void;
  handleMove: (id: string, x: number, y: number, final?: boolean) => void;
  handleResize: (id: string, x: number, y: number, w: number, h: number, final?: boolean) => void;
}

export function Canvas({ images, selectedId, selectImage, handleMove, handleResize }: CanvasProps) {
  const callbacksRef = useRef({ selectImage, handleMove, handleResize });
  callbacksRef.current = { selectImage, handleMove, handleResize };

  useEffect(() => {
    const interactable = interact("#canvas img")
      .draggable({
        modifiers: [
          interact.modifiers.restrict({
            restriction: "parent",
            endOnly: false,
          }),
        ],
        listeners: {
          move(event) {
            const target = event.target as HTMLElement;
            const x = (parseFloat(target.getAttribute("data-x") || "0")) + event.dx;
            const y = (parseFloat(target.getAttribute("data-y") || "0")) + event.dy;

            target.style.left = `${x}px`;
            target.style.top = `${y}px`;
            target.setAttribute("data-x", String(x));
            target.setAttribute("data-y", String(y));

            const id = target.getAttribute("data-id");
            if (id) {
              callbacksRef.current.handleMove(id, x, y);
            }
          },
          end(event) {
            const target = event.target as HTMLElement;
            const x = parseFloat(target.getAttribute("data-x") || "0");
            const y = parseFloat(target.getAttribute("data-y") || "0");
            const id = target.getAttribute("data-id");
            if (id) {
              callbacksRef.current.handleMove(id, x, y, true);
            }
          },
        },
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        modifiers: [
          interact.modifiers.aspectRatio({
            ratio: "preserve",
          }),
          interact.modifiers.restrictSize({
            min: { width: 25, height: 25 },
          }),
          interact.modifiers.restrictEdges({
            outer: "parent",
          }),
        ],
        listeners: {
          move(event) {
            const target = event.target as HTMLElement;
            let x = parseFloat(target.getAttribute("data-x") || "0");
            let y = parseFloat(target.getAttribute("data-y") || "0");

            x += event.deltaRect.left;
            y += event.deltaRect.top;

            target.style.width = `${event.rect.width}px`;
            target.style.height = `${event.rect.height}px`;
            target.style.left = `${x}px`;
            target.style.top = `${y}px`;
            target.setAttribute("data-x", String(x));
            target.setAttribute("data-y", String(y));

            const id = target.getAttribute("data-id");
            if (id) {
              callbacksRef.current.handleResize(
                id,
                x,
                y,
                event.rect.width,
                event.rect.height
              );
            }
          },
          end(event) {
            const target = event.target as HTMLElement;
            const x = parseFloat(target.getAttribute("data-x") || "0");
            const y = parseFloat(target.getAttribute("data-y") || "0");
            const w = parseFloat(target.style.width);
            const h = parseFloat(target.style.height);
            const id = target.getAttribute("data-id");
            if (id) {
              callbacksRef.current.handleResize(id, x, y, w, h, true);
            }
          },
        },
      })
      .on("tap", (event) => {
        const target = event.target as HTMLElement;
        const id = target.getAttribute("data-id");
        if (id) {
          callbacksRef.current.selectImage(id);
        }
      });

    return () => {
      interactable.unset();
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      selectImage(null);
    }
  };

  return (
    <div id="canvas" onClick={handleCanvasClick}>
      {images.map((img) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          id={`img-${img.id}`}
          data-id={img.id}
          data-x={img.x}
          data-y={img.y}
          src={`${API_URL}/uploads/${img.id}`}
          alt=""
          draggable={false}
          className={selectedId === img.id ? "selected" : ""}
          style={{
            left: `${img.x}px`,
            top: `${img.y}px`,
            width: `${img.width}px`,
            height: `${img.height}px`,
            zIndex: img.zIndex,
          }}
        />
      ))}
    </div>
  );
}
