import { requireSession } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Finance</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
