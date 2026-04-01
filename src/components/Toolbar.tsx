"use client";

import { useRef, useState } from "react";

interface ToolbarProps {
  selectedId: string | null;
  userCount: number;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => void;
  onDeleteAll: () => void;
  onToFront: () => void;
  onToBack: () => void;
}

export function Toolbar({
  selectedId,
  userCount,
  onUpload,
  onDelete,
  onDeleteAll,
  onToFront,
  onToBack,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      // upload failed silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const hasFile = typeof window !== "undefined" && fileInputRef.current?.files?.length;

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white border border-gray-300 rounded-lg px-4 py-3 shadow-sm w-[900px]">
      {/* Upload */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="text-sm file:mr-2 file:py-1 file:px-3 file:border-0 file:rounded file:bg-blue-500 file:text-white file:cursor-pointer file:text-sm hover:file:bg-blue-600"
          onChange={() => setUploading(false)}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Actions (when image selected) */}
      {selectedId && (
        <div className="flex items-center gap-2">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          ) : (
            <span className="flex items-center gap-1 text-sm">
              Are you sure?
              <button
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
              >
                No
              </button>
            </span>
          )}
          <button
            onClick={onToFront}
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            To Front
          </button>
          <button
            onClick={onToBack}
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            To Back
          </button>
        </div>
      )}

      {selectedId && <div className="w-px h-6 bg-gray-300" />}

      {/* Delete All */}
      {!confirmDeleteAll ? (
        <button
          onClick={() => setConfirmDeleteAll(true)}
          className="px-3 py-1 text-sm bg-red-700 text-white rounded hover:bg-red-800"
        >
          Delete All
        </button>
      ) : (
        <span className="flex items-center gap-1 text-sm">
          Delete all images?
          <button
            onClick={() => {
              onDeleteAll();
              setConfirmDeleteAll(false);
            }}
            className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-800"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmDeleteAll(false)}
            className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
          >
            No
          </button>
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User count */}
      <div className="text-sm text-gray-500">
        {userCount} {userCount === 1 ? "user" : "users"} online
      </div>
    </div>
  );
}
