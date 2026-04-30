import { requireSession } from "@/lib/auth";
import { listTransactionsByUser } from "@/lib/db";
import { formatAmount } from "@/lib/currencies";
import { parseChartParams } from "@/lib/chartUrlState";
import {
  bucketByMonth,
  groupByCategory,
  inRange,
  resolvePresetRange,
} from "@/lib/aggregations";
import { DemoDataButton } from "./DemoDataButton";
import { TransactionForm } from "./TransactionForm";
import { TransactionsList } from "./TransactionsList";
import { DashboardCharts } from "./DashboardCharts";

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { user } = await requireSession();
  const transactions = await listTransactionsByUser(user.id);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount),
    0,
  );
  const hasDemoData = transactions.some((t) => t.source === "demo");

  const resolvedSearchParams = await searchParams;
  const params = parseChartParams(resolvedSearchParams);

  const { from, to } =
    params.range === "custom"
      ? { from: params.from, to: params.to }
      : resolvePresetRange(params.range, new Date());

  const rangeFiltered = transactions.filter((tx) => inRange(tx, from, to));

  const monthly = bucketByMonth(rangeFiltered);
  const byCategory = groupByCategory(rangeFiltered, "expense");

  const listFiltered = rangeFiltered.filter((tx) => {
    if (params.category !== undefined && tx.category !== params.category) {
      return false;
    }
    if (
      params.month !== undefined &&
      tx.timestamp.slice(0, 7) !== params.month
    ) {
      return false;
    }
    return true;
  });

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

        <DashboardCharts
          params={params}
          monthly={monthly}
          byCategory={byCategory}
          currency={user.currency}
        />

        <TransactionsList
          transactions={listFiltered}
          currency={user.currency}
          activeFilters={{
            category: params.category,
            month: params.month,
          }}
        />
      </section>
    </div>
  );
}
