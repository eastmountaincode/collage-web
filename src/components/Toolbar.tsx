"use client";

import { useRef, useState, type ReactNode } from "react";
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
  desktopHeader?: ReactNode;
}

const btn = "flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded cursor-pointer whitespace-nowrap text-center transition-colors hover:bg-[var(--hover)] hover:border-[var(--hover-border)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface)] disabled:hover:border-[var(--border)]";
const btnFull = `${btn} w-full`;
const btnDanger = `${btn} hover:bg-[var(--danger-hover)] hover:border-[var(--danger-border)]`;
const btnDangerFull = `${btnDanger} w-full`;
const btnYes = `${btn} bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]`;
const btnNo = `${btn}`;
const labelCls = "text-[11px] tracking-[0.1em] text-[var(--accent)] mb-2";
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
  desktopHeader,
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
        <div className="flex items-center gap-1 min-[360px]:gap-2">
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
        <div className="flex items-center gap-1 min-[360px]:gap-2">
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
          <span className="flex items-center gap-1 text-xs px-0.5 min-[360px]:px-1 text-[var(--accent)] whitespace-nowrap">
            <Users size={12} />
            {userCount}<span className="hidden min-[360px]:inline"> online</span>
          </span>
        </div>
      </div>
    );
  }

  // Desktop — vertical side panel
  return (
    <div data-toolbar className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 w-[200px] max-h-[calc(100vh-3rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 shadow-sm">
      {hiddenInput}

      {desktopHeader && (
        <div className="flex justify-center pb-3 mb-3 border-b border-[var(--border)]">
          {desktopHeader}
        </div>
      )}

      <Section>
        <div className={labelCls}>Add Image</div>
        <button onClick={handleFileSelect} disabled={uploading} className={btnFull}>
          <ImagePlus size={ICON} />
          {uploading ? "Uploading..." : "Choose File"}
        </button>
      </Section>

      <Section divided>
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

      <Section divided>
        <div className={labelCls}>Status</div>
        <span className="flex items-center gap-1.5 text-sm text-[var(--accent)]">
          <Users size={14} />
          {userCount} {userCount === 1 ? "user" : "users"} online
        </span>
      </Section>

      <div>
        <button
          onClick={() => setShowAbout(!showAbout)}
          aria-expanded={showAbout}
          className="flex items-center gap-1 text-xs cursor-pointer text-[var(--accent)] bg-transparent border-none p-0"
        >
          <Info size={12} />
          About / How To {showAbout ? "\u25B2" : "\u25BC"}
        </button>
        {showAbout && (
          <div className="text-xs mt-3 leading-relaxed text-[var(--accent)]">
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Body Language</strong>{' '}is a collaborative collage.
              Add, move, and resize images. You&apos;ll see other users&apos; interactions in real time.
            </p>
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Adding:</strong>{' '}Tap &quot;Choose File&quot; to upload.
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
            <p className="mb-2">
              <strong className="text-[var(--foreground)]">Tip:</strong>{' '}Search for &quot;transparent PNG&quot; images for best results.
            </p>
            <div className="pt-3 mt-3 border-t border-[var(--border)]">
              <p className="mb-2 text-[var(--foreground)]">Made by Andrew</p>
              <div className="flex items-center gap-2">
                <SocialLink href="https://www.instagram.com/ndrewboylan/" label="Andrew on Instagram">
                  <InstagramIcon />
                </SocialLink>
                <SocialLink href="https://www.linkedin.com/in/andrew-boylan-92842810a/" label="Andrew on LinkedIn">
                  <LinkedInIcon />
                </SocialLink>
                <SocialLink href="https://github.com/eastmountaincode" label="Andrew on GitHub">
                  <GitHubIcon />
                </SocialLink>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center size-8 rounded border border-[var(--border)] text-[var(--accent)] transition-colors hover:text-[var(--foreground)] hover:bg-[var(--hover)] hover:border-[var(--hover-border)]"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M7.03.084c-1.277.06-2.149.264-2.911.563-.789.308-1.458.72-2.123 1.388C1.33 2.703.92 3.372.615 4.162.32 4.926.12 5.799.063 7.076.007 8.354-.006 8.764 0 12.023c.006 3.259.021 3.667.083 4.947.061 1.277.264 2.148.564 2.911.308.789.72 1.457 1.388 2.123.668.665 1.336 1.074 2.128 1.38.763.295 1.636.496 2.913.552 1.277.056 1.688.069 4.946.063 3.258-.006 3.668-.021 4.948-.081 1.28-.061 2.147-.265 2.91-.564.789-.308 1.458-.72 2.123-1.388.665-.668 1.074-1.338 1.38-2.128.295-.763.496-1.636.551-2.912.056-1.281.069-1.69.063-4.948-.006-3.258-.021-3.667-.082-4.947-.061-1.28-.264-2.149-.563-2.912-.308-.789-.72-1.457-1.388-2.123C21.298 1.33 20.628.921 19.838.617 19.074.321 18.202.12 16.924.065 15.647.009 15.236-.005 11.977.001 8.718.008 8.31.022 7.03.084Zm.14 21.693c-1.17-.051-1.805-.245-2.228-.408-.561-.216-.96-.477-1.382-.895-.422-.418-.681-.819-.9-1.378-.164-.424-.362-1.058-.417-2.228-.06-1.265-.072-1.644-.079-4.848-.007-3.204.005-3.583.061-4.848.05-1.169.245-1.805.408-2.228.216-.561.476-.96.895-1.382.419-.421.818-.681 1.378-.9.423-.165 1.058-.361 2.227-.417 1.266-.06 1.645-.072 4.848-.079 3.203-.007 3.584.005 4.85.061 1.169.051 1.805.244 2.228.408.561.216.96.475 1.382.895.421.419.681.818.9 1.379.165.421.362 1.056.417 2.226.06 1.266.074 1.645.08 4.848.005 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.806-.408 2.229-.216.56-.476.96-.896 1.381-.419.422-.818.681-1.378.9-.422.165-1.058.362-2.226.417-1.266.06-1.645.072-4.849.079-3.204.007-3.583-.006-4.848-.061Zm9.783-17.191a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442ZM5.839 12.012c.006 3.403 2.77 6.156 6.172 6.149 3.403-.006 6.157-2.77 6.151-6.173-.007-3.403-2.771-6.156-6.174-6.15-3.403.007-6.156 2.771-6.15 6.174ZM8 12.008A4 4 0 1 1 12.008 16 4 4 0 0 1 8 12.008Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 448 512" aria-hidden="true" className="size-4 fill-current">
      <path d="M100.3 448H7.4V148.9h92.9V448ZM53.8 108.1C24.1 108.1 0 83.5 0 53.8 0 39.5 5.7 25.9 15.8 15.8S39.6 0 53.8 0s27.9 5.7 38 15.8 15.8 23.8 15.8 38c0 29.7-24.1 54.3-53.8 54.3ZM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448h-.1Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297Z" />
    </svg>
  );
}

function Section({ children, divided = false }: { children: React.ReactNode; divided?: boolean }) {
  return (
    <div className={`pb-2 mb-2 ${divided ? "border-b border-[var(--border)]" : ""}`}>
      {children}
    </div>
  );
}
