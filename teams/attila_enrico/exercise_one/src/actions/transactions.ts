"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { addTransactionForUser } from "@/lib/transactions";
import type { FormState } from "@/actions/auth";

export async function addTransactionAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { user } = await requireSession();
  const result = await addTransactionForUser(user.id, {
    kind: String(formData.get("kind") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    title: String(formData.get("title") ?? ""),
    timestamp: String(formData.get("timestamp") ?? ""),
    category: String(formData.get("category") ?? ""),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  revalidatePath("/app");
  return { ok: true };
}
