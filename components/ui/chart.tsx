"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

// Format: { [key: string]: { label?: React.ReactNode; icon?: React.ComponentType; color?: string; theme?: Record<string, string> } }
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={`flex aspect-auto justify-center text-xs outline-none focus:outline-none focus-visible:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_svg]:outline-none [&_*]:outline-none ${className || ""}`}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  );

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [data-chart="${id}"] *:focus,
          [data-chart="${id}"] *:focus-visible,
          [data-chart="${id}"] .recharts-wrapper,
          [data-chart="${id}"] .recharts-surface,
          [data-chart="${id}"] svg {
            outline: none !important;
            box-shadow: none !important;
          }
          ${colorConfig
            .map(([key, item]) => {
              const color = item.color || item.theme?.light || "#0071e3";
              return `[data-chart="${id}"] { --color-${key}: ${color}; }`;
            })
            .join("\n")}
        `,
      }}
    />
  );
};

export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
      labelFormatter?: (label: any, payload: any[]) => React.ReactNode;
      formatter?: (
        value: any,
        name: any,
        item: any,
        index: number,
        payload: any
      ) => React.ReactNode;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    }: any,
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = config[key];
      const value =
        !labelKey && typeof label === "string"
          ? config[label]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={`font-semibold text-slate-800 ${labelClassName || ""}`}>
            {labelFormatter(label, payload)}
          </div>
        );
      }

      if (!value && !label) {
        return null;
      }

      return (
        <div className={`font-semibold text-slate-800 ${labelClassName || ""}`}>
          {value || label}
        </div>
      );
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={`grid min-w-[10rem] items-start gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md ${
          className || ""
        }`}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = config[key];
            const indicatorColor = color || item.payload?.fill || item.color || "#0071e3";

            return (
              <div
                key={item.dataKey || index}
                className="flex w-full items-center justify-between gap-3"
              >
                <div className="flex items-center gap-1.5 text-slate-600">
                  {!hideIndicator && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[2.5px]"
                      style={{
                        backgroundColor: indicatorColor,
                      }}
                    />
                  )}
                  <span className="font-medium text-slate-600">
                    {itemConfig?.label || item.name || key}
                  </span>
                </div>
                {item.value !== undefined && (
                  <span className="font-bold tabular-nums text-slate-950">
                    {formatter
                      ? formatter(item.value, item.name, item, index, item.payload)
                      : Number(item.value).toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = RechartsPrimitive.Legend;

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    hideIcon?: boolean;
    nameKey?: string;
    verticalAlign?: "top" | "bottom" | "middle";
    payload?: any[];
  }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`hidden sm:flex items-center justify-center gap-4 text-xs ${
        verticalAlign === "top" ? "pb-3" : "pt-3"
      } ${className || ""}`}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = config[key];

        return (
          <div key={item.value} className="flex items-center gap-1.5 text-slate-600">
            {!hideIcon ? (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2.5px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            ) : null}
            <span className="font-medium text-slate-700">{itemConfig?.label || item.value}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";
