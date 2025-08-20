
"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Project } from "@/lib/types"
import { addDays, differenceInDays, format, parseISO, startOfWeek, addWeeks } from "date-fns"

interface GanttChartProps {
  projects: Project[]
  timeframe: string
}

export function ProjectGanttChart({ projects, timeframe }: GanttChartProps) {
  const router = useRouter();

  const handleBarClick = (data: any) => {
    if (data && data.id) {
      router.push(`/project/${data.id}`);
    }
  };

  const { data, yAxisTicks, xAxisDomain, xAxisTicks } = useMemo(() => {
    if (projects.length === 0) {
      return { data: [], yAxisTicks: [], xAxisDomain: [0, 0], xAxisTicks: [] };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const chartData = projects.map((project) => {
      const startDate = parseISO(project.startDate)
      const endDate = parseISO(project.endDate)
      const duration = differenceInDays(endDate, startDate) || 1;
      
      const completedDuration = differenceInDays(today, startDate)
      const progress = Math.min(Math.max(completedDuration / duration, 0), 1)
      const isComplete = today > endDate;

      return {
        id: project.id,
        name: project.name,
        range: [startDate.getTime(), endDate.getTime()],
        duration,
        progress: Math.round(progress * 100),
        status: isComplete ? 'จบงานแล้ว' : project.Status || 'กำลังดำเนินการ'
      }
    });

    const allDates = projects.flatMap(p => [parseISO(p.startDate), parseISO(p.endDate)])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    const yAxisTicks = chartData.map(d => d.name)
    const xAxisDomain = [minDate.getTime(), maxDate.getTime()]
    
    let xAxisTicks: number[] = [];
    if (timeframe === 'Weekly') {
        let currentTick = startOfWeek(minDate, { weekStartsOn: 1 });
        while (currentTick <= maxDate) {
            xAxisTicks.push(currentTick.getTime());
            currentTick = addWeeks(currentTick, 1);
        }
    }

    return { data: chartData, yAxisTicks, xAxisDomain, xAxisTicks }
  }, [projects, timeframe])

  if (projects.length === 0) {
      return (
        <div className="flex justify-center items-center h-[300px]">
            <p>No projects found. Try seeding data.</p>
        </div>
      )
  }

  return (
    <ResponsiveContainer width="100%" height={100 + projects.length * 50}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        barCategoryGap="35%"
        onClick={(e) => handleBarClick(e.activePayload?.[0]?.payload)}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis 
          type="number" 
          domain={xAxisDomain}
          tickFormatter={(time) => format(new Date(time), timeframe === 'Monthly' ? 'MMM yyyy' : 'MMM d')}
          scale="time"
          ticks={xAxisTicks.length > 0 ? xAxisTicks : undefined}
          interval={timeframe === 'Monthly' ? 0 : 'preserveStartEnd'}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={100} 
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ payload }) => {
            if (payload && payload.length > 0) {
              const { name, range, progress, status } = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm text-sm w-48">
                  <p className="font-bold mb-2">{name}</p>
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex justify-between">
                      <span>Start:</span> 
                      <span className="font-medium text-foreground">{format(new Date(range[0]), 'MMM d, yyyy')}</span>
                    </p>
                    <p className="text-muted-foreground flex justify-between">
                      <span>End:</span>
                      <span className="font-medium text-foreground">{format(new Date(range[1]), 'MMM d, yyyy')}</span>
                    </p>
                    <p className="text-muted-foreground flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium text-foreground">{status}</span>
                    </p>
                  </div>
                  <p className="text-muted-foreground mt-2">Progress: {progress}%</p>
                  <div className="w-full bg-secondary rounded-full h-2.5 mt-1">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="range" radius={4} className="cursor-pointer">
          {data.map((entry, index) => {
            const range = entry.range as number[];
            const progressWidth = ((range[1] - range[0]) * entry.progress) / 100
            const progressEnd = range[0] + progressWidth
            
            return (
              <Bar
                key={`cell-${entry.id || index}`}
                fill="hsl(var(--secondary))"
              >
              </Bar>
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
