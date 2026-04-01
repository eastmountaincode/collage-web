"use client";

export function DisconnectModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Connection Lost</h2>
        <p className="text-gray-600 mb-6">
          Connection lost. Please refresh to reconnect.
        </p>
        <button
          onClick={() => location.reload()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
