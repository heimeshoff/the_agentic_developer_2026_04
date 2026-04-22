import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-6">
      <div className="w-full space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Log in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
