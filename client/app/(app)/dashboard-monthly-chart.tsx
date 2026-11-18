"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ANALYTICS_CURRENCY } from "@/lib/analytics/types";
import { formatMoney } from "@/lib/shared/format";

export type MonthlyChartPoint = {
  month: string;
  shortLabel: string;
  label: string;
  income: number;
  expenses: number;
};

const chartConfig = {
  income: {
    label: "Przychody",
    color: "#059669",
  },
  expenses: {
    label: "Wydatki",
    color: "#e11d48",
  },
} satisfies ChartConfig;

const compactNumberFormatter = new Intl.NumberFormat("pl-PL", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompactPln(value: number): string {
  return `${compactNumberFormatter.format(value)} zł`;
}

function formatPlnTooltipValue(value: number): string {
  return formatMoney(value, ANALYTICS_CURRENCY);
}

export function DashboardMonthlyChart({
  data,
}: {
  data: MonthlyChartPoint[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="shortLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={formatCompactPln}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              valueFormatter={formatPlnTooltipValue}
              labelFormatter={(rawLabel, payload) => {
                const first = payload[0]?.payload as
                  | MonthlyChartPoint
                  | undefined;
                return first?.label ?? rawLabel;
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="income"
          name="Przychody"
          fill="var(--color-income)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="expenses"
          name="Wydatki"
          fill="var(--color-expenses)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ChartContainer>
  );
}
