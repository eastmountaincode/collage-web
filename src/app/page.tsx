"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useCollage } from "@/hooks/useCollage";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";
import { DisconnectModal } from "@/components/DisconnectModal";

export default function Home() {
  const collage = useCollage();
  const [displayMode, setDisplayMode] = useState(false);

  // Deselect when clicking/tapping anywhere outside the canvas or toolbar
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Don't deselect if clicking inside the canvas or a toolbar button
      if (target.closest("#canvas") || target.closest("[data-toolbar]")) return;
      collage.selectImage(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [collage]);

  const selectedImage = collage.selectedId
    ? collage.images.find((i) => i.id === collage.selectedId)
    : null;

  const toolbarProps = {
    selectedId: collage.selectedId,
    selectedLocked: selectedImage?.locked ?? false,
    userCount: collage.userCount,
    onUpload: collage.uploadImage,
    onDelete: collage.deleteImage,
    onDeleteAll: collage.deleteAll,
    onToFront: collage.sendToFront,
    onToBack: collage.sendToBack,
    onToggleLock: collage.toggleLock,
    onScreenshot: collage.takeScreenshot,
    onDisplayMode: () => setDisplayMode(true),
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-4 sm:gap-6 mb-6">
        <div className="text-center">
          <h1
            className="text-4xl sm:text-6xl tracking-wide mb-1"
            style={{ fontFamily: "Pyxis, serif" }}
          >
            Body Language
          </h1>
          {/* <p className="text-sm tracking-[0.1em] text-[var(--accent)]">
            A Collaborative Collage
          </p> */}
        </div>
        <QRCode
          value="https://collage.andrew-boylan.com"
          size={80}
          level="M"
          fgColor="var(--foreground)"
          bgColor="transparent"
        />
      </div>

      {/* Main content: single Canvas, with optional side panel on desktop */}
      <div className="w-full flex flex-col sm:flex-row gap-4 items-center sm:items-start sm:justify-center">
        {/* Desktop side panel (hidden on mobile or in display mode) */}
        {!displayMode && (
          <div className="hidden sm:block">
            <Toolbar {...toolbarProps} />
          </div>
        )}

        {/* Single Canvas instance for all viewports */}
        <Canvas
          images={collage.images}
          selectedId={displayMode ? null : collage.selectedId}
          selectImage={displayMode ? () => {} : collage.selectImage}
          handleTransform={displayMode ? () => {} : collage.handleTransform}
        />
      </div>

      {/* Display mode exit button */}
      {displayMode && (
        <button
          onClick={() => setDisplayMode(false)}
          className="fixed top-4 right-4 text-xs px-3 py-1.5 rounded bg-[var(--surface)] text-[var(--accent)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] transition-colors border border-[var(--border)] cursor-pointer z-50"
        >
          Exit Display
        </button>
      )}

      {/* Mobile floating toolbar */}
      {!displayMode && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[var(--surface)] border-t border-[var(--border)] p-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <Toolbar {...toolbarProps} mobile />
        </div>
      )}

      {/* Bottom spacer on mobile for floating toolbar */}
      <div className="h-28 sm:hidden" />

      {!collage.isConnected && <DisconnectModal />}
    </main>
  );
}
