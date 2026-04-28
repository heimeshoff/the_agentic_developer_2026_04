"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createDemoDataAction,
  removeDemoDataAction,
} from "@/actions/demoData";

interface DemoDataButtonProps {
  hasDemoData: boolean;
}

type Feedback =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const FEEDBACK_DURATION_MS = 6000;
const REMOVE_CONFIRM_MESSAGE =
  "This will remove all demo transactions. Continue?";

export function DemoDataButton({
  hasDemoData,
}: DemoDataButtonProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Auto-dismiss feedback after a few seconds so it doesn't linger.
  useEffect(() => {
    if (feedback == null) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, FEEDBACK_DURATION_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [feedback]);

  const handleCreate = (): void => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createDemoDataAction();
      if (result.ok) {
        setFeedback({
          kind: "success",
          message: `Created ${result.count} demo transactions`,
        });
      } else {
        setFeedback({ kind: "error", message: result.message });
      }
    });
  };

  const handleRemove = (): void => {
    setFeedback(null);
    // Native confirm is sufficient for a lightweight destructive gate and
    // avoids adding any new modal/dialog component or dependency.
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(REMOVE_CONFIRM_MESSAGE)
        : false;
    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeDemoDataAction();
      if (result.ok) {
        setFeedback({
          kind: "success",
          message: `Removed ${result.count} demo transactions`,
        });
      }
    });
  };

  const handleClick = hasDemoData ? handleRemove : handleCreate;

  const idleLabel = hasDemoData ? "Remove demo data" : "Create demo data";
  const pendingLabel = hasDemoData ? "Removing…" : "Creating…";
  const label = isPending ? pendingLabel : idleLabel;

  // Match the existing button-styling vocabulary used elsewhere in
  // src/app/app: primary filled button for the constructive action, bordered
  // destructive-tinted button for the remove action.
  const className = hasDemoData
    ? "w-full rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-expense hover:bg-border/40 disabled:opacity-50"
    : "w-full rounded bg-text px-4 py-2 text-sm font-medium text-surface disabled:opacity-50";

  const feedbackClassName =
    feedback?.kind === "error"
      ? "mt-2 text-xs text-expense"
      : "mt-2 text-xs text-income";

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">
        Demo data
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        className={className}
      >
        {label}
      </button>
      {feedback != null && (
        <p role="status" aria-live="polite" className={feedbackClassName}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
