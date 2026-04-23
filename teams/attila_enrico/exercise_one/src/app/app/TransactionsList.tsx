"use client";

import { useState, useTransition } from "react";
import type { Transaction } from "@/lib/db";
import { formatAmount } from "@/lib/currencies";
import {
  deleteTransactionAction,
  restoreTransactionAction,
} from "@/actions/transactions";
import { EditTransactionModal } from "./EditTransactionModal";
import { UndoToast } from "./UndoToast";
import { formatDate } from "./formatDate";

interface TransactionsListProps {
  transactions: Transaction[];
  currency: string;
}

interface ToastState {
  transactionId: string;
}

const NOT_AVAILABLE_MESSAGE = "This transaction is no longer available.";

function PencilIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" />
    </svg>
  );
}

function TrashIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 6h12" />
      <path d="M8 6V4h4v2" />
      <path d="M6 6l1 10h6l1-10" />
    </svg>
  );
}

function addId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.add(id);
  return next;
}

function removeId(set: Set<string>, id: string): Set<string> {
  if (!set.has(id)) return set;
  const next = new Set(set);
  next.delete(id);
  return next;
}

export function TransactionsList({
  transactions,
  currency,
}: TransactionsListProps): React.ReactElement {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const editingTransaction =
    editingId != null
      ? (transactions.find((t) => t.id === editingId) ?? null)
      : null;

  const visible = transactions.filter((t) => !hiddenIds.has(t.id));

  const handleDelete = (tx: Transaction): void => {
    // Optimistic hide first, then fire server action.
    setInlineError(null);
    setHiddenIds((prev) => addId(prev, tx.id));
    // Replace any in-flight toast with a fresh one for this deletion (no queue).
    setToast({ transactionId: tx.id });

    startTransition(async () => {
      const result = await deleteTransactionAction(tx.id);
      if (!result.ok) {
        // Roll back the optimistic hide and surface a non-blocking message.
        setHiddenIds((prev) => removeId(prev, tx.id));
        setToast((current) =>
          current && current.transactionId === tx.id ? null : current,
        );
        setInlineError(NOT_AVAILABLE_MESSAGE);
      }
    });
  };

  const handleUndo = (transactionId: string): void => {
    // Optimistically restore and clear the toast immediately.
    setHiddenIds((prev) => removeId(prev, transactionId));
    setToast(null);
    setInlineError(null);

    startTransition(async () => {
      const result = await restoreTransactionAction(transactionId);
      if (!result.ok) {
        // Race: the row is no longer restorable. Put it back under the
        // optimistic hide and surface the generic message.
        setHiddenIds((prev) => addId(prev, transactionId));
        setInlineError(NOT_AVAILABLE_MESSAGE);
      }
    });
  };

  const handleToastDismiss = (): void => {
    setToast(null);
  };

  const handleEdit = (id: string): void => {
    setInlineError(null);
    setEditingId(id);
  };

  const handleEditClose = (): void => {
    setEditingId(null);
  };

  if (transactions.length === 0 && visible.length === 0) {
    return (
      <>
        {inlineError != null && (
          <p
            role="status"
            aria-live="polite"
            className="mb-2 text-sm text-expense"
          >
            {inlineError}
          </p>
        )}
        <p className="text-sm text-muted">
          No transactions yet — add your first one.
        </p>
        {toast != null && (
          <UndoToast
            key={toast.transactionId}
            message="Transaction deleted"
            onUndo={() => handleUndo(toast.transactionId)}
            onDismiss={handleToastDismiss}
          />
        )}
      </>
    );
  }

  return (
    <>
      {inlineError != null && (
        <p
          role="status"
          aria-live="polite"
          className="mb-2 text-sm text-expense"
        >
          {inlineError}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted">
          No transactions yet — add your first one.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {visible.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{t.title}</p>
                <p className="text-xs text-muted">
                  {t.category} · {formatDate(t.timestamp)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p
                  className={
                    "font-medium " +
                    (t.kind === "expense" ? "text-expense" : "text-income")
                  }
                >
                  {t.kind === "expense" ? "−" : "+"}
                  {formatAmount(t.amount, currency)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(t.id)}
                    aria-label={`Edit ${t.title}`}
                    className="rounded p-1.5 text-muted hover:bg-border/40 hover:text-text focus:outline-none focus:ring-2 focus:ring-text"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    aria-label={`Delete ${t.title}`}
                    className="rounded p-1.5 text-muted hover:bg-border/40 hover:text-expense focus:outline-none focus:ring-2 focus:ring-expense"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingTransaction != null && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={handleEditClose}
        />
      )}

      {toast != null && (
        <UndoToast
          key={toast.transactionId}
          message="Transaction deleted"
          onUndo={() => handleUndo(toast.transactionId)}
          onDismiss={handleToastDismiss}
        />
      )}
    </>
  );
}
