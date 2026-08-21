import { useEffect, useRef, useCallback } from "react";
import { MIN_SIZE, type DragState, type PinchState } from "@/lib/canvas-types";
import {
  screenToCanvas, screenDeltaToCanvas,
  getZone, cursorForZone, writeEl, dist, angle, getPinchTransform,
} from "@/lib/canvas-utils";

interface GestureCallbacks {
  selectImage: (id: string) => void;
  handleTransform: (
    id: string, x: number, y: number, w: number, h: number,
    rotation: number, final?: boolean
  ) => void;
}

export function useCanvasGestures(callbacks: GestureCallbacks) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);

  const findImg = useCallback((target: EventTarget | null, canvas: HTMLElement): HTMLElement | null => {
    let el = target as HTMLElement | null;
    while (el && el !== canvas) {
      if (el.tagName === "IMG" && el.getAttribute("data-id")) return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    const getRect = () => canvas.getBoundingClientRect();

    // --- Read image state from data attributes (only on gesture start) ---
    const readImg = (el: HTMLElement) => {
      const x = parseFloat(el.getAttribute("data-x") || "0");
      const y = parseFloat(el.getAttribute("data-y") || "0");
      const w = parseFloat(el.style.width) || 100;
      const h = parseFloat(el.style.height) || 100;
      const m = (el.style.transform || "").match(/rotate\(([-\d.]+)deg\)/);
      const rot = m ? parseFloat(m[1]) : 0;
      return { x, y, w, h, rot };
    };

    // --- Cursor on hover (desktop) ---
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current) return;
      const img = findImg(e.target, canvas);
      if (!img) return;
      const s = readImg(img);
      const pt = screenToCanvas(e.clientX, e.clientY, getRect());
      const zone = getZone(pt.x, pt.y, s.x, s.y, s.w, s.h, s.rot);
      img.style.cursor = cursorForZone(zone);
    };

    // --- Pointer down ---
    const onDown = (e: PointerEvent) => {
      const img = findImg(e.target, canvas);
      if (!img) return;
      e.preventDefault();

      const id = img.getAttribute("data-id")!;
      const locked = img.getAttribute("data-locked") === "true";
      const s = readImg(img);

      // Locked images: allow tap to select, but block drag/resize/rotate
      if (locked) {
        // Track for tap detection only
        const downTime = Date.now();
        const downX = e.clientX;
        const downY = e.clientY;
        const onTapUp = (upE: PointerEvent) => {
          if (Date.now() - downTime < 300 && Math.abs(upE.clientX - downX) < 10 && Math.abs(upE.clientY - downY) < 10) {
            cbRef.current.selectImage(id);
          }
          img.removeEventListener("pointerup", onTapUp);
        };
        img.addEventListener("pointerup", onTapUp);
        img.setPointerCapture(e.pointerId);
        return;
      }

      // Touch: add to pinch state
      if (pinchRef.current && pinchRef.current.imageId === id) {
        const pinch = pinchRef.current;
        pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch.pointers.size === 2) {
          const pts = Array.from(pinch.pointers.values());
          pinch.startDist = dist(pts[0], pts[1]);
          pinch.startAngle = angle(pts[0], pts[1]);
          const midpoint = screenToCanvas(
            (pts[0].x + pts[1].x) / 2,
            (pts[0].y + pts[1].y) / 2,
            getRect()
          );
          pinch.startMidX = midpoint.x;
          pinch.startMidY = midpoint.y;
          pinch.snapX = pinch.x;
          pinch.snapY = pinch.y;
          pinch.snapW = pinch.w;
          pinch.snapH = pinch.h;
          pinch.snapRot = pinch.rot;
        }
        img.setPointerCapture(e.pointerId);
        return;
      }

      if (e.pointerType === "touch") {
        const p = new Map<number, { x: number; y: number }>();
        p.set(e.pointerId, { x: e.clientX, y: e.clientY });
        pinchRef.current = {
          imageId: id, el: img, pointers: p,
          x: s.x, y: s.y, w: s.w, h: s.h, rot: s.rot,
          startDist: 0, startAngle: 0, startMidX: 0, startMidY: 0,
          snapX: s.x, snapY: s.y, snapW: s.w, snapH: s.h, snapRot: s.rot,
          moved: false, downTime: Date.now(),
        };
      } else {
        // Desktop: zone-based
        const pt = screenToCanvas(e.clientX, e.clientY, getRect());
        const zone = getZone(pt.x, pt.y, s.x, s.y, s.w, s.h, s.rot);

        const imgRect = img.getBoundingClientRect();
        const centerScreenX = imgRect.left + imgRect.width / 2;
        const centerScreenY = imgRect.top + imgRect.height / 2;

        dragRef.current = {
          imageId: id, el: img, zone,
          prevScreenX: e.clientX, prevScreenY: e.clientY,
          x: s.x, y: s.y, w: s.w, h: s.h, rot: s.rot,
          startRot: s.rot,
          centerScreenX, centerScreenY,
          startPointerAngle: Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX) * (180 / Math.PI),
          aspect: s.w / s.h,
          downTime: Date.now(), moved: false,
        };
        img.style.cursor = zone === "move" ? "grabbing" : cursorForZone(zone);
      }

      img.setPointerCapture(e.pointerId);
    };

    // --- Pointer move ---
    const onMove = (e: PointerEvent) => {
      // Touch path
      const pinch = pinchRef.current;
      if (pinch && pinch.pointers.has(e.pointerId)) {
        handlePinchMove(pinch, e, getRect());
        return;
      }
      // Desktop path
      const drag = dragRef.current;
      if (drag) handleDragMove(drag, e, getRect());
    };

    // --- Pointer up ---
    const onUp = (e: PointerEvent) => {
      const pinch = pinchRef.current;
      if (pinch && pinch.pointers.has(e.pointerId)) {
        handlePinchUp(pinch, e);
        return;
      }
      const drag = dragRef.current;
      if (drag) handleDragUp(drag);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [findImg]);

  // ---- Desktop drag ----

  function handleDragMove(d: DragState, e: PointerEvent, rect: DOMRect) {
    const { dx, dy } = screenDeltaToCanvas(
      e.clientX - d.prevScreenX,
      e.clientY - d.prevScreenY,
      rect
    );
    d.prevScreenX = e.clientX;
    d.prevScreenY = e.clientY;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) d.moved = true;

    if (d.zone === "move") {
      d.x += dx;
      d.y += dy;
    } else if (d.zone.startsWith("rotate")) {
      const cur = Math.atan2(
        e.clientY - d.centerScreenY,
        e.clientX - d.centerScreenX
      ) * (180 / Math.PI);
      d.rot = d.startRot + (cur - d.startPointerAngle);
    } else {
      // Resize from edge, maintain aspect ratio
      if (d.zone === "e") { d.w += dx; }
      else if (d.zone === "w") { d.w -= dx; d.x += dx; }
      else if (d.zone === "s") { d.h += dy; }
      else if (d.zone === "n") { d.h -= dy; d.y += dy; }

      if (d.zone === "e" || d.zone === "w") d.h = d.w / d.aspect;
      else d.w = d.h * d.aspect;

      // Only enforce min size
      if (d.w < MIN_SIZE) { d.w = MIN_SIZE; d.h = d.w / d.aspect; }
      if (d.h < MIN_SIZE) { d.h = MIN_SIZE; d.w = d.h * d.aspect; }
    }

    writeEl(d.el, d.x, d.y, d.w, d.h, d.rot);
    cbRef.current.handleTransform(d.imageId, d.x, d.y, d.w, d.h, d.rot);
  }

  function handleDragUp(d: DragState) {
    if (!d.moved && Date.now() - d.downTime < 300) {
      cbRef.current.selectImage(d.imageId);
    } else {
      cbRef.current.handleTransform(d.imageId, d.x, d.y, d.w, d.h, d.rot, true);
    }
    d.el.style.cursor = "grab";
    dragRef.current = null;
  }

  // ---- Touch pinch/drag ----

  function handlePinchMove(p: PinchState, e: PointerEvent, rect: DOMRect) {
    if (p.pointers.size === 1) {
      const prev = p.pointers.get(e.pointerId)!;
      const { dx, dy } = screenDeltaToCanvas(
        e.clientX - prev.x,
        e.clientY - prev.y,
        rect
      );
      p.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) p.moved = true;

      p.x += dx;
      p.y += dy;
      writeEl(p.el, p.x, p.y, p.w, p.h, p.rot);
      cbRef.current.handleTransform(p.imageId, p.x, p.y, p.w, p.h, p.rot);
    } else if (p.pointers.size === 2) {
      p.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      p.moved = true;

      const pts = Array.from(p.pointers.values());
      const scale = p.startDist > 0 ? dist(pts[0], pts[1]) / p.startDist : 1;
      const angleDelta = angle(pts[0], pts[1]) - p.startAngle;
      const midpoint = screenToCanvas(
        (pts[0].x + pts[1].x) / 2,
        (pts[0].y + pts[1].y) / 2,
        rect
      );

      const transform = getPinchTransform(
        { x: p.snapX, y: p.snapY, w: p.snapW, h: p.snapH, rot: p.snapRot },
        { x: p.startMidX, y: p.startMidY },
        midpoint,
        scale,
        angleDelta
      );

      p.x = transform.x;
      p.y = transform.y;
      p.w = transform.w;
      p.h = transform.h;
      p.rot = transform.rot;

      writeEl(p.el, p.x, p.y, p.w, p.h, p.rot);
      cbRef.current.handleTransform(p.imageId, p.x, p.y, p.w, p.h, p.rot);
    }
  }

  function handlePinchUp(p: PinchState, e: PointerEvent) {
    p.pointers.delete(e.pointerId);

    if (p.pointers.size === 0) {
      if (!p.moved && Date.now() - p.downTime < 300) {
        cbRef.current.selectImage(p.imageId);
      } else {
        cbRef.current.handleTransform(p.imageId, p.x, p.y, p.w, p.h, p.rot, true);
      }
      pinchRef.current = null;
    } else if (p.pointers.size === 1) {
      // Transitioned from 2 fingers to 1 — re-snapshot for continued drag
      p.snapX = p.x; p.snapY = p.y;
      p.snapW = p.w; p.snapH = p.h;
      p.snapRot = p.rot;
    }
  }
}
