"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addTransactionAction, updateTransactionAction } from "@/actions/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionKind } from "@/lib/categories";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/actions/auth";
import type { Transaction } from "@/lib/db";

const initial: FormState = { ok: false };

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowLocalInput();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface TransactionFormProps {
  mode: "add" | "edit";
  initial?: Transaction;
  onSuccess?: () => void;
}

export function TransactionForm({ mode, initial: initialTx, onSuccess }: TransactionFormProps) {
  const initialKind: TransactionKind =
    mode === "edit" && initialTx ? initialTx.kind : "expense";
  const [kind, setKind] = useState<TransactionKind>(initialKind);
  // When user flips `kind`, clear the category selection so they must re-pick.
  // Seed with the initial category only on first render for edit mode.
  const [category, setCategory] = useState<string>(
    mode === "edit" && initialTx ? initialTx.category : "",
  );

  const categories = useMemo(
    () => (kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [kind],
  );

  const action = mode === "add" ? addTransactionAction : updateTransactionAction;
  const [state, formAction] = useActionState(action, initial);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const handleKindChange = (next: TransactionKind): void => {
    if (next === kind) return;
    setKind(next);
    setCategory("");
  };

  const titleDefault = mode === "edit" && initialTx ? initialTx.title : undefined;
  const amountDefault =
    mode === "edit" && initialTx ? String(initialTx.amount) : undefined;
  const timestampDefault =
    mode === "edit" && initialTx ? isoToLocalInput(initialTx.timestamp) : nowLocalInput();

  const submitLabel = mode === "add" ? "Add transaction" : "Save changes";
  const successLabel = mode === "add" ? "Added ✓" : "Saved ✓";

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      {mode === "edit" && initialTx ? (
        <input type="hidden" name="id" value={initialTx.id} />
      ) : null}

      <div className="flex gap-2">
        {(["expense", "income"] as TransactionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKindChange(k)}
            className={
              "flex-1 rounded px-3 py-1 text-sm " +
              (k === kind
                ? "bg-text text-surface"
                : "border border-border bg-surface text-muted hover:text-text")
            }
          >
            {k === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      <FormError messages={errors._form} />

      <Field label="Title" name="title" required defaultValue={titleDefault} errors={errors.title} />
      <Field
        label="Amount"
        name="amount"
        type="number"
        step="0.01"
        required
        defaultValue={amountDefault}
        errors={errors.amount}
      />
      <Field
        label="When"
        name="timestamp"
        type="datetime-local"
        required
        defaultValue={timestampDefault}
        errors={errors.timestamp}
      />
      <Field label="Category" name="category" errors={errors.category}>
        <select
          id="field-category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded border border-border bg-surface px-3 py-2"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <SubmitButton>{submitLabel}</SubmitButton>
      {state.ok ? <p className="text-center text-xs text-income">{successLabel}</p> : null}
    </form>
  );
}
