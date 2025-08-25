"use client"

import { ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { chartConfig } from "@/lib/utils"
import { Task } from "@/lib/types"
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isPast, isToday, differenceInDays, getISOWeek } from "date-fns"

// Custom Tooltip Content component to prevent duplication
const CustomGanttTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // All bars in a row share the same payload
      
      // Safety check for data payload
      if (!data) {
        return null;
      }

      return (
        <div className="overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md w-max">
            <p className="font-bold">{data.name}</p>
            <p className="text-muted-foreground border-b pb-1 mb-1">
              {data.rangeForTooltip ? `Due: ${format(new Date(data.rangeForTooltip[1]), "MMM d, yyyy")}` : 'Date not set'}
            </p>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">Assignee:</span>
                <span className="font-medium">{data.Assignee || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{data.ProjectType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{data.Progress || 0}%</span>
              </div>
            </div>
        </div>
      );
    }
    return null;
  };

// Custom Y-Axis Tick component for text wrapping
const CustomYAxisTick = (props: any) => {
    const { x, y, payload, width } = props;
    const text = payload.value;
    
    // Using foreignObject allows us to use standard HTML/CSS for text wrapping inside an SVG
    return (
        <foreignObject x={x - width - 10} y={y - 15} width={width} height={60}>
            <div
                style={{
                    fontSize: '12px',
                    textAlign: 'right',
                    color: 'hsl(var(--muted-foreground))',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word', // --- (1) ADDED THIS LINE FOR THAI LANGUAGE SUPPORT ---
                    whiteSpace: 'normal',
                    lineHeight: '1.2em',
                }}
            >
                {text}
            </div>
        </foreignObject>
    );
};

const TaskGanttChart = ({ tasks, timeframe, onTaskClick }: { tasks: Task[]; timeframe: string; onTaskClick: (task: Task) => void; }) => {
  if (!tasks || tasks.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No tasks to display.</p></div>;
  }
  
  const validTasks = tasks.filter(t => t.StartDate && t.EndDate);

  if (validTasks.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No tasks with valid dates.</p></div>;
  }

  const allDates = validTasks.flatMap(t => [new Date(t.StartDate), new Date(t.EndDate)]);
  let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  if (timeframe === 'weekly') {
    minDate = startOfWeek(minDate, { weekStartsOn: 1 });
    maxDate = endOfWeek(maxDate, { weekStartsOn: 1 });
  } else {
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chartData = validTasks.map(task => {
    const startDate = new Date(task.StartDate)
    const endDate = new Date(task.EndDate)
    
    const offsetDuration = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    
    const isCompleted = (task.Progress || 0) === 100;
    const dueDate = parseISO(task.EndDate);
    const isOverdue = (isPast(dueDate) && !isToday(dueDate)) && !isCompleted;

    let timeElapsedDuration;
    if (isCompleted) {
        timeElapsedDuration = totalDuration;
    }
    else if (today < startDate) {
        timeElapsedDuration = 0;
    } else {
        const elapsedDays = differenceInDays(today, startDate) + 1;
        timeElapsedDuration = Math.min(elapsedDays, totalDuration);
    }
    if (today > endDate && !isCompleted) {
        timeElapsedDuration = totalDuration;
    }
    
    const remainingDuration = totalDuration - timeElapsedDuration;

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
      const isoWeek = getISOWeek(date);
      return `${format(date, 'MMM d')} (W${isoWeek})`;
    }
    if (minDate.getUTCFullYear() !== maxDate.getUTCFullYear()) {
      return format(date, 'MMM yy');
    }
    return format(date, 'MMM');
  };

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <BarChart data={chartData} layout="vertical" stackOffset="none" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          width={180}
          tick={<CustomYAxisTick width={170} />}
          interval={0}
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
