import { requireSession } from "@/lib/auth";
import { listTransactionsByUser } from "@/lib/db";
import { formatAmount } from "@/lib/currencies";
import { DemoDataButton } from "./DemoDataButton";
import { TransactionForm } from "./TransactionForm";
import { TransactionsList } from "./TransactionsList";

export default async function DashboardPage() {
  const { user } = await requireSession();
  const transactions = await listTransactionsByUser(user.id);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount),
    0,
  );
  const hasDemoData = transactions.some((t) => t.source === "demo");

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <aside className="md:sticky md:top-6 md:self-start space-y-6">
        <TransactionForm mode="add" />
        <DemoDataButton hasDemoData={hasDemoData} />
      </aside>

      <section className="space-y-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-muted">Balance</p>
          <p className={"mt-1 text-3xl font-semibold " + (balance < 0 ? "text-expense" : "text-text")}>
            {formatAmount(balance, user.currency)}
          </p>
        </div>

        <TransactionsList transactions={transactions} currency={user.currency} />
      </section>
    </div>
  );
}
