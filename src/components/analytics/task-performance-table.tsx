import { useState } from "react"
import { ArrowUpDown } from "lucide-react"
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

type SortKey = 'TaskName' | 'projectName' | 'Assignee' | 'Status' | 'Progress' | 'totalHours';
type SortDirection = 'asc' | 'desc';

export function TaskPerformanceTable({ tasks, title = "Task Performance", description = "Detailed breakdown of hours worked per task." }: PerformanceTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'totalHours', direction: 'desc' });

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = a[key] || '';
        let bValue: any = b[key] || '';

        // Handle string comparison nicely
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

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

    const renderHeader = (label: string, key: SortKey, alignRight = false) => (
        <TableHead
            className={`bg-secondary text-secondary-foreground font-semibold cursor-pointer hover:bg-secondary/80 transition-colors ${alignRight ? 'text-right' : ''}`}
            onClick={() => handleSort(key)}
        >
            <div className={`flex items-center gap-1 ${alignRight ? 'justify-end' : ''}`}>
                {label}
                <ArrowUpDown className="h-3 w-3" />
            </div>
        </TableHead>
    );

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
                                {renderHeader("Task Name", "TaskName")}
                                {renderHeader("Project", "projectName")}
                                {renderHeader("Assignee", "Assignee")}
                                {renderHeader("Status", "Status")}
                                {renderHeader("Progress", "Progress")}
                                {renderHeader("Total Hours", "totalHours", true)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No tasks found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedTasks.map((task) => (
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
