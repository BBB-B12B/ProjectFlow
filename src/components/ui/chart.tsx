// src/components/ui/chart.tsx
"use client";

import React from "react";
import {
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
  Cell,
  Label,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";

// ---------- helper function
function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

// ---------- types
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<"light" | "dark", string> });
};

// ---------- theme style vars
const THEMES = { light: "", dark: ".dark" } as const;

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within a <ChartContainer/>");
  return ctx;
}

// =======================
// ChartContainer Component
// =======================
export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactNode;
    id?: string;
    debug?: boolean;
    name?: string;
  }
>(({ id, className, children, config, debug = false, name, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("relative w-full h-full min-h-0", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
        {debug && (
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-red-500/60">
            <div className="absolute left-1 top-1 rounded bg-red-600/80 px-1.5 py-0.5 text-[10px] font-mono text-white">
              {name || chartId}
            </div>
          </div>
        )}
      </div>
    </ChartContext.Provider>
  );
});

ChartContainer.displayName = "ChartContainer";

// Chart Style Component
export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const rules = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const lines = Object.entries(config)
        .map(([key, item]) => {
          const color = (item as any).theme?.[theme as "light" | "dark"] || (item as any).color;
          return color ? `  --color-${key}: ${color};` : null;
        })
        .filter(Boolean)
        .join("\n");
      return `${prefix} [data-chart=${id}] {\n${lines}\n}`;
    })
    .join("\n");
  return <style dangerouslySetInnerHTML={{ __html: rules }} />;
}

// convenience re-exports
export const ChartTooltip = RechartsTooltip;
export const ChartLegend = RechartsLegend;

function getConfigFromPayload(config: ChartConfig, key: string) {
  const norm = key.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return config[norm as keyof typeof config] || config[key as keyof typeof config];
}

// ==============
// PieChart Component
// ==============
interface PieChartProps {
  data: { name: string; value: number; colorKey?: string; color?: string }[];
  category: string;
  index: string;
  onCellClick?: (data: any) => void;
  innerRadius?: number | string;
  outerRadius?: number | string;
  width?: number;
  height?: number;
  label?: (props: any) => React.ReactNode;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  category,
  index,
  onCellClick,
  innerRadius = "55%",
  outerRadius = "80%",
  width,
  height,
  label,
}) => {
  const { config } = useChart();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <RechartsPie
          data={data}
          dataKey={category}
          nameKey={index}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={1}
        >
          {data.map((entry, i) => {
            const k = entry.colorKey || entry.name;
            const c = getConfigFromPayload(config, String(k));
            return (
              <Cell
                key={`cell-${i}`}
                fill={(entry as any).color || (c as any)?.color || `hsl(var(--chart-${(i % 6) + 1}))`}
                onClick={() => onCellClick?.(entry)}
                style={{ cursor: onCellClick ? 'pointer' : 'default' }}
              />
            );
          })}
          {label ? <Label position="center" content={label as any} /> : null}
        </RechartsPie>
        <RechartsTooltip />
        <RechartsLegend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

// ==============
// BarChart Component
// ==============
interface BarChartProps {
  data: Array<Record<string, string | number>>;
  index: string;
  categories: string[];
  layout?: "horizontal" | "vertical";
  yAxisWidth?: number;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  numberDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  numberTicks?: number[];
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  barSizePx?: number;
  barCategoryGap?: number | string;
  barGap?: number | string;
  onBarClick?: (payload: any) => void;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  index,
  categories,
  layout = "horizontal",
  yAxisWidth = 150,
  xAxisLabel,
  yAxisLabel,
  numberDomain,
  numberTicks,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  barSizePx,
  barCategoryGap = 20,
  barGap,
  onBarClick,
  width,
  height,
  showLegend = false,
}) => {
  const { config } = useChart();

  // Calculate optimal bar size for vertical layout
  const calculatedBarSize = React.useMemo(() => {
    if (barSizePx) return barSizePx;
    if (layout === "vertical" && data.length > 0) {
      const availableHeight = (height || 300) - (margin.top || 0) - (margin.bottom || 0);
      return Math.max(12, Math.min(40, Math.floor(availableHeight / data.length) - 10));
    }
    return 20;
  }, [barSizePx, layout, data.length, height, margin]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={margin}
        barCategoryGap={barCategoryGap}
        barGap={barGap}
      >
        {layout === "horizontal" ? (
          <>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={index}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              domain={numberDomain || ["auto", "auto"]}
              ticks={numberTicks}
              fontSize={12}
            />
          </>
        ) : (
          <>
            <CartesianGrid strokeDasharray="3 3" />
            <YAxis
              dataKey={index}
              type="category"
              tickLine={false}
              axisLine={false}
              width={yAxisWidth}
              tickMargin={8}
              fontSize={12}
              interval={0}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              domain={numberDomain || ["auto", "auto"]}
              ticks={numberTicks}
              fontSize={12}
            />
          </>
        )}

        <RechartsTooltip />
        {showLegend ? <RechartsLegend /> : null}

        {categories.map((cat) => {
          const configItem = config[cat as keyof typeof config];
          return (
            <RechartsBar
              key={cat}
              dataKey={cat}
              radius={[4, 4, 0, 0]}
              maxBarSize={calculatedBarSize}
              fill={`var(--color-${cat})` || (configItem as any)?.color || "#8884d8"}
              onClick={(data: any) => onBarClick?.(data)}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
            />
          );
        })}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

// ========================================
// TaskEffortChart (Prioritization Matrix)
// ========================================
export function TaskEffortChart({
  data,
}: {
  data: Array<{ id: string; title: string; effort?: number; effect?: number }>;
}) {
  const pts = (data || []).map((t) => ({
    x: Number((t as any).effort ?? (t as any).Effort ?? 0),
    y: Number((t as any).effect ?? (t as any).Effect ?? 0),
    name: (t as any).title || (t as any).TaskName || "",
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name="Effort" 
          domain={[0, 10]} 
          ticks={[0, 2, 4, 5, 6, 8, 10]} 
          fontSize={12}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Effect" 
          domain={[0, 10]} 
          ticks={[0, 2, 4, 5, 6, 8, 10]} 
          fontSize={12}
        />
        <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} />
        <RechartsLegend />
        <ReferenceLine x={5} strokeDasharray="4 4" stroke="#666" />
        <ReferenceLine y={5} strokeDasharray="4 4" stroke="#666" />
        <Scatter name="Tasks" data={pts} fill="hsl(var(--primary))" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}