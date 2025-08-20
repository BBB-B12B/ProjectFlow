"use client"

import {
  Scatter,
  XAxis,
  YAxis,
  Label,
  ScatterChart,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Task } from "@/lib/types"

const chartConfig = {
  tasks: {
    label: "Tasks",
    color: "hsl(var(--primary))",
  },
}

export function TaskEffortChart({ data }: { data: Task[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[450px] w-full">
      <ScatterChart
        accessibilityLayer
        margin={{
          top: 20,
          right: 20,
          bottom: 40,
          left: 20,
        }}
      >
        <XAxis
          dataKey="effort"
          type="number"
          name="Effort"
          domain={[0, 6]}
          ticks={[1, 2, 3, 4, 5]}
          tickLine={false}
          axisLine={false}
        >
            <Label value="Effort →" position="insideBottom" offset={-25} className="fill-muted-foreground"/>
        </XAxis>
        <YAxis
          dataKey="effect"
          type="number"
          name="Effect"
          domain={[0, 6]}
          ticks={[1, 2, 3, 4, 5]}
          tickLine={false}
          axisLine={false}
        >
            <Label value="Effect →" angle={-90} position="insideLeft" offset={-10} className="fill-muted-foreground"/>
        </YAxis>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              hideLabel
              formatter={(value, name, props) => {
                const { payload } = props
                if (payload) {
                    return (
                        <div className="w-48 rounded-lg border bg-background p-2 shadow-sm text-sm">
                          <p className="font-bold">{payload.title}</p>
                          <p className="text-muted-foreground">Effort: <span className="font-semibold text-foreground">{payload.effort}</span></p>
                          <p className="text-muted-foreground">Effect: <span className="font-semibold text-foreground">{payload.effect}</span></p>
                          <p className="text-muted-foreground">Priority: <span className="font-semibold text-foreground">{payload.priority}</span></p>
                        </div>
                      )
                }
                return null
              }}
            />
          }
        />
        <Scatter data={data} fill="var(--color-tasks)" />
      </ScatterChart>
    </ChartContainer>
  )
}
