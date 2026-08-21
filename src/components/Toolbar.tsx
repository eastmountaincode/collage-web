"use client";

import { useRef, useState } from "react";
import {
  ImagePlus, Trash2, ArrowUpToLine, ArrowDownToLine,
  Lock, Unlock, Camera, Monitor, Eraser, Users, Info,
} from "lucide-react";

interface ToolbarProps {
  selectedId: string | null;
  selectedLocked?: boolean;
  userCount: number;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => void;
  onDeleteAll: () => void;
  onToFront: () => void;
  onToBack: () => void;
  onToggleLock: () => void;
  onScreenshot: () => void;
  onDisplayMode?: () => void;
  mobile?: boolean;
}

const btn = "flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded cursor-pointer whitespace-nowrap text-center transition-colors hover:bg-[#2a2a2a] hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface)] disabled:hover:border-[var(--border)]";
const btnFull = `${btn} w-full`;
const btnDanger = `${btn} hover:bg-[#2a1515] hover:border-[#633]`;
const btnDangerFull = `${btnDanger} w-full`;
const btnYes = `${btn} bg-[#2a1a1a] border-[#633] text-[#f99]`;
const btnNo = `${btn}`;
const labelCls = "text-[11px] uppercase tracking-[0.1em] text-[var(--accent)] mb-2";
const ICON = 14;

export function Toolbar({
  selectedId,
  selectedLocked,
  userCount,
  onUpload,
  onDelete,
  onDeleteAll,
  onToFront,
  onToBack,
  onToggleLock,
  onScreenshot,
  onDisplayMode,
  mobile,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      // upload failed
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hiddenInput = (
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
  );

  if (mobile) {
    return (
      <div data-toolbar className="flex flex-col gap-2.5 py-1">
        {hiddenInput}

        {/* Row 1: Upload + Delete + Lock */}
        <div className="flex items-center gap-2">
          <button onClick={handleFileSelect} disabled={uploading} className={`${btn} flex-1`}>
            <ImagePlus size={ICON} />
            {uploading ? "..." : "Add"}
          </button>
          <button onClick={onDelete} disabled={!selectedId} className={`${btnDanger} flex-1`}>
            <Trash2 size={ICON} />
            Delete
          </button>
          <button onClick={onToggleLock} disabled={!selectedId} className={`${btn} flex-1`}>
            {selectedLocked ? <Lock size={ICON} /> : <Unlock size={ICON} />}
            {selectedLocked ? "Unlock" : "Lock"}
          </button>
        </div>

        {/* Row 2: Layer + Screenshot + Users */}
        <div className="flex items-center gap-2">
          <button onClick={onToFront} disabled={!selectedId} className={`${btn} flex-1`}>
            <ArrowUpToLine size={ICON} />
            Front
          </button>
          <button onClick={onToBack} disabled={!selectedId} className={`${btn} flex-1`}>
            <ArrowDownToLine size={ICON} />
            Back
          </button>
          <button onClick={onScreenshot} className={`${btn} flex-1`}>
            <Camera size={ICON} />
            Save
          </button>
          <span className="flex items-center gap-1 text-xs px-1 text-[var(--accent)] whitespace-nowrap">
            <Users size={12} />
            {userCount} online
          </span>
        </div>
      </div>
    );
  }

  // Desktop — vertical side panel
  return (
    <div data-toolbar className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 w-[200px] shrink-0">
      {hiddenInput}

      <Section>
        <div className={labelCls}>Add Image</div>
        <button onClick={handleFileSelect} disabled={uploading} className={btnFull}>
          <ImagePlus size={ICON} />
          {uploading ? "Uploading..." : "Choose File"}
        </button>
      </Section>

      <Section>
        <div className={labelCls}>Selected Image</div>
        <div className="flex flex-col gap-2">
          <button onClick={onDelete} disabled={!selectedId} className={btnDangerFull}>
            <Trash2 size={ICON} />
            Delete
          </button>
          <button onClick={onToFront} disabled={!selectedId} className={btnFull}>
            <ArrowUpToLine size={ICON} />
            Send to Front
          </button>
          <button onClick={onToBack} disabled={!selectedId} className={btnFull}>
            <ArrowDownToLine size={ICON} />
            Send to Back
          </button>
          <button onClick={onToggleLock} disabled={!selectedId} className={btnFull}>
            {selectedLocked ? <Lock size={ICON} /> : <Unlock size={ICON} />}
            {selectedLocked ? "Locked" : "Lock"}
          </button>
        </div>
      </Section>

      <Section>
        <div className={labelCls}>View</div>
        <div className="flex flex-col gap-2">
          <button onClick={onScreenshot} className={btnFull}>
            <Camera size={ICON} />
            Screenshot
          </button>
          {onDisplayMode && (
            <button onClick={onDisplayMode} className={btnFull}>
              <Monitor size={ICON} />
              Display Mode
            </button>
          )}
        </div>
      </Section>

      <Section>
        <div className={labelCls}>Danger Zone</div>
        {!confirmDeleteAll ? (
          <button onClick={() => setConfirmDeleteAll(true)} className={btnDangerFull}>
            <Eraser size={ICON} />
            Clear All
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[var(--accent)]">Delete all images?</span>
            <div className="flex gap-2">
              <button onClick={() => { onDeleteAll(); setConfirmDeleteAll(false); }} className={`${btnYes} flex-1`}>Yes</button>
              <button onClick={() => setConfirmDeleteAll(false)} className={`${btnNo} flex-1`}>No</button>
            </div>
          </div>
        )}
      </Section>

      <Section>
        <div className={labelCls}>Status</div>
        <span className="flex items-center gap-1.5 text-sm text-[var(--accent)]">
          <Users size={14} />
          {userCount} {userCount === 1 ? "user" : "users"} online
        </span>
      </Section>

      <div>
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="flex items-center gap-1 text-xs cursor-pointer text-[var(--accent)] bg-transparent border-none p-0"
        >
          <Info size={12} />
          About / How To {showAbout ? "\u25B2" : "\u25BC"}
        </button>
        {showAbout && (
          <div className="text-xs mt-3 leading-relaxed text-[var(--accent)]">
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Body Language</strong> is a collaborative collage.
              Add, move, and resize images — you&apos;ll see other users&apos; interactions in real time.
            </p>
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Adding:</strong> Tap &quot;Choose File&quot; to upload.
            </p>
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Moving:</strong> Drag from the center. On mobile, use one finger.
            </p>
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Resizing:</strong> Drag from edges (desktop) or pinch (mobile).
            </p>
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Rotating:</strong> Drag from corners (desktop) or two-finger twist (mobile).
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Tip:</strong> Search for &quot;transparent PNG&quot; images for best results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-3 mb-3 border-b border-[var(--border)]">
      {children}
    </div>
  );
}
