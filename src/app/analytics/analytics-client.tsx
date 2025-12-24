"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useTheme } from "next-themes"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { normalizeAssigneeName, formatAssigneeDisplayName } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  TaskStatusChart,
  TaskAssigneeChart,
  ProjectProgressChart,
  TaskPrioritizationMatrix,
  BurndownChart,
  FilteredTasksTable
} from "@/components/charts"
import { ProjectWorkloadChart, EmployeeWorkloadChart } from "@/components/analytics/workload-charts"
import { WorkHoursTrendChart } from "@/components/analytics/trend-chart"
import { TaskPerformanceTable } from "@/components/analytics/task-performance-table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { Loader2, FilterX, CalendarIcon } from "lucide-react"
import { format, getISOWeek, getYear } from "date-fns"
import { ProjectTrackingProgress, Task, Project } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { SingleSelectAutocomplete } from "@/components/ui/single-select-autocomplete"
import { cn } from "@/lib/utils"

// Type definitions removed (Imported)

interface AnalyticsClientProps {
  initialTasks: Task[]
  initialProjects: Project[]
}

interface FilterState {
  status: string | null
  assignee: string | null
  projectId: string | null
  priorityQuadrant: string | null
  dateRange: { start: Date | null; end: Date | null }
  progressRange: { min: number; max: number }
}

