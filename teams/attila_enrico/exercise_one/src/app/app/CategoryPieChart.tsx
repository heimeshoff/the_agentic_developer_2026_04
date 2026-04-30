"use client";

import { useRouter } from "next/navigation";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { buildChartHref, type ChartParams } from "@/lib/chartUrlState";
import { formatAmount } from "@/lib/currencies";

interface CategoryPieChartProps {
  data: { category: string; total: number }[];
  params: ChartParams;
  currency: string;
}

// Monochrome ramp derived from the project's neutral Tailwind tokens
// (see tailwind.config.ts: border #eeeeee, muted #6b7280) plus the
// `expense` accent (#c43a3a) reserved for the largest slice. The middle
// shades are interpolated between `border` and `muted` to give a 6-step
// neutral grey ramp; the 7th entry is the accent.
const PALETTE = [
  "#d4d5d8",
  "#bcbec2",
  "#a4a7ac",
  "#8c8f96",
  "#777a82",
  "#6b7280",
] as const;

const ACCENT_COLOR = "#c43a3a";
const NEUTRAL_BORDER_COLOR = "#eeeeee";

const EMPTY_RING_DATA: readonly { category: string; total: number }[] = [
  { category: "", total: 1 },
] as const;

interface TooltipPayload {
  name: string;
  value: number;
}

function CurrencyTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  currency: string;
}): React.ReactElement | null {
  if (active !== true || payload === undefined || payload.length === 0) {
    return null;
  }
  const entry = payload[0];
  return (
    <div className="rounded border border-border bg-surface px-2 py-1 text-xs text-text shadow-sm">
      <p className="font-medium">{entry.name}</p>
      <p className="text-muted">{formatAmount(entry.value, currency)}</p>
    </div>
  );
}

export function CategoryPieChart({
  data,
  params,
  currency,
}: CategoryPieChartProps): React.ReactElement {
  const router = useRouter();

  const handleSliceClick = (payload: { category: string }): void => {
    const clicked = payload.category;
    if (clicked === "") return;
    // Toggle: clicking the already-selected category clears the filter.
    const nextCategory =
      params.category === clicked ? undefined : clicked;
    router.push(buildChartHref(params, { category: nextCategory }));
  };

  const isEmpty = data.length === 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="text-xs uppercase tracking-wide text-muted">
        Spending by category
      </p>
      <div className="relative mt-3">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            {isEmpty ? (
              <Pie
                data={[...EMPTY_RING_DATA]}
                dataKey="total"
                nameKey="category"
                innerRadius={50}
                outerRadius={90}
                isAnimationActive={false}
                fill={NEUTRAL_BORDER_COLOR}
                stroke={NEUTRAL_BORDER_COLOR}
              />
            ) : (
              <>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={90}
                  onClick={(entry: { category: string }) =>
                    handleSliceClick(entry)
                  }
                  cursor="pointer"
                >
                  {data.map((slice, index) => {
                    // Largest slice (index 0, since server sorts desc) gets
                    // the accent; everything else cycles through the
                    // neutral ramp.
                    const fill =
                      index === 0
                        ? ACCENT_COLOR
                        : PALETTE[(index - 1) % PALETTE.length];
                    const isActive = params.category === slice.category;
                    return (
                      <Cell
                        key={slice.category}
                        fill={fill}
                        stroke={isActive ? "#111111" : "#ffffff"}
                        strokeWidth={isActive ? 2 : 1}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={<CurrencyTooltip currency={currency} />}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "0.75rem" }}
                />
              </>
            )}
          </PieChart>
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
