"use client";

import { useActionState, useMemo, useState } from "react";
import { addTransactionAction } from "@/actions/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionKind } from "@/lib/categories";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/actions/auth";

const initial: FormState = { ok: false };

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddTransactionForm() {
  const [kind, setKind] = useState<TransactionKind>("expense");
  const categories = useMemo(
    () => (kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [kind],
  );
  const [state, formAction] = useActionState(addTransactionAction, initial);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-2">
        {(["expense", "income"] as TransactionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
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

      <Field label="Title" name="title" required errors={errors.title} />
      <Field label="Amount" name="amount" type="number" step="0.01" required errors={errors.amount} />
      <Field label="When" name="timestamp" type="datetime-local" required defaultValue={nowLocalInput()} errors={errors.timestamp} />
      <Field label="Category" name="category" errors={errors.category}>
        <select
          id="field-category"
          name="category"
          className="w-full rounded border border-border bg-surface px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <SubmitButton>Add transaction</SubmitButton>
      {state.ok ? <p className="text-center text-xs text-income">Added ✓</p> : null}
    </form>
  );
}
