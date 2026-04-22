"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/actions/auth";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = { ok: false };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);
  const errors = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormError messages={errors._form} />
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      <SubmitButton>Log in</SubmitButton>
      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="underline">Register →</Link>
      </p>
    </form>
  );
}
