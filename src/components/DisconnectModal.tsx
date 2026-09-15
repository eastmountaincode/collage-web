"use client";

export function DisconnectModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="p-8 max-w-sm text-center mx-4 bg-[var(--panel)] border border-[var(--border)]">
        <h2 className="text-lg font-medium mb-2">Connection Lost</h2>
        <p className="text-sm mb-6 text-[var(--accent)]">
          Please refresh to reconnect.
        </p>
        <button type="button" onClick={() => location.reload()} className="native-button">
          Refresh
        </button>
      </div>
    </div>
  );
}
