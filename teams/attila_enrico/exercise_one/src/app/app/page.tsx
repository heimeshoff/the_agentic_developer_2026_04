import { requireSession } from "@/lib/auth";
import { listTransactionsByUser } from "@/lib/db";
import { formatAmount } from "@/lib/currencies";
import { AddTransactionForm } from "./AddTransactionForm";
import { formatDate } from "./formatDate";

export default async function DashboardPage() {
  const { user } = await requireSession();
  const transactions = await listTransactionsByUser(user.id);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount),
    0,
  );

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <aside className="md:sticky md:top-6 md:self-start">
        <AddTransactionForm />
      </aside>

      <section className="space-y-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-muted">Balance</p>
          <p className={"mt-1 text-3xl font-semibold " + (balance < 0 ? "text-expense" : "text-text")}>
            {formatAmount(balance, user.currency)}
          </p>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-muted">No transactions yet — add your first one.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted">
                    {t.category} · {formatDate(t.timestamp)}
                  </p>
                </div>
                <p className={"shrink-0 font-medium " + (t.kind === "expense" ? "text-expense" : "text-income")}>
                  {t.kind === "expense" ? "−" : "+"}
                  {formatAmount(t.amount, user.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
