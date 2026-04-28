import { z } from "zod";
import { nanoid } from "nanoid";
import {
  addTransaction,
  findOwnedTransaction,
  readDb,
  restoreTransaction,
  softDeleteTransaction,
  updateTransaction,
  type Transaction,
} from "@/lib/db";
import { isValidCategory } from "@/lib/categories";
import { appendAuditEntry, createAuditEntry } from "@/lib/audit";
import type { FieldErrors } from "@/lib/auth";

const TransactionFieldsObject = z.object({
  kind: z.enum(["expense", "income"]),
  amount: z
    .string()
    .trim()
    .refine((v) => v.length > 0, "Amount is required")
    .transform((v) => Number(v))
    .refine((n) => Number.isFinite(n) && n > 0, "Amount must be a positive number"),
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  timestamp: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
    .transform((v) => new Date(v).toISOString()),
  category: z.string().trim().min(1, "Category is required"),
});

function enforceCategoryKindInvariant(
  data: { kind: "expense" | "income"; category: string },
  ctx: z.RefinementCtx,
): void {
  if (!isValidCategory(data.kind, data.category)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["category"],
      message: "Category does not belong to this kind",
    });
  }
}

export const TransactionFieldsSchema = TransactionFieldsObject.superRefine(
  enforceCategoryKindInvariant,
);

const InputSchema = TransactionFieldsSchema;

const UpdateInputSchema = TransactionFieldsObject.extend({
  id: z.string().min(1),
}).superRefine(enforceCategoryKindInvariant);

export type AddResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; errors: FieldErrors };

export type UpdateResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: "invalid"; fieldErrors: FieldErrors }
  | { ok: false; error: "not_found" };

export type DeleteResult =
  | { ok: true }
  | { ok: false; error: "not_found" };

export type RestoreResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: "not_found" };

function collectFieldErrors(issues: z.ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = (issue.path[0] ?? "_form") as string;
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export async function addTransactionForUser(
  userId: string,
  raw: { kind: string; amount: string; title: string; timestamp: string; category: string },
): Promise<AddResult> {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: collectFieldErrors(parsed.error.issues) };
  }
  const tx: Transaction = {
    id: nanoid(),
    userId,
    kind: parsed.data.kind,
    amount: Math.round(parsed.data.amount * 100) / 100,
    title: parsed.data.title,
    timestamp: parsed.data.timestamp,
    category: parsed.data.category,
    source: "user",
  };
  await addTransaction(tx);
  await appendAuditEntry(
    createAuditEntry({
      transactionId: tx.id,
      userId,
      action: "create",
      before: null,
      after: tx,
    }),
  );
  return { ok: true, transaction: tx };
}

export async function updateTransactionForUser(
  userId: string,
  id: string,
  raw: unknown,
): Promise<UpdateResult> {
  const rawInput =
    raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>), id } : { id };
  const parsed = UpdateInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const db = await readDb();
  const existing = findOwnedTransaction(db, userId, id);
  if (!existing) {
    return { ok: false, error: "not_found" };
  }
  const newTx: Transaction = {
    id: existing.id,
    userId: existing.userId,
    kind: parsed.data.kind,
    amount: Math.round(parsed.data.amount * 100) / 100,
    title: parsed.data.title,
    timestamp: parsed.data.timestamp,
    category: parsed.data.category,
    deletedAt: null,
    source: "user",
  };
  await updateTransaction(newTx);
  await appendAuditEntry(
    createAuditEntry({
      transactionId: newTx.id,
      userId,
      action: "update",
      before: existing,
      after: newTx,
    }),
  );
  return { ok: true, transaction: newTx };
}

export async function softDeleteTransactionForUser(
  userId: string,
  id: string,
): Promise<DeleteResult> {
  const db = await readDb();
  const existing = findOwnedTransaction(db, userId, id);
  if (!existing) {
    return { ok: false, error: "not_found" };
  }
  const at = new Date().toISOString();
  await softDeleteTransaction(id, at);
  await appendAuditEntry(
    createAuditEntry({
      transactionId: id,
      userId,
      action: "delete",
      before: existing,
      after: { ...existing, deletedAt: at },
    }),
  );
  return { ok: true };
}

export async function restoreTransactionForUser(
  userId: string,
  id: string,
): Promise<RestoreResult> {
  const db = await readDb();
  const existing = db.transactions.find((t) => t.id === id);
  if (!existing) {
    return { ok: false, error: "not_found" };
  }
  if (existing.userId !== userId) {
    return { ok: false, error: "not_found" };
  }
  if (existing.deletedAt == null) {
    return { ok: false, error: "not_found" };
  }
  await restoreTransaction(id);
  const restoredTx: Transaction = { ...existing, deletedAt: null };
  await appendAuditEntry(
    createAuditEntry({
      transactionId: id,
      userId,
      action: "restore",
      before: existing,
      after: restoredTx,
    }),
  );
  return { ok: true, transaction: restoredTx };
}
