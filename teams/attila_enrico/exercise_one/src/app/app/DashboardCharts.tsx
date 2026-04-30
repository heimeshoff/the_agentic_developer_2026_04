"use client";

import type { ChartParams } from "@/lib/chartUrlState";
import { CategoryPieChart } from "./CategoryPieChart";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { RangeControls } from "./RangeControls";

interface MonthlyDatum {
  month: string;
  income: number;
  expense: number;
}

interface CategoryDatum {
  category: string;
  total: number;
}

interface DashboardChartsProps {
  params: ChartParams;
  monthly: MonthlyDatum[];
  byCategory: CategoryDatum[];
  currency: string;
}

export function DashboardCharts({
  params,
  monthly,
  byCategory,
  currency,
}: DashboardChartsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <RangeControls params={params} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MonthlyBarChart data={monthly} params={params} currency={currency} />
        <CategoryPieChart
          data={byCategory}
          params={params}
          currency={currency}
        />
      </div>
    </div>
  );
}
