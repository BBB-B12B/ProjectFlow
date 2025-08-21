"use client"

import { ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { chartConfig } from "@/lib/utils"
import { Task } from "@/lib/types"
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

// Custom Tooltip Content component to prevent duplication
const CustomGanttTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // All bars in a row share the same payload
      return (
        <div className="overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
          <p className="font-bold">{data.name}</p>
          <p className="text-muted-foreground">
            {format(new Date(data.rangeForTooltip[0]), "MMM d, yyyy")} - {format(new Date(data.rangeForTooltip[1]), "MMM d, yyyy")}
          </p>
        </div>
      );
    }
    return null;
  };

const TaskGanttChart = ({ tasks, timeframe, onTaskClick }: { tasks: Task[]; timeframe: string; onTaskClick: (task: Task) => void; }) => {
  if (!tasks || tasks.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No tasks to display.</p></div>;
  }

  const allDates = tasks.flatMap(t => [new Date(t.StartDate), new Date(t.EndDate)]);
  let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  if (timeframe === 'weekly') {
    minDate = startOfWeek(minDate);
    maxDate = endOfWeek(maxDate);
  } else {
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);
  }

  const chartData = tasks.map(task => {
    const startDate = new Date(task.StartDate)
    const endDate = new Date(task.EndDate)
    
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    const offsetDuration = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    
    const isCompleted = task.Status === 'จบงานแล้ว'
    const isOverdue = !isCompleted && today > endDate

    const timeElapsed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const progressDuration = isCompleted ? totalDuration : Math.max(0, Math.min(timeElapsed, totalDuration))
    const remainingDuration = totalDuration - progressDuration

    return {
      ...task,
      name: task.TaskName,
      rangeForTooltip: [startDate, endDate],
      offset: offsetDuration,
      completed: isOverdue ? 0 : progressDuration,
      remaining: isOverdue ? 0 : remainingDuration,
      overdue: isOverdue ? totalDuration : 0,
    }
  });

  const getTicks = () => {
    const ticks = new Set<number>();
    let currentDate = new Date(minDate);

    while (currentDate <= maxDate) {
      const dayOffset = (currentDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      ticks.add(Math.floor(dayOffset));
      if (timeframe === 'weekly') {
        currentDate = addDays(currentDate, 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }
    }
    return Array.from(ticks);
  };
  
  const ticks = getTicks();
  const totalChartDuration = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

  const tickFormatter = (dayOffset: number) => {
    const date = addDays(minDate, dayOffset);
    if (timeframe === 'weekly') {
      return format(date, 'MMM d');
    }
    if (minDate.getUTCFullYear() !== maxDate.getUTCFullYear()) {
      return format(date, 'MMM yy');
    }
    return format(date, 'MMM');
  };

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <BarChart data={chartData} layout="vertical" stackOffset="none" margin={{ left: -20 }}>
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 20)}
          width={120}
        />
        <XAxis
          type="number"
          domain={[0, totalChartDuration]}
          ticks={ticks}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip cursor={false} content={<CustomGanttTooltip />} />
        <Bar dataKey="offset" stackId="a" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" className="fill-success cursor-pointer" isAnimationActive={false} radius={[5, 0, 0, 5]}>
            {chartData.map((data, index) => <Cell key={`cell-${index}`} onClick={() => onTaskClick(data)} />)}
        </Bar>
        <Bar dataKey="remaining" stackId="a" fill="hsla(var(--chart-1), 0.3)" className="fill-primary/30 cursor-pointer" isAnimationActive={false} radius={[0, 5, 5, 0]}>
            {chartData.map((data, index) => <Cell key={`cell-${index}`} onClick={() => onTaskClick(data)} />)}
        </Bar>
        <Bar dataKey="overdue" stackId="a" fill="var(--color-overdue)" className="fill-destructive cursor-pointer" isAnimationActive={false} radius={5}>
            {chartData.map((data, index) => <Cell key={`cell-${index}`} onClick={() => onTaskClick(data)} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export { TaskGanttChart }
