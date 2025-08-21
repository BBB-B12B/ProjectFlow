"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { Task, TaskStatus, Project, ProjectType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, GanttChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { updateTaskStatus } from '../app/project/[id]/actions';
import { useToast } from '@/hooks/use-toast';
import { EditTaskDialog } from './edit-task-dialog';

// Dynamically import the TaskGanttChart component
const DynamicTaskGanttChart = dynamic(
  () => import('@/components/task-gantt-chart').then(mod => mod.TaskGanttChart),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

function TaskCard({ task, index, onClick }: { task: Task; index: number; onClick: () => void; }) {
    const priorityConfig: Record<ProjectType, { className: string; tooltip: string }> = {
        Main: { className: 'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30', tooltip: 'Main Project' },
        QuickWin: { className: 'border-transparent bg-success/20 text-success-dark hover:bg-success/30', tooltip: 'Quick Win' },
        Fillin: { className: 'border-transparent bg-warning/20 text-warning-dark hover:bg-warning/30', tooltip: 'Fill-in Task' },
        Thankless: { className: 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted/60', tooltip: 'Thankless Task' },
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-4 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    onClick={onClick}
                >
                    <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <p className="font-medium text-card-foreground">{task.TaskName}</p>
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger>
                                            <Badge className={cn('whitespace-nowrap', priorityConfig[task.ProjectType]?.className)}>
                                                {task.ProjectType}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{priorityConfig[task.ProjectType]?.tooltip}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Due: {format(parseISO(task.EndDate), 'MMM d, yyyy')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
  
function TaskColumn({ title, tasks, droppableId, onTaskClick }: { title: string; tasks: Task[]; droppableId: string; onTaskClick: (task: Task) => void; }) {
    const statusConfig: Record<TaskStatus, { borderColor: string }> = {
        'หยุดงาน': { borderColor: 'border-t-destructive' },
        'กำลังดำเนินการ': { borderColor: 'border-t-accent' },
        'จบงานแล้ว': { borderColor: 'border-t-success' },
        'ยังไม่ได้เริ่ม': { borderColor: 'border-t-primary/50' },
        '': { borderColor: 'border-t-muted' },
    };
    const statusMap: Record<string, TaskStatus> = { 'To Do': 'ยังไม่ได้เริ่ม', 'In Progress': 'กำลังดำเนินการ', 'Done': 'จบงานแล้ว' };

    return (
        <Droppable droppableId={droppableId}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                        "flex h-full flex-col gap-4 rounded-lg bg-card p-4 border-t-4",
                        statusConfig[statusMap[title]] || 'border-t-muted',
                        snapshot.isDraggingOver ? 'bg-accent/10' : ''
                    )}
                >
                    <h3 className="font-semibold text-lg text-foreground">{title} <span className='text-sm font-normal text-muted-foreground'>({tasks.length})</span></h3>
                    <div className="flex flex-1 flex-col">
                        {tasks.length > 0 ? tasks.map((task, index) => (
                            <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} />
                        )) : <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>}
                        {provided.placeholder}
                    </div>
                </div>
            )}
        </Droppable>
    );
}

export function ProjectDetailsClient({ tasks: initialTasks, assignees }: { tasks: Task[]; assignees: string[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    const { toast } = useToast();
    const [timeframe, setTimeframe] = useState('monthly');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const statusMap: Record<string, TaskStatus> = { 'to-do': 'ยังไม่ได้เริ่ม', 'in-progress': 'กำลังดำเนินการ', 'done': 'จบงานแล้ว' };
        const newStatus = statusMap[destination.droppableId];
        
        const movedTask = tasks.find(t => t.id === draggableId);
        if (!movedTask) return;
        
        const originalTasks = tasks;
        const newTasks = tasks.map(t => t.id === draggableId ? { ...t, Status: newStatus } : t);
        setTasks(newTasks); // Optimistic update

        try {
            await updateTaskStatus(draggableId, newStatus);
            toast({ title: "Success!", description: "Task status updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update failed", description: "Could not update task status." });
            setTasks(originalTasks); // Revert on failure
        }
    };
    
    const tasksByColumn = {
        'to-do': tasks.filter((t) => t.Status === 'ยังไม่ได้เริ่ม'),
        'in-progress': tasks.filter((t) => t.Status === 'กำลังดำเนินการ'),
        'done': tasks.filter((t) => t.Status === 'จบงานแล้ว'),
    };

    return (
        <>
            <Tabs defaultValue="cards">
                <div className="flex justify-end">
                    <TabsList>
                        <TabsTrigger value="cards"><LayoutGrid className="w-4 h-4 mr-2" />Cards</TabsTrigger>
                        <TabsTrigger value="gantt"><GanttChart className="w-4 h-4 mr-2" />Gantt Chart</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="cards" className="mt-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="grid flex-1 grid-cols-1 items-start gap-6 md:grid-cols-3">
                            <TaskColumn title="To Do" tasks={tasksByColumn['to-do']} droppableId="to-do" onTaskClick={handleTaskClick}/>
                            <TaskColumn title="In Progress" tasks={tasksByColumn['in-progress']} droppableId="in-progress" onTaskClick={handleTaskClick}/>
                            <TaskColumn title="Done" tasks={tasksByColumn['done']} droppableId="done" onTaskClick={handleTaskClick}/>
                        </div>
                    </DragDropContext>
                </TabsContent>
                <TabsContent value="gantt" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-end">
                                <RadioGroup defaultValue="monthly" onValueChange={setTimeframe} className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="monthly" id="monthly" />
                                        <Label htmlFor="monthly">Monthly</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="weekly" id="weekly" />
                                        <Label htmlFor="weekly">Weekly</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <DynamicTaskGanttChart tasks={tasks} timeframe={timeframe} onTaskClick={handleTaskClick} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <EditTaskDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} task={selectedTask} assignees={assignees} />
        </>
    )
}
