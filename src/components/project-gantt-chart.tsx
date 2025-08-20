"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Project } from "@/lib/types"
import { addDays, differenceInDays, format, parseISO } from "date-fns"

interface GanttChartProps {
  projects: Project[]
}

export function ProjectGanttChart({ projects }: GanttChartProps) {
  const router = useRouter();

  const handleBarClick = (data: any) => {
    if (data && data.id) {
      router.push(`/project/${data.id}`);
    }
  };

  const { data, yAxisTicks, xAxisDomain } = useMemo(() => {
    if (projects.length === 0) {
      return { data: [], yAxisTicks: [], xAxisDomain: [0, 0] };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = projects.map((project) => {
      const startDate = parseISO(project.startDate)
      const endDate = parseISO(project.endDate)
      const duration = differenceInDays(endDate, startDate)
      
      const completedDuration = differenceInDays(today, startDate)
      const progress = Math.min(Math.max(completedDuration / duration, 0), 1)
      const isComplete = today > endDate;

      return {
        id: project.id,
        name: project.name,
        range: [startDate.getTime(), endDate.getTime()],
        duration,
        progress: Math.round(progress * 100),
        status: isComplete ? 'จบงานแล้ว' : 'กำลังดำเนินการ'
      }
    });

    const allDates = projects.flatMap(p => [parseISO(p.startDate), parseISO(p.endDate)])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    const yAxisTicks = data.map(d => d.name)
    const xAxisDomain = [minDate.getTime(), maxDate.getTime()]

    return { data, yAxisTicks, xAxisDomain }
  }, [projects])

  return (
    <ResponsiveContainer width="100%" height={100 + projects.length * 50}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        barCategoryGap="35%"
        onClick={handleBarClick}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis 
          type="number" 
          domain={xAxisDomain}
          tickFormatter={(time) => format(new Date(time), 'MMM d')}
          scale="time"
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
          {data.map((entry) => {
            const range = entry.range as number[];
            const progressWidth = ((range[1] - range[0]) * entry.progress) / 100
            const progressEnd = range[0] + progressWidth
            
            return (
              <Bar
                key={`cell-${entry.id}`}
                fill="hsl(var(--secondary))"
              >
                <rect
                    fill="hsl(var(--primary))"
                    x={0}
                    y={0}
                    width={progressEnd}
                    height="100%"
                    radius={4}
                  />
              </Bar>
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
