"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// --- (1) IMPORT THE NEW Editor TYPE ---
import type { Task, TaskStatus, Project, ProjectType, Presence, Editor } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, GanttChart, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { updateTaskStatus } from '@/app/project/[id]/actions';
import { useToast } from '@/hooks/use-toast';
import { EditTaskDialog } from './edit-task-dialog';
import { Button } from '@/components/ui/button';
import { BackButton } from './back-button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


const DynamicTaskGanttChart = dynamic(
  () => import('@/components/task-gantt-chart').then(mod => mod.TaskGanttChart),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

// --- (2) UPDATE TaskCard to accept a map of editors ---
function TaskCard({ task, index, onClick, editors }: { task: Task; index: number; onClick: () => void; editors?: { [userId: string]: Editor } | null }) {
    const priorityConfig: Record<ProjectType, { className: string; tooltip: string }> = {
        Main: { className: 'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30', tooltip: 'Main Project' },
        QuickWin: { className: 'border-transparent bg-success/20 text-success-dark hover:bg-success/30', tooltip: 'Quick Win' },
        Fillin: { className: 'border-transparent bg-warning/20 text-warning-dark hover:bg-warning/30', tooltip: 'Fill-in Task' },
        Thankless: { className: 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted/60', tooltip: 'Thankless Task' },
    };

    const isCompleted = (task.Progress || 0) === 100;
    const dueDate = parseISO(task.EndDate);
    const isOverdue = (isPast(dueDate) && !isToday(dueDate)) && !isCompleted;
    const assigneeInitials = task.Assignee?.split(',').map(name => name.trim().charAt(0).toUpperCase()).join('') || '?';

    // Get an array of active editors, if any
    const activeEditors = editors ? Object.values(editors) : [];

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
                    <Card className={cn(
                        "cursor-pointer hover:shadow-md relative",
                        isCompleted ? "bg-success/10 border-success/50" : "",
                        isOverdue ? "bg-destructive/10 border-destructive/50" : "",
                        activeEditors.length > 0 ? "border-blue-500 border-2" : "" // Highlight if anyone is editing
                        )}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <p className="font-medium text-card-foreground">{task.TaskName}</p>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <Badge className={cn('whitespace-nowrap', priorityConfig[task.ProjectType]?.className)}>
                                            {task.ProjectType}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{priorityConfig[task.ProjectType]?.tooltip}</p></TooltipContent>
                                </Tooltip>
                            </div>
                            <div className='space-y-2'>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <p>Due: {format(dueDate, 'MMM d, yyyy')}</p>
                                    <p>{task.Progress || 0}%</p>
                                </div>
                                <Progress value={task.Progress || 0} className="h-2" indicatorClassName={cn(isCompleted ? "bg-success" : "", isOverdue ? "bg-destructive" : "")} />
                            </div>
                            <div className="flex items-center justify-end">
                                <div className="flex items-center -space-x-2">
                                    {/* --- (3) RENDER AVATARS FOR ALL ACTIVE EDITORS --- */}
                                    {activeEditors.map((editor) => {
                                        const editorInitials = editor.userName?.split(' ').pop()?.charAt(0) || '!';
                                        return (
                                            <Tooltip key={editor.userId} delayDuration={0}>
                                                <TooltipTrigger>
                                                    <Avatar className="h-7 w-7 border-2 border-blue-500">
                                                        <AvatarImage src={editor.avatarUrl} alt={editor.userName} />
                                                        <AvatarFallback className="text-xs bg-blue-500 text-white">{editorInitials}</AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{editor.userName} is editing...</p></TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger>
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback>{assigneeInitials}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{task.Assignee || 'Unassigned'}</p></TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
  
function TaskColumn({ title, tasks, droppableId, onTaskClick, presenceData }: { title: string; tasks: Task[]; droppableId: string; onTaskClick: (task: Task) => void; presenceData: Record<string, Presence> }) {
    const statusConfig: Record<TaskStatus, { borderColor: string }> = {
        'หยุดงาน': { borderColor: 'border-t-destructive' },
        'กำลังดำเนินการ': { borderColor: 'border-t-accent' },
        'จบงานแล้ว': { borderColor: 'border-t-success' },
        'ยังไม่ได้เริ่ม': { borderColor: 'border-t-primary/50' },
        '': { borderColor: 'border-t-muted' },
    };
    const statusMap: Record<string, TaskStatus> = { 'To Do': 'ยังไม่ได้เริ่ม', 'In Progress': 'กำลังดำเนินการ', 'Done': 'จบงานแล้ว' };

    return (
        <div className={cn("flex h-full flex-col rounded-lg bg-card p-4 border-t-4", statusConfig[statusMap[title]] || 'border-t-muted')}>
            <h3 className="font-semibold text-lg text-foreground mb-4">{title} <span className='text-sm font-normal text-muted-foreground'>({tasks.length})</span></h3>
            <Droppable droppableId={droppableId}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn("flex flex-1 flex-col", snapshot.isDraggingOver ? 'bg-accent/10' : '')}
                    >
                        {tasks.length > 0 ? tasks.map((task, index) => (
                            <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} editors={presenceData[task.id]?.editors} />
                        )) : <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export function ProjectDetailsClient({ project, tasks: initialTasks, assignees }: { project: Project, tasks: Task[]; assignees: string[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    // --- (4) UPDATE THE STATE TYPE FOR PRESENCE DATA ---
    const [presenceData, setPresenceData] = useState<Record<string, Presence>>({});
    const { toast } = useToast();
    const [timeframe, setTimeframe] = useState('monthly');
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        if (!project.id) return;

        const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', project.id));
        const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
            const taskList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    TaskName: data.TaskName || '',
                    Status: data.Status || '',
                    EndDate: data.EndDate || '',
                    StartDate: data.StartDate || '',
                    ProjectType: data.ProjectType || 'Thankless',
                    Assignee: data.Assignee || '',
                    Category: data.Category || '',
                    Owner: data.Owner || '',
                    Want: data.Want || '',
                    Progress: data.Progress || 0,
                    projectId: data.projectId,
                    Effect: data.Effect || 0,
                    Effort: data.Effort || 0,
                } as Task;
            });
            setTasks(taskList);
        });

        const presenceQuery = query(collection(db, 'presence'));
        const unsubscribePresence = onSnapshot(presenceQuery, (snapshot) => {
            const presences: Record<string, Presence> = {};
            snapshot.forEach((doc) => {
                // Also check if the 'editors' field is not empty before adding
                const data = doc.data() as Presence;
                if (data.editors && Object.keys(data.editors).length > 0) {
                    presences[doc.id] = data;
                }
            });
            setPresenceData(presences);
        });


        return () => {
            unsubscribeTasks();
            unsubscribePresence();
        };

    }, [project.id]);

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsTaskDialogOpen(true);
    };

    const handleNewTask = () => {
        setSelectedTask(null);
        setIsTaskDialogOpen(true);
    };

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const statusMap: Record<string, TaskStatus> = { 'to-do': 'ยังไม่ได้เริ่ม', 'in-progress': 'กำลังดำเนินการ', 'done': 'จบงานแล้ว' };
        const newStatus = statusMap[destination.droppableId];
        
        try {
            await updateTaskStatus(draggableId, newStatus);
            toast({ title: "Success!", description: "Task status updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update failed", description: "Could not update task status." });
        }
    };
    
    const tasksByColumn = {
        'to-do': tasks.filter((t) => t.Status === 'ยังไม่ได้เริ่ม'),
        'in-progress': tasks.filter((t) => t.Status === 'กำลังดำเนินการ'),
        'done': tasks.filter((t) => t.Status === 'จบงานแล้ว'),
    };

    if (!isClient) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                </div>
                <Tabs defaultValue="cards">
                    <div className="flex items-center justify-end gap-4">
                        <TabsList>
                            <TabsTrigger value="cards"><LayoutGrid className="w-4 h-4 mr-2" />Cards</TabsTrigger>
                            <TabsTrigger value="gantt"><GanttChart className="w-4 h-4 mr-2" />Gantt Chart</TabsTrigger>
                        </TabsList>
                        <Button onClick={handleNewTask}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    </div>
                    <TabsContent value="cards" className="mt-4">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                                <div className="md:w-1/3 w-full">
                                    <TaskColumn title="To Do" tasks={tasksByColumn['to-do']} droppableId="to-do" onTaskClick={handleEditTask} presenceData={presenceData}/>
                                </div>
                                <div className="md:w-1/3 w-full">
                                    <TaskColumn title="In Progress" tasks={tasksByColumn['in-progress']} droppableId="in-progress" onTaskClick={handleEditTask} presenceData={presenceData}/>
                                </div>
                                <div className="md:w-1/3 w-full">
                                    <TaskColumn title="Done" tasks={tasksByColumn['done']} droppableId="done" onTaskClick={handleEditTask} presenceData={presenceData}/>
                                </div>
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
                                <DynamicTaskGanttChart tasks={tasks} timeframe={timeframe} onTaskClick={handleEditTask} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <EditTaskDialog 
                    isOpen={isTaskDialogOpen} 
                    onOpenChange={setIsTaskDialogOpen} 
                    task={selectedTask} 
                    projectId={project.id} 
                    assignees={assignees} 
                />
            </div>
        </TooltipProvider>
    )
}
