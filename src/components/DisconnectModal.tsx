"use client";

export function DisconnectModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="rounded p-8 max-w-sm text-center mx-4 bg-[var(--surface)] border border-[var(--border)]">
        <h2 className="text-lg font-medium mb-2">Connection Lost</h2>
        <p className="text-sm mb-6 text-[var(--accent)]">
          Please refresh to reconnect.
        </p>
        <button onClick={() => location.reload()} className="toolbar-btn">
          Refresh
        </button>
      </div>
    </div>
  );
}
