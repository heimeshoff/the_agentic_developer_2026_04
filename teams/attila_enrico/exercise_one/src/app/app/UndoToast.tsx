"use client";

import { useEffect } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export function UndoToast({
  message,
  onUndo,
  onDismiss,
  durationMs = 8000,
}: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [durationMs, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-text px-4 py-3 text-sm text-surface shadow-lg"
    >
      <span className="truncate">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="rounded px-2 py-1 text-sm font-medium text-surface underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-surface"
      >
        Undo
      </button>
    </div>
  );
}
