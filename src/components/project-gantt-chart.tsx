"use client"

import { useMemo, useState } from "react"
import { ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { chartConfig } from "@/lib/utils"
import { Project, Task } from "@/lib/types"
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek } from "date-fns"
import { useRouter } from "next/navigation"
import { Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TaskGanttChart } from "./task-gantt-chart"

// T-192: เกณฑ์ default เดียวกับตัวกรองหลักของ Dashboard — เริ่มวันแรกของเดือนปัจจุบัน จบสิ้นปีปัจจุบัน
const getDefaultRangeStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};
const getDefaultRangeEnd = () => `${new Date().getFullYear()}-12-31`;

const CustomGanttTooltip = ({ active, payload, onOpenDetail }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const progress = data.totalTasks ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;
      const rawTasks: Task[] = data.tasks || [];
      // Tasks still in progress surface first (soonest deadline first); finished tasks sink to the bottom.
      const tasks = [...rawTasks].sort((a, b) => {
        const aDone = (a.Progress || 0) === 100;
        const bDone = (b.Progress || 0) === 100;
        if (aDone !== bDone) return aDone ? 1 : -1;
        const aEnd = a.EndDate ? new Date(a.EndDate).getTime() : Infinity;
        const bEnd = b.EndDate ? new Date(b.EndDate).getTime() : Infinity;
        return aEnd - bEnd;
      });
      // Scrolling/moving the mouse inside the tooltip must not bubble up to Recharts'
      // chart container — otherwise it recomputes the hovered bar and swaps the tooltip mid-scroll.
      const stopBubble = (e: any) => e.stopPropagation();
      return (
        <div
          className="overflow-hidden rounded-md border bg-popover text-sm text-popover-foreground shadow-md w-72"
          onMouseMove={stopBubble}
          onMouseOver={stopBubble}
          onMouseEnter={stopBubble}
          onWheel={stopBubble}
        >
          <div className="px-3 py-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold">{data.name}</p>
              <button
                type="button"
                className="shrink-0 rounded p-1 -mr-1 -mt-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="ดู Gantt Chart ของโปรเจกต์นี้"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail?.(data);
                }}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1 mt-1">
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">เริ่ม:</span>
                <span className="font-medium">{format(new Date(data.rangeForTooltip[0]), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">จบ:</span>
                <span className="font-medium">{format(new Date(data.rangeForTooltip[1]), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{progress}% ({data.completedTasks || 0}/{data.totalTasks || 0})</span>
              </div>
            </div>
          </div>
          {tasks.length > 0 && (
            <div className="border-t max-h-56 overflow-y-auto px-3 py-1.5 space-y-1.5">
              {tasks.map((task, index) => {
                const isDone = (task.Progress || 0) === 100;
                return (
                  <div
                    key={task.id || index}
                    className={isDone ? "rounded-md border border-transparent bg-muted/20 px-2 py-1.5 opacity-60" : "rounded-md border bg-muted/40 px-2 py-1.5"}
                  >
                    <p className={isDone ? "font-medium truncate text-muted-foreground" : "font-medium truncate"}>{task.TaskName}</p>
                    <div className="flex justify-between items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>
                        {task.StartDate ? format(new Date(task.StartDate), "MMM d") : '-'}
                        {' – '}
                        {task.EndDate ? format(new Date(task.EndDate), "MMM d, yyyy") : '-'}
                      </span>
                      <span className={isDone ? "font-medium text-muted-foreground shrink-0" : "font-medium text-foreground shrink-0"}>{task.Progress || 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

const ProjectGanttChart = ({ projects, timeframe, rangeStart, rangeEnd }: { projects: Project[]; timeframe: string; rangeStart?: string; rangeEnd?: string; }) => {
  const router = useRouter(); // Initialize router
  const [detailProject, setDetailProject] = useState<(Project & { tasks?: Task[] }) | null>(null);
  const [detailStartDate, setDetailStartDate] = useState(getDefaultRangeStart);
  const [detailEndDate, setDetailEndDate] = useState(getDefaultRangeEnd);

  const openDetail = (project: Project & { tasks?: Task[] }) => {
    setDetailProject(project);
    // เปิด popup ใหม่แต่ละครั้ง = reset กลับไปใช้เกณฑ์ default เดียวกับตัวกรองหลักเสมอ
    setDetailStartDate(getDefaultRangeStart());
    setDetailEndDate(getDefaultRangeEnd());
  };

  const detailTasks = useMemo(() => {
    const allTasks = detailProject?.tasks || [];
    if (!detailStartDate && !detailEndDate) return allTasks;
    const filterStart = detailStartDate ? new Date(detailStartDate) : null;
    const filterEnd = detailEndDate ? new Date(detailEndDate) : null;
    return allTasks.filter(t => {
      if (!t.StartDate || !t.EndDate) return false;
      const start = new Date(t.StartDate);
      const end = new Date(t.EndDate);
      if (filterStart && end < filterStart) return false;
      if (filterEnd && start > filterEnd) return false;
      return true;
    });
  }, [detailProject, detailStartDate, detailEndDate]);

  if (!projects || projects.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No projects to display.</p></div>;
  }
  
  const allDates = projects.flatMap(p => p.startDate && p.endDate ? [new Date(p.startDate), new Date(p.endDate)] : []);
  if (allDates.length === 0) {
    return <div className="flex h-[400px] w-full items-center justify-center"><p className="text-muted-foreground">No projects with valid dates.</p></div>;
  }

  // T-192: ถ้ามีช่วงกรอง (rangeStart/rangeEnd) ให้ยึดแกนเวลาตามช่วงนั้น (ต้นปี–ปลายปี) แทน auto-scale ตามข้อมูล
  const hasRange = !!(rangeStart && rangeEnd);
  let minDate = hasRange ? new Date(rangeStart!) : new Date(Math.min(...allDates.map(d => d.getTime())));
  let maxDate = hasRange ? new Date(rangeEnd!) : new Date(Math.max(...allDates.map(d => d.getTime())));

  if (timeframe === 'weekly') {
    minDate = startOfWeek(minDate, { weekStartsOn: 1 });
    maxDate = endOfWeek(maxDate, { weekStartsOn: 1 });
  } else {
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);
  }

  const totalChartDuration = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

  // T-192: เรียงแถวตามวันเริ่ม (startDate) จากเร็วสุดไปช้าสุด ให้โปรเจกต์ที่เริ่มก่อนอยู่บนสุด
  const sortedProjects = [...projects].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const chartData = sortedProjects.map(project => {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)

    // T-192: Clip แท่งให้อยู่ในกรอบแกน — งานที่เริ่มก่อน/จบหลังช่วงกรองจะถูกตัดที่ขอบ (จบที่ปลายปี)
    const clampedStart = hasRange && startDate < minDate ? new Date(minDate) : startDate;
    const clampedEnd = hasRange && endDate > maxDate ? new Date(maxDate) : endDate;

    const offsetDuration = (clampedStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    const rawDuration = (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24) + 1
    const totalDuration = Math.min(rawDuration, totalChartDuration - offsetDuration)

    return {
      ...project,
      rangeForTooltip: [startDate, endDate],
      offset: offsetDuration,
      duration: totalDuration,
      tasks: project.tasks || [],
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
    <>
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
          <ChartTooltip cursor={false} wrapperStyle={{ pointerEvents: 'auto' }} content={<CustomGanttTooltip onOpenDetail={openDetail} />} />
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
      <Dialog open={!!detailProject} onOpenChange={(open) => !open && setDetailProject(null)}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Gantt Chart: {detailProject?.name}</DialogTitle>
          </DialogHeader>
          {detailProject && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">ช่วงวันที่:</span>
                <Input type="date" value={detailStartDate} onChange={(e) => setDetailStartDate(e.target.value)} className="h-9 w-auto" />
                <span>–</span>
                <Input type="date" value={detailEndDate} onChange={(e) => setDetailEndDate(e.target.value)} className="h-9 w-auto" />
                {(detailStartDate || detailEndDate) && (
                  <Button variant="ghost" size="sm" onClick={() => { setDetailStartDate(''); setDetailEndDate(''); }}>ล้าง</Button>
                )}
              </div>
              <TaskGanttChart
                tasks={detailTasks}
                timeframe="monthly"
                onTaskClick={() => {}}
                rangeStart={detailStartDate || undefined}
                rangeEnd={detailEndDate || undefined}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ProjectGanttChart }
