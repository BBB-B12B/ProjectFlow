"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Task } from "@/lib/types"

interface TaskWithHours extends Task {
    projectName?: string
    totalHours: number
}

interface PerformanceTableProps {
    tasks: TaskWithHours[]
    title?: string
    description?: string
}

export function TaskPerformanceTable({ tasks, title = "Task Performance", description = "Detailed breakdown of hours worked per task." }: PerformanceTableProps) {
    // Helper to render assignees as separate badges
    const renderAssignees = (assigneeString?: string) => {
        if (!assigneeString) return <span className="text-muted-foreground">-</span>;
        const names = assigneeString.split(',').map(name => name.trim()).filter(Boolean);
        return (
            <div className="flex flex-wrap gap-1">
                {names.map((name, index) => (
                    <Badge key={index} variant="outline" className="whitespace-nowrap">{name}</Badge>
                ))}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border h-[500px] w-full overflow-auto relative">
                    <table className="w-full caption-bottom text-sm">
                        <TableHeader className="sticky top-0 bg-secondary z-10 shadow-sm">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[300px] bg-secondary text-secondary-foreground font-semibold">Task Name</TableHead>
                                <TableHead className="bg-secondary text-secondary-foreground font-semibold">Project</TableHead>
                                <TableHead className="bg-secondary text-secondary-foreground font-semibold">Assignee</TableHead>
                                <TableHead className="bg-secondary text-secondary-foreground font-semibold">Status</TableHead>
                                <TableHead className="bg-secondary text-secondary-foreground font-semibold">Progress</TableHead>
                                <TableHead className="text-right bg-secondary text-secondary-foreground font-semibold">Total Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No tasks found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.TaskName}</TableCell>
                                        <TableCell>{task.projectName || "Unknown Project"}</TableCell>
                                        <TableCell>
                                            {renderAssignees(task.Assignee)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                task.Status === 'จบงานแล้ว' ? 'default' :
                                                    task.Status === 'กำลังดำเนินการ' ? 'secondary' : 'outline'
                                            }>
                                                {task.Status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[150px]">
                                            <div className="flex items-center gap-2">
                                                <Progress value={task.Progress || 0} className="h-2" />
                                                <span className="text-xs text-muted-foreground">{task.Progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {task.totalHours.toFixed(2)}h
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
