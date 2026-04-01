"use client";

import { useCollage } from "@/hooks/useCollage";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";
import { DisconnectModal } from "@/components/DisconnectModal";

export default function Home() {
  const collage = useCollage();

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center gap-4 py-8">
      <h1 className="text-4xl" style={{ fontFamily: "Pyxis, serif" }}>Body Language</h1>
      <p className="text-gray-600">a collaborative collage</p>
      <Toolbar
        selectedId={collage.selectedId}
        userCount={collage.userCount}
        onUpload={collage.uploadImage}
        onDelete={collage.deleteImage}
        onDeleteAll={collage.deleteAll}
        onToFront={collage.sendToFront}
        onToBack={collage.sendToBack}
      />
      <Canvas
        images={collage.images}
        selectedId={collage.selectedId}
        selectImage={collage.selectImage}
        handleMove={collage.handleMove}
        handleResize={collage.handleResize}
      />
      {!collage.isConnected && <DisconnectModal />}
    </main>
  );
}