export default function AnalyticsClient({ initialTasks, initialProjects }: AnalyticsClientProps) {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === "system" ? systemTheme : theme

  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(initialProjects)

  const [logs, setLogs] = useState<ProjectTrackingProgress[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  const [filters, setFilters] = useLocalStorage<FilterState>('analytics_filters', {
    status: null,
    assignee: null,
    projectId: null,
    priorityQuadrant: null,
    dateRange: { start: null, end: null },
    progressRange: { min: 0, max: 100 },
  })

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"week" | "month">("week")

  const [activeFilterSource, setActiveFilterSource] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Fetch Logs
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoadingLogs(true)
        const qLogs = query(collection(db, 'projectTrackingProgress'), orderBy('date', 'desc'))
        const querySnapshot = await getDocs(qLogs)
        const logsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProjectTrackingProgress[]
        setLogs(logsData)
      } catch (error) {
        console.error("Error fetching logs:", error)
      } finally {
        setLoadingLogs(false)
      }
    }
    fetchLogs()
  }, [])

  // Filter Logic (Same as before)
  const updateFilter = useCallback((key: keyof FilterState, value: any, source?: string) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value }
      if (key === 'projectId') setSelectedProjectId(value)
      if (key === 'assignee') setSelectedEmployee(value)
      return newState
    })
    setActiveFilterSource(source || null)
  }, [])

  const handleStatusFilter = (status: string | null) => updateFilter("status", status, "status-chart")
  const handleAssigneeFilter = (assignee: string | null) => updateFilter("assignee", assignee, "assignee-chart")
  const handleProjectFilter = (projectId: string | null) => updateFilter("projectId", projectId, "progress-chart")
  const handlePriorityQuadrantFilter = (quadrant: string | null) => updateFilter("priorityQuadrant", quadrant, "matrix-chart")
  const handleDateRangeFilter = (range: any, source?: string) => updateFilter("dateRange", range, source || "burndown-chart")
  const handleProgressRangeFilter = (range: any, source?: string) => updateFilter("progressRange", range, source || "progress-filter")

  const handleProjectWorkloadClick = (data: { id: string }) => {
    const newValue = filters.projectId === data.id ? null : data.id
    updateFilter("projectId", newValue, "project-workload")
  }
  const handleEmployeeWorkloadClick = (data: { id: string }) => {
    const newValue = filters.assignee === data.id ? null : data.id
    updateFilter("assignee", newValue, "employee-workload")
  }

  const handleClearFilters = () => {
    setFilters({
      status: null,
      assignee: null,
      projectId: null,
      priorityQuadrant: null,
      dateRange: { start: null, end: null },
      progressRange: { min: 0, max: 100 },
    })
    setSelectedProjectId(null)
    setSelectedEmployee(null)
    setActiveFilterSource(null)
  }

  // Effect to Apply Filters
  useEffect(() => {
    const validProjects = initialProjects.filter(p => {
      if (p.isDarkModeOnly === undefined) return true
      return (p.isDarkModeOnly === true && currentTheme === 'dark') ||
        (p.isDarkModeOnly === false && currentTheme === 'light')
    })
    const validProjectIds = new Set(validProjects.map(p => p.id))

    let resultTasks = initialTasks.filter(t => t.projectId ? validProjectIds.has(t.projectId) : true)

    if (filters.status) resultTasks = resultTasks.filter(t => t.Status?.toLowerCase() === filters.status?.toLowerCase())
    if (filters.projectId) resultTasks = resultTasks.filter(t => t.projectId === filters.projectId)
    if (filters.priorityQuadrant) {
      resultTasks = resultTasks.filter(task => {
        const effort = task.Effort || 0
        const effect = task.Effect || 0
        let q = ""
        if (effort <= 5 && effect > 5) q = 'quick-wins'
        else if (effort > 5 && effect > 5) q = 'major-projects'
        else if (effort <= 5 && effect <= 5) q = 'fill-ins'
        else if (effort > 5 && effect <= 5) q = 'thankless-tasks'
        return q === filters.priorityQuadrant
      })
    }
    if (filters.assignee) {
      resultTasks = resultTasks.filter(t => {
        const names = t.Assignee?.split(',').map(s => s.trim()).filter(Boolean) || []
        if (filters.assignee === 'Unassigned') return names.length === 0
        return names.includes(filters.assignee!)
      })
    }

    if (filters.dateRange.start || filters.dateRange.end) {
      resultTasks = resultTasks.filter(t => {
        const taskDate = t.EndDate || t.StartDate;
        if (!taskDate) return false;
        const date = new Date(taskDate);
        if (filters.dateRange.start) {
          const start = new Date(filters.dateRange.start);
          start.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
          if (date < start) return false;
        }
        if (filters.dateRange.end) {
          const end = new Date(filters.dateRange.end);
          end.setHours(23, 59, 59, 999); // Include full day
          if (date > end) return false;
        }
        return true;
      });
    }
    // Date & Progress Range logic omitted for brevity (Keep existing if needed, but for now simple)

    setFilteredProjects(validProjects)
    setFilteredTasks(resultTasks)

    // Sync external states
    setSelectedProjectId(filters.projectId)
    setSelectedEmployee(filters.assignee)

  }, [currentTheme, initialProjects, initialTasks, filters])

  // --- Derived Data ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.projectId && log.projectId !== filters.projectId) return false
      if (filters.assignee && log.trackerName !== filters.assignee) return false
      return true
    })
  }, [logs, filters.projectId, filters.assignee])

  const projectRankingData = useMemo(() => {
    const map = new Map<string, number>()
    filteredLogs.forEach(l => map.set(l.projectId, (map.get(l.projectId) || 0) + l.hoursWorked))
    return Array.from(map.entries())
      .map(([pid, h]) => ({ id: pid, name: initialProjects.find(p => p.id === pid)?.name || pid, hours: h }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
  }, [filteredLogs, initialProjects])

  const employeeRankingData = useMemo(() => {
    const map = new Map<string, number>()
    filteredLogs.forEach(l => map.set(l.trackerName, (map.get(l.trackerName) || 0) + l.hoursWorked))
    return Array.from(map.entries())
      .map(([name, h]) => ({ id: name, name, hours: h }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
  }, [filteredLogs])

  const trendData = useMemo(() => {
    const map = new Map<string, number>()
    filteredLogs.forEach(l => {
      const d = new Date(l.date)
      const year = getYear(d)
      let key = ""
      if (viewMode === 'week') {
        const w = getISOWeek(d)
        key = `${year}-W${w}`
      } else {
        key = format(d, 'yyyy-MM')
      }
      map.set(key, (map.get(key) || 0) + l.hoursWorked)
    })
    return Array.from(map.entries()).map(([k, h]) => ({ name: k, key: k, hours: h })).sort((a, b) => a.key.localeCompare(b.key))
  }, [filteredLogs, viewMode])

  const taskTableData = useMemo(() => {
    const hoursMap = new Map<string, number>()
    filteredLogs.forEach(l => hoursMap.set(l.taskId, (hoursMap.get(l.taskId) || 0) + l.hoursWorked))

    return filteredTasks.map(t => ({
      ...t,
      // If filtering by Assignee, show only that name in the table to avoid confusion
      Assignee: filters.assignee ? filters.assignee : t.Assignee,
      projectName: initialProjects.find(p => p.id === t.projectId)?.name || "Unknown",
      totalHours: hoursMap.get(t.id) || 0
    })).sort((a, b) => b.totalHours - a.totalHours) as any // Casting to avoid strict literal type check on Status
  }, [filteredTasks, filteredLogs, initialProjects, filters.assignee])

  const totalHours = useMemo(() => filteredLogs.reduce((acc, l) => acc + l.hoursWorked, 0), [filteredLogs])
  const projectNamesMap = new Map(filteredProjects.map(p => [p.id, p.name]))

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  }, []);

  const assignees = useMemo(() => {
    return Array.from(new Set(initialTasks.flatMap(t => t.Assignee?.split(',').map(s => s.trim()).filter(Boolean) || []))).sort()
  }, [initialTasks])

  const getFilterBadgeColor = (type: string) => {
    if (activeFilterSource === type) return "px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ring-2 ring-purple-400 dark:bg-purple-900/50 dark:text-purple-300 dark:ring-purple-500"
    return "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
  const hasActiveFilters = () => Object.values(filters).some(v => v && (typeof v === 'object' ? (v.start || v.min > 0 || v.max < 100) : true))

  // Metrics for Cards
  const activeProjectCount = useMemo(() => {
    return new Set(filteredTasks.map(t => t.projectId)).size
  }, [filteredTasks])

  const activeEmployeeCount = useMemo(() => {
    return new Set(filteredTasks.flatMap(t => t.Assignee?.split(',').map(s => s.trim()).filter(Boolean) || [])).size
  }, [filteredTasks])

  return (
    <div className="min-h-screen bg-transparent p-6 relative">
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Insights for <span className="font-semibold text-primary">{filteredProjects.length} Projects</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Card className="p-4 bg-background/60 backdrop-blur border shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Filtered Projects</div>
              <div className="text-2xl font-bold text-primary flex items-center gap-2">
                {activeProjectCount}
              </div>
            </Card>
            <Card className="p-4 bg-background/60 backdrop-blur border shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Employee Total</div>
              <div className="text-2xl font-bold text-primary flex items-center gap-2">
                {activeEmployeeCount}
              </div>
            </Card>
            <Card className="p-4 bg-background/60 backdrop-blur border shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Filtered Hours</div>
              <div className="text-2xl font-bold text-primary flex items-center gap-2">
                {loadingLogs ? <Loader2 className="animate-spin w-4 h-4" /> : totalHours.toFixed(1)}h
              </div>
            </Card>
          </div>
        </div>

        {/* Global Filters (Active) w/ Manual Slicers */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur border-0 shadow-sm mb-6 relative z-50 overflow-visible">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Project Filter */}
                <div className="w-full sm:w-[200px]">
                  <label className="text-xs font-medium mb-1 block text-gray-500">Project</label>
                  <SingleSelectAutocomplete
                    options={initialProjects.map(p => ({ value: p.id, label: p.name }))}
                    value={filters.projectId || ""}
                    onValueChange={(val) => updateFilter("projectId", val || null, "manual-slicer")}
                    placeholder="All Projects"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-[150px]">
                  <label className="text-xs font-medium mb-1 block text-gray-500">Status</label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(val) => updateFilter("status", val === "all" ? null : val, "manual-slicer")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ยังไม่เริ่ม">ยังไม่ได้เริ่ม</SelectItem>
                      <SelectItem value="กำลังดำเนินการ">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="ติดปัญหา">ติดปัญหา</SelectItem>
                      <SelectItem value="จบงานแล้ว">จบงานแล้ว</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee Filter */}
                <div className="w-full sm:w-[180px]">
                  <label className="text-xs font-medium mb-1 block text-gray-500">Assignee</label>
                  <Select
                    value={filters.assignee || "all"}
                    onValueChange={(val) => updateFilter("assignee", val === "all" ? null : val, "manual-slicer")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      {assignees.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="w-full sm:w-auto">
                  <label className="text-xs font-medium mb-1 block text-gray-500">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal h-10",
                          !filters.dateRange?.start && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.start ? (
                          filters.dateRange.end ? (
                            <>
                              {format(filters.dateRange.start, "LLL dd, y")} -{" "}
                              {format(filters.dateRange.end, "LLL dd, y")}
                            </>
                          ) : (
                            format(filters.dateRange.start, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange?.start || new Date()}
                        selected={{
                          from: filters.dateRange?.start || undefined,
                          to: filters.dateRange?.end || undefined,
                        }}
                        onSelect={(range) => updateFilter("dateRange", { start: range?.from || null, end: range?.to || null }, "manual-slicer")}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters() && (
                  <div className="mt-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FilterX className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Filters (Active) - OLD - REMOVE IF NEEDED OR KEEP AS BADGES */}
        {/* Keeping only Badges for feedback if desired, or replacing fully. I'll replace the old badge block with this new slicer block which already has the Clear button. */}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview">Task Overview</TabsTrigger>
            <TabsTrigger value="workload">Workload Analysis</TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TaskStatusChart
                tasks={filteredTasks}
                selectedStatus={filters.status}
                setSelectedStatus={handleStatusFilter}
                isHighlighted={activeFilterSource === 'status-chart'}
              />
              <TaskAssigneeChart
                tasks={filteredTasks}
                selectedAssignee={filters.assignee}
                setSelectedAssignee={handleAssigneeFilter}
                isHighlighted={activeFilterSource === 'assignee-chart'}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectProgressChart
                tasks={filteredTasks}
                projectNamesMap={projectNamesMap}
                selectedProjectId={filters.projectId}
                setSelectedProjectId={handleProjectFilter}
                isHighlighted={activeFilterSource === 'progress-chart'}
              />
              <TaskPrioritizationMatrix
                tasks={filteredTasks}
                selectedQuadrant={filters.priorityQuadrant}
                setSelectedQuadrant={handlePriorityQuadrantFilter}
                isHighlighted={activeFilterSource === 'matrix-chart'}
              />
            </div>
            <div className="grid grid-cols-1">
              <BurndownChart
                tasks={filteredTasks}
                selectedDateRange={filters.dateRange}
                setSelectedDateRange={handleDateRangeFilter}
                isHighlighted={activeFilterSource === 'burndown-chart'}
              />
            </div>
            {/* Table for Overview: FilteredTasksTable */}
            <div className="grid grid-cols-1">
              <FilteredTasksTable
                tasks={filteredTasks}
                projectNamesMap={projectNamesMap}
                filters={filters}
                onTaskClick={handleTaskClick}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Workload */}
          <TabsContent value="workload" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ProjectWorkloadChart
                data={projectRankingData}
                title="Top Projects Workload"
                description="Total hours logged per project"
                selectedId={filters.projectId}
                onBarClick={(d) => handleProjectWorkloadClick(d as any)}
              />
              <EmployeeWorkloadChart
                data={employeeRankingData}
                title="Top Employee Workload"
                description="Total hours logged per person"
                selectedId={filters.assignee}
                onBarClick={(d) => handleEmployeeWorkloadClick(d as any)}
              />
            </div>
            <div className="grid gap-6 grid-cols-1">
              <WorkHoursTrendChart
                data={trendData}
                title="Hours Trend"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            {/* Table for Workload: TaskPerformanceTable */}
            <div className="grid grid-cols-1">
              <TaskPerformanceTable
                tasks={taskTableData}
                title="Task Performance Details"
                description="Breakdown of hours by task"
              />
            </div>
          </TabsContent>
        </Tabs>

      </div>

      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={selectedTask}
        projectId={selectedTask?.projectId || ''}
        assignees={assignees}
      />
    </div>
  )
}