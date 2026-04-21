"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/actions/auth";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = { ok: false };

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initial);
  const errors = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormError messages={errors._form} />
      <Field label="Email" name="email" type="email" required errors={errors.email} />
      <Field label="Password" name="password" type="password" required errors={errors.password} />
      <Field label="Currency" name="currency" errors={errors.currency}>
        <select
          id="field-currency"
          name="currency"
          defaultValue="EUR"
          className="w-full rounded border border-border bg-surface px-3 py-2"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <SubmitButton>Create account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="underline">Log in</Link>
      </p>
    </form>
  );
}
