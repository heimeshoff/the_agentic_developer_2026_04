"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-text px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
    >
      {pending ? "…" : children}
    </button>
  );
}
