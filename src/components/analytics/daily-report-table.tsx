import React, { useState, useMemo } from "react"
import { ProjectTrackingProgress, Task } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface DailyReportAnalysisTableProps {
    logs: ProjectTrackingProgress[]
    tasks: Task[]
    projectNamesMap: Map<string, string>
    allAssignees: string[]
    dateRange: { start: Date | null; end: Date | null }
}

interface GroupedDailyLog {
    id: string
    date: string
    trackerName: string
    totalHours: number
    entries: ProjectTrackingProgress[]
}

export function DailyReportAnalysisTable({
    logs,
    tasks,
    projectNamesMap,
    allAssignees,
    dateRange
}: DailyReportAnalysisTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // Optimize task lookup
    const taskLookup = useMemo(() => {
        const map = new Map<string, Task>()
        tasks.forEach(task => map.set(task.id, task))
        return map
    }, [tasks])

    // Group logs by Date + Assignee
    const groupedData = useMemo(() => {
        const groupMap = new Map<string, GroupedDailyLog>()
        let minDateMs = Infinity
        let maxDateMs = -Infinity

        logs.forEach(log => {
            // Ensure we have hours worked
            if (!log.hoursWorked || log.hoursWorked <= 0) return

            const logTime = new Date(log.date).getTime()
            if (logTime < minDateMs) minDateMs = logTime
            if (logTime > maxDateMs) maxDateMs = logTime

            const key = `${log.date}_${log.trackerName}`
            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    id: key,
                    date: log.date,
                    trackerName: log.trackerName,
                    totalHours: 0,
                    entries: []
                })
            }

            const group = groupMap.get(key)!
            group.totalHours += log.hoursWorked
            group.entries.push(log)
        })

        // Check for missing dates
        let startDate = dateRange?.start
        let endDate = dateRange?.end

        if (!startDate && logs.length > 0) startDate = new Date(minDateMs)
        if (!endDate && logs.length > 0) endDate = new Date(maxDateMs)

        if (!startDate) {
            startDate = new Date()
            startDate.setDate(startDate.getDate() - 7) // Default to last 7 days
        }
        if (!endDate) {
            endDate = new Date()
        }

        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        let end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        const today = new Date()
        today.setHours(23, 59, 59, 999)

        if (end > today) end = today

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay()
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue

            const dateStr = format(d, 'yyyy-MM-dd')
            allAssignees.forEach(assignee => {
                const key = `${dateStr}_${assignee}`
                if (!groupMap.has(key)) {
                    groupMap.set(key, {
                        id: key,
                        date: dateStr,
                        trackerName: assignee,
                        totalHours: 0,
                        entries: []
                    })
                }
            })
        }

        // Convert to array and sort by Date (Desc) then Assignee
        const sortedArray = Array.from(groupMap.values()).sort((a, b) => {
            if (a.date !== b.date) {
                return b.date.localeCompare(a.date) // Descending date
            }
            return a.trackerName.localeCompare(b.trackerName) // Ascending name
        })

        // Sort entries within each group by hours descending
        sortedArray.forEach(group => {
            group.entries.sort((a, b) => b.hoursWorked - a.hoursWorked)
        })

        return sortedArray
    }, [logs, allAssignees, dateRange])

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    if (groupedData.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No daily report logs found for the selected filters.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Daily Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-md border-0 sm:border m-0 sm:m-4 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead className="text-right">Total Hours</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedData.map(group => {
                                const isExpanded = expandedRows.has(group.id)
                                const isComplete = group.totalHours >= 8

                                return (
                                    <React.Fragment key={group.id}>
                                        {/* Main Row */}
                                        <TableRow
                                            className={`transition-colors ${group.entries.length > 0 ? 'cursor-pointer hover:bg-muted/50' : ''} ${isExpanded ? 'bg-muted/30' : ''}`}
                                            onClick={() => group.entries.length > 0 && toggleRow(group.id)}
                                        >
                                            <TableCell>
                                                {group.entries.length > 0 ? (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </Button>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {format(new Date(group.date), "EEE, MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>{group.trackerName}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {group.totalHours.toFixed(1)}h
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center items-center">
                                                    {group.totalHours >= 8 ? (
                                                        <span className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                                            ครบ 8 ชม.
                                                        </span>
                                                    ) : group.totalHours > 0 ? (
                                                        <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
                                                            <AlertCircle className="w-4 h-4 mr-1" />
                                                            ไม่ครบ 8 ชม.
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
                                                            <AlertCircle className="w-4 h-4 mr-1" />
                                                            ผิดปกติ (0.0h)
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Details Row */}
                                        {isExpanded && (
                                            <TableRow className="bg-muted/10 border-b-2 hover:bg-muted/10">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="p-4 pl-[66px]">
                                                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                                            Work Details
                                                        </h4>
                                                        <div className="rounded-md border bg-card">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="hover:bg-transparent">
                                                                        <TableHead>Project</TableHead>
                                                                        <TableHead>Task Name</TableHead>
                                                                        <TableHead className="w-[100px] text-right">Hours</TableHead>
                                                                        <TableHead className="w-[120px] text-right">Progress</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {group.entries.map(entry => {
                                                                        const task = taskLookup.get(entry.taskId)
                                                                        // Use specific projectId from log, or fallback to task.projectId, then resolve name
                                                                        const projId = entry.projectId || task?.projectId
                                                                        const projectName = projId
                                                                            ? (projectNamesMap.get(projId) || projectNamesMap.get(projId.toLowerCase()) || "Unknown Project")
                                                                            : "Unknown Project"

                                                                        const taskName = task?.TaskName || "Unknown Task"

                                                                        return (
                                                                            <TableRow key={entry.id} className="hover:bg-muted/40">
                                                                                <TableCell className="font-medium text-sm">
                                                                                    {projectName}
                                                                                </TableCell>
                                                                                <TableCell className="text-sm text-muted-foreground">
                                                                                    {taskName}
                                                                                </TableCell>
                                                                                <TableCell className="text-right font-medium text-primary">
                                                                                    {entry.hoursWorked.toFixed(1)}h
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    {entry.progressPercentage}%
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        )
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
