import { z } from "zod";
import { nanoid } from "nanoid";
import { addTransaction, type Transaction } from "@/lib/db";
import { isValidCategory } from "@/lib/categories";
import type { FieldErrors } from "@/lib/auth";

const InputSchema = z
  .object({
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
  })
  .superRefine((data, ctx) => {
    if (!isValidCategory(data.kind, data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: "Category does not belong to this kind",
      });
    }
  });

export type AddResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; errors: FieldErrors };

export async function addTransactionForUser(
  userId: string,
  raw: { kind: string; amount: string; title: string; timestamp: string; category: string },
): Promise<AddResult> {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = (issue.path[0] ?? "_form") as string;
      (errors[key] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const tx: Transaction = {
    id: nanoid(),
    userId,
    kind: parsed.data.kind,
    amount: Math.round(parsed.data.amount * 100) / 100,
    title: parsed.data.title,
    timestamp: parsed.data.timestamp,
    category: parsed.data.category,
  };
  await addTransaction(tx);
  return { ok: true, transaction: tx };
}
