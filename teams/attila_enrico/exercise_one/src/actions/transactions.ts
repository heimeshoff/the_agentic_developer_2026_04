"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  addTransactionForUser,
  restoreTransactionForUser,
  softDeleteTransactionForUser,
  updateTransactionForUser,
} from "@/lib/transactions";
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

export async function updateTransactionAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { user } = await requireSession();
  const id = String(formData.get("id") ?? "");
  const result = await updateTransactionForUser(user.id, id, {
    kind: String(formData.get("kind") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    title: String(formData.get("title") ?? ""),
    timestamp: String(formData.get("timestamp") ?? ""),
    category: String(formData.get("category") ?? ""),
  });
  if (result.ok) {
    revalidatePath("/app");
    return { ok: true };
  }
  if (result.error === "invalid") {
    return { ok: false, errors: result.fieldErrors };
  }
  return {
    ok: false,
    errors: { _form: ["This transaction is no longer available."] },
  };
}

export async function deleteTransactionAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  const { user } = await requireSession();
  const result = await softDeleteTransactionForUser(user.id, id);
  if (!result.ok) return result;
  revalidatePath("/app");
  return { ok: true };
}

export async function restoreTransactionAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  const { user } = await requireSession();
  const result = await restoreTransactionForUser(user.id, id);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/app");
  return { ok: true };
}
