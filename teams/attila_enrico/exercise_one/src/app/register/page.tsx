import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-6">
      <div className="w-full space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
