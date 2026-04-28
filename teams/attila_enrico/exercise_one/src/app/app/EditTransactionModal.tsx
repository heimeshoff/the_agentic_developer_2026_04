"use client";

import { useEffect, useId, useRef } from "react";
import { TransactionForm } from "./TransactionForm";
import type { Transaction } from "@/lib/db";

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export function EditTransactionModal({
  transaction,
  onClose,
}: EditTransactionModalProps): React.ReactElement {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Track the element that was focused before the modal opened so we can
  // restore focus to it on unmount (basic accessibility contract).
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    // Move focus into the dialog on mount. Focus the heading (which is
    // tabIndex=-1) so screen readers announce the dialog title.
    headingRef.current?.focus();

    return () => {
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === "function") {
        prev.focus();
      }
    };
  }, []);

  const handleBackdropMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
  ): void => {
    // Only close when the mousedown originated on the backdrop itself, not on
    // a child (the panel). Clicks inside the panel stop propagation below.
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePanelMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
  ): void => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const focusable = getFocusableElements(panel);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || active === panel || !panel.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onMouseDown={handleBackdropMouseDown}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        ref={panelRef}
        onMouseDown={handlePanelMouseDown}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl"
      >
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="mb-4 text-lg font-semibold outline-none"
        >
          Edit transaction
        </h2>
        <TransactionForm
          mode="edit"
          initial={transaction}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
}
