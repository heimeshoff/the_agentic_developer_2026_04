import type { ReactNode } from "react";

export function Field({
  label, name, type = "text", required, defaultValue, step, children, errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  step?: string;
  children?: ReactNode;
  errors?: string[];
}) {
  const id = `field-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm text-muted">{label}</label>
      {children ?? (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          step={step}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-text outline-none focus:border-text"
        />
      )}
      {errors?.map((e, i) => (
        <p key={i} className="text-xs text-expense">{e}</p>
      ))}
    </div>
  );
}
