"use client";

import { Pie, PieChart } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type CategorySpending } from "@/lib/analytics/types";
import { formatMoney } from "@/lib/shared/format";

type CategoryChartDatum = {
  key: string;
  label: string;
  amount: number;
  percent: number;
  fill: string;
};

export function DashboardCategoryChart({
  items,
  totalExpenses,
  colors,
  currency,
}: {
  items: CategorySpending[];
  totalExpenses: number;
  colors: readonly string[];
  currency: string;
}) {
  const formatCategoryTotal = (amount: number): string =>
    formatMoney(amount, currency);

  const chartData: CategoryChartDatum[] = items.map((item, index) => ({
    key:
      item.categoryId !== null ? `cat-${item.categoryId}` : "uncategorized",
    label: item.categoryName ?? "Bez kategorii",
    amount: item.amount,
    percent: item.percent,
    fill: colors[index % colors.length],
  }));

  const chartConfig: ChartConfig = {};
  for (const datum of chartData) {
    chartConfig[datum.key] = {
      label: datum.label,
      color: datum.fill,
    };
  }

  return (
    <div className="relative mx-auto aspect-square max-h-60 w-full">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-60 w-full"
      >
        <PieChart>
          <ChartTooltip
            wrapperStyle={{ zIndex: 20 }}
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="key"
                showPercentage
                valueFormatter={formatCategoryTotal}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="amount"
            nameKey="label"
            innerRadius={58}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--card)"
          />
        </PieChart>
      </ChartContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Łącznie
        </span>
        <span className="max-w-28 text-sm font-semibold tabular-nums leading-tight">
          {formatCategoryTotal(totalExpenses)}
        </span>
      </div>
    </div>
  );
}
