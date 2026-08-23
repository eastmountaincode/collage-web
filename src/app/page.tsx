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
    <main className="min-h-screen flex flex-col items-center px-4 py-6 md:px-6">
      {/* Wide layouts use one consistent 24px rhythm from page to sidebar to canvas. */}
      <div className={displayMode
        ? "w-full grid grid-cols-1 gap-6 items-start"
        : "w-full grid grid-cols-1 md:grid-cols-[200px_minmax(0,900px)] gap-6 items-start"
      }>
        {!displayMode && (
          <aside className="hidden md:block md:sticky md:top-6 md:self-start">
            <Toolbar
              {...toolbarProps}
              desktopHeader={(
                <a
                  href="https://collage.andrew-boylan.com"
                  aria-label="Open the collaborative collage"
                >
                  <QRCode
                    value="https://collage.andrew-boylan.com"
                    size={96}
                    level="M"
                    fgColor="var(--foreground)"
                    bgColor="transparent"
                  />
                </a>
              )}
            />
          </aside>
        )}

        {/* Single Canvas instance for all viewports */}
        <Canvas
          images={collage.images}
          selectedId={displayMode ? null : collage.selectedId}
          selectImage={displayMode ? () => {} : collage.selectImage}
          handleTransform={displayMode ? () => {} : collage.handleTransform}
          alignDesktop={displayMode ? "center" : "start"}
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
        <div data-mobile-toolbar className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[var(--surface)] border-t border-[var(--border)] p-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <Toolbar {...toolbarProps} mobile />
        </div>
      )}

      {/* Bottom spacer on mobile for floating toolbar */}
      <div className="h-28 md:hidden" />

      {!collage.isConnected && <DisconnectModal />}
    </main>
  );
}
