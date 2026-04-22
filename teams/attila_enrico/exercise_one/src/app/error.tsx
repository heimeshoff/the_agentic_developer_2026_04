"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-6">
      <div className="w-full space-y-4 rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted">Try again — if it keeps failing, check the dev console.</p>
        <button onClick={() => reset()} className="rounded bg-text px-4 py-2 text-sm text-surface">
          Retry
        </button>
      </div>
    </main>
  );
}
