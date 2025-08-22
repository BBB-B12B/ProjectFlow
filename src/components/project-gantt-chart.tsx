"use client"

import { ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { chartConfig } from "@/lib/utils"
import { Project } from "@/lib/types"
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek } from "date-fns"
import { useRouter } from "next/navigation"

const CustomGanttTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md w-max">
          <p className="font-bold">{data.name}</p>
          <p className="text-muted-foreground">
            {format(new Date(data.rangeForTooltip[0]), "MMM d, yyyy")} - {format(new Date(data.rangeForTooltip[1]), "MMM d, yyyy")}
          </p>
        </div>
      );
    }
    return null;
  };

const ProjectGanttChart = ({ projects, timeframe }: { projects: Project[]; timeframe: string; }) => {
  const router = useRouter(); // Initialize router

  if (!projects || projects.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No projects to display.</p></div>;
  }
  
  const allDates = projects.flatMap(p => p.startDate && p.endDate ? [new Date(p.startDate), new Date(p.endDate)] : []);
  if (allDates.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No projects with valid dates.</p></div>;
  }

  let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  if (timeframe === 'weekly') {
    minDate = startOfWeek(minDate, { weekStartsOn: 1 });
    maxDate = endOfWeek(maxDate, { weekStartsOn: 1 });
  } else {
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);
  }

  const chartData = projects.map(project => {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    
    const offsetDuration = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    
    return {
      ...project,
      rangeForTooltip: [startDate, endDate],
      offset: offsetDuration,
      duration: totalDuration,
      fillColor: project.status === 'จบงานแล้ว' ? "hsl(var(--success))" : "hsl(var(--secondary-foreground))"
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

  const handleBarClick = (data: any) => {
    router.push(`/project/${data.id}`);
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
        <Bar dataKey="duration" stackId="a" isAnimationActive={false} radius={4}>
            {chartData.map((data, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={data.fillColor} 
                className="cursor-pointer" 
                onClick={() => handleBarClick(data)}
              />
            ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export { ProjectGanttChart }
