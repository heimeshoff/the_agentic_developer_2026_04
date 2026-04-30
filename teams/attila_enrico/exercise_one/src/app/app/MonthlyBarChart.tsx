"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildChartHref, type ChartParams } from "@/lib/chartUrlState";
import { formatAmount } from "@/lib/currencies";

// Hex values mirror the `income` / `expense` tokens defined in
// `tailwind.config.ts`. Recharts consumes raw colors via the SVG `fill`
// prop, so Tailwind class names are not usable here.
const INCOME_COLOR = "#2a8a5f";
const EXPENSE_COLOR = "#c43a3a";

interface MonthlyDatum {
  month: string;
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: MonthlyDatum[];
  params: ChartParams;
  currency: string;
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadEntry[];
  currency: string;
}

function ChartTooltip({
  active,
  label,
  payload,
  currency,
}: ChartTooltipProps): React.ReactElement | null {
  if (active !== true || payload === undefined || payload.length === 0) {
    return null;
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-2 text-xs shadow">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey ?? entry.name ?? "")}
          style={{ color: entry.color }}
        >
          {entry.name}:{" "}
          {typeof entry.value === "number"
            ? formatAmount(entry.value, currency)
            : "—"}
        </p>
      ))}
    </div>
  );
}

interface BarClickPayload {
  payload?: { month?: string };
}

export function MonthlyBarChart({
  data,
  params,
  currency,
}: MonthlyBarChartProps): React.ReactElement {
  const router = useRouter();

  const isEmpty = data.length === 0;
  const renderData: MonthlyDatum[] = isEmpty
    ? [{ month: "—", income: 0, expense: 0 }]
    : data;

  const handleBarClick = (entry: BarClickPayload): void => {
    if (isEmpty) return;
    const clickedMonth = entry.payload?.month;
    if (clickedMonth === undefined || clickedMonth === "—") return;
    const nextMonth =
      params.month === clickedMonth ? undefined : clickedMonth;
    router.push(buildChartHref(params, { month: nextMonth }));
  };

  const formatYTick = (value: number): string => formatAmount(value, currency);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={renderData}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatYTick} width={80} />
            <Tooltip
              content={<ChartTooltip currency={currency} />}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Legend />
            <Bar
              dataKey="income"
              name="Income"
              fill={INCOME_COLOR}
              cursor="pointer"
              onClick={handleBarClick}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill={EXPENSE_COLOR}
              cursor="pointer"
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
