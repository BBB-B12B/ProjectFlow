"use client"

import { ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { chartConfig } from "@/lib/utils"
import { Task } from "@/lib/types"
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isPast, isToday, differenceInDays } from "date-fns"

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

  const allDates = tasks.flatMap(t => t.StartDate && t.EndDate ? [new Date(t.StartDate), new Date(t.EndDate)] : []);
  if (allDates.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No tasks with valid dates.</p></div>;
  }
  let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  if (timeframe === 'weekly') {
    minDate = startOfWeek(minDate);
    maxDate = endOfWeek(maxDate);
  } else {
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

  const chartData = tasks.map(task => {
    const startDate = new Date(task.StartDate)
    const endDate = new Date(task.EndDate)
    
    const offsetDuration = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    
    const isCompleted = (task.Progress || 0) === 100;
    const dueDate = parseISO(task.EndDate);
    const isOverdue = (isPast(dueDate) && !isToday(dueDate)) && !isCompleted;

    // --- LOGIC REVISED ---
    // The dark part of the bar is ALWAYS based on time elapsed.
    let timeElapsedDuration;
    if (isCompleted) {
        // If it's 100% complete, the whole bar is dark green.
        timeElapsedDuration = totalDuration;
    }
    else if (today < startDate) {
        timeElapsedDuration = 0; // Task hasn't started, no time elapsed
    } else {
        const elapsedDays = differenceInDays(today, startDate) + 1;
        timeElapsedDuration = Math.min(elapsedDays, totalDuration); // Cap at total duration
    }
    // If today is past the end date, the elapsed time is the total duration
    if (today > endDate && !isCompleted) {
        timeElapsedDuration = totalDuration;
    }
    
    const remainingDuration = totalDuration - timeElapsedDuration;
    // --- END REVISION ---

    // Colors are still determined by the task's STATUS (Completed/Overdue)
    let progressFillColor = "hsl(var(--secondary-foreground))";
    let remainingFillColor = "hsl(var(--muted))"; 

    if (isCompleted) {
        progressFillColor = "hsl(var(--success))";
        remainingFillColor = "hsla(var(--success), 0.4)";
    } else if (isOverdue) {
        progressFillColor = "hsl(var(--destructive))";
        remainingFillColor = "hsla(var(--destructive), 0.4)";
    }

    return {
      ...task,
      name: task.TaskName,
      rangeForTooltip: [startDate, endDate],
      offset: offsetDuration,
      progressDuration: timeElapsedDuration,
      remainingDuration: remainingDuration,
      progressFillColor: progressFillColor,
      remainingFillColor: remainingFillColor,
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
          tickFormatter={(value) => value ? value.slice(0, 20) : ''}
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
        <Bar dataKey="progressDuration" stackId="a" isAnimationActive={false} radius={[4, 0, 0, 4]}>
            {chartData.map((data, index) => 
                <Cell 
                    key={`cell-progress-${index}`} 
                    fill={data.progressFillColor}
                    onClick={() => onTaskClick(data)}
                    className="cursor-pointer"
                />
            )}
        </Bar>
        <Bar dataKey="remainingDuration" stackId="a" isAnimationActive={false} radius={[0, 4, 4, 0]}>
            {chartData.map((data, index) => 
                <Cell 
                    key={`cell-remaining-${index}`} 
                    fill={data.remainingFillColor}
                    onClick={() => onTaskClick(data)}
                    className="cursor-pointer"
                />
            )}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export { TaskGanttChart }
