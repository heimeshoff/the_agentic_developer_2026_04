"use server";

import { redirect } from "next/navigation";
import {
  authenticateUser,
  clearSession,
  createSession,
  registerUser,
  type FieldErrors,
} from "@/lib/auth";

export type FormState = { ok: boolean; errors?: FieldErrors };

export async function registerAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const result = await registerUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  await createSession(result.user.id);
  redirect("/app");
}

export async function loginAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const result = await authenticateUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  await createSession(result.user.id);
  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
