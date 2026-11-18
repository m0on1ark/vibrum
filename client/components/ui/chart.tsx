"use client";

import * as React from "react";
import {
  type DefaultLegendContentProps,
  Legend,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  type TooltipPayloadEntry,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
};

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  // Inject CSS custom properties directly on the wrapper instead of <style dangerouslySetInnerHTML>.
  const cssVars: Record<string, string> = {};
  for (const [key, item] of Object.entries(config)) {
    if (item.color) {
      cssVars[`--color-${key}`] = item.color;
    }
  }

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        style={{ ...cssVars, ...style } as React.CSSProperties}
        className={cn(
          "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/50 [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = Tooltip;

type ChartTooltipContentProps = Partial<
  TooltipContentProps<ValueType, NameType>
> & {
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  nameKey?: string;
  labelKey?: string;
  valueFormatter?: (value: number) => string;
  showPercentage?: boolean;
};

function readPayloadRecord(
  entry: TooltipPayloadEntry,
): Record<string, unknown> | null {
  if (typeof entry.payload === "object" && entry.payload !== null) {
    return entry.payload as Record<string, unknown>;
  }
  return null;
}

function getPayloadConfigKey(
  entry: TooltipPayloadEntry,
  keyOverride?: string,
): string {
  const payloadRecord = readPayloadRecord(entry);
  if (keyOverride) {
    if (payloadRecord && keyOverride in payloadRecord) {
      const value = payloadRecord[keyOverride];
      if (typeof value === "string" || typeof value === "number") {
        return String(value);
      }
    }
    return keyOverride;
  }

  if (typeof entry.dataKey === "string" || typeof entry.dataKey === "number") {
    return String(entry.dataKey);
  }
  if (entry.name !== undefined) {
    return String(entry.name);
  }
  return "value";
}

function formatTooltipValue(
  value: ValueType | undefined,
  valueFormatter?: (value: number) => string,
): string {
  if (typeof value === "number") {
    return valueFormatter ? valueFormatter(value) : value.toLocaleString("pl-PL");
  }
  if (Array.isArray(value)) {
    return value.join(" - ");
  }
  return value !== undefined ? String(value) : "";
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  className,
  hideLabel = false,
  hideIndicator = false,
  nameKey,
  labelKey,
  valueFormatter,
  showPercentage = false,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  const firstPayloadRecord = readPayloadRecord(payload[0]);
  const rawLabel =
    labelKey && firstPayloadRecord && labelKey in firstPayloadRecord
      ? (firstPayloadRecord[labelKey] as React.ReactNode)
      : label;

  const resolvedLabel =
    !hideLabel && rawLabel !== undefined && rawLabel !== ""
      ? labelFormatter
        ? labelFormatter(rawLabel, payload)
        : (config[String(rawLabel)]?.label ?? rawLabel)
      : null;

  return (
    <div
      className={cn(
        "grid min-w-36 gap-1.5 rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
        className,
      )}
    >
      {resolvedLabel ? (
        <div className="font-medium capitalize">{resolvedLabel}</div>
      ) : null}

      <div className="grid gap-1">
        {payload.map((entry, index) => {
          const key = getPayloadConfigKey(entry, nameKey);
          const itemConfig = config[key];
          const payloadRecord = readPayloadRecord(entry);
          const indicatorColor =
            entry.color ??
            (typeof payloadRecord?.fill === "string"
              ? payloadRecord.fill
              : undefined) ??
            entry.fill ??
            itemConfig?.color ??
            "var(--color-primary)";

          const itemLabel = itemConfig?.label ?? entry.name ?? key;
          const formattedValue = formatTooltipValue(entry.value, valueFormatter);
          const percentValue =
            showPercentage &&
            payloadRecord &&
            typeof payloadRecord.percent === "number"
              ? payloadRecord.percent
              : null;

          return (
            <div
              key={`${key}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {!hideIndicator ? (
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: indicatorColor }}
                  />
                ) : null}
                <span>{itemLabel}</span>
              </div>

              <div className="flex items-baseline gap-1.5 font-medium tabular-nums text-foreground">
                <span>{formattedValue}</span>
                {percentValue !== null ? (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    ({percentValue.toFixed(1)}%)
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = Legend;

type ChartLegendContentProps = Partial<
  Pick<DefaultLegendContentProps, "payload" | "verticalAlign">
> & {
  className?: string;
  hideIcon?: boolean;
  nameKey?: string;
};

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: ChartLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((entry, index) => {
        const key = String(
          nameKey ?? entry.dataKey ?? entry.value ?? `legend-${index}`,
        );
        const itemConfig = config[key];
        const label = itemConfig?.label ?? entry.value;
        const color = entry.color ?? itemConfig?.color;

        return (
          <div key={`${key}-${index}`} className="flex items-center gap-1.5">
            {!hideIcon ? (
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ) : null}
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
};
