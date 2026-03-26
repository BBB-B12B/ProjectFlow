"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable } from './strict-mode-droppable';
// --- (1) IMPORT THE NEW Editor TYPE ---
import type { Task, TaskStatus, Project, ProjectType, Presence, Editor, AssigneeGroup } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, GanttChart, PlusCircle, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { updateTaskStatus, updateTaskOrder } from '@/app/project/[id]/actions';
import { useToast } from '@/hooks/use-toast';
import { EditTaskDialog } from './edit-task-dialog';
import { Button } from '@/components/ui/button';
import { BackButton } from './back-button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { TaskChecklist } from './task-checklist';
import { TaskComments } from './task-comments';
import Link from 'next/link';


const DynamicTaskGanttChart = dynamic(
    () => import('@/components/task-gantt-chart').then(mod => mod.TaskGanttChart),
    { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

function DropIndicator() {
    return <div className="h-0.5 w-full bg-primary my-1 rounded-full" />;
}

// ... (TaskCard modification remains same, skipping to TaskColumn)

// --- (2) UPDATE TaskCard to accept a map of editors ---
function TaskCard({ task, index, onClick, editors, assigneeGroups, onMove, isMoving }: { task: Task; index: number; onClick: () => void; editors?: { [userId: string]: Editor } | null; assigneeGroups: AssigneeGroup[]; onMove: (taskId: string, direction: 'up' | 'down') => void; isMoving?: boolean }) {
    const priorityConfig: Record<ProjectType, { className: string; tooltip: string }> = {
        Main: { className: 'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30', tooltip: 'Main Project' },
        QuickWin: { className: 'border-transparent bg-success/20 text-success-dark hover:bg-success/30', tooltip: 'Quick Win' },
        Fillin: { className: 'border-transparent bg-warning/20 text-warning-dark hover:bg-warning/30', tooltip: 'Fill-in Task' },
        Thankless: { className: 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted/60', tooltip: 'Thankless Task' },
    };

    const isCompleted = (task.Progress || 0) === 100;
    const dueDate = parseISO(task.EndDate);
    const isOverdue = (isPast(dueDate) && !isToday(dueDate)) && !isCompleted;


    // Check if assignee matches a group
    const assigneesList = task.Assignee?.split(',').map(name => name.trim()).filter(Boolean).sort().join(',') || '';
    const matchedGroup = assigneeGroups.find(group => {
        const groupMembers = group.members.map(m => m.trim()).sort().join(',');
        return groupMembers === assigneesList;
    });

    const assigneeInitials = matchedGroup ? matchedGroup.name : (task.Assignee?.split(',').map(name => name.trim().charAt(0).toUpperCase()).join('') || '?');

    // Get an array of active editors, ensuring userId is present
    const activeEditors = editors ? Object.entries(editors).map(([key, value]) => ({
        ...value,
        userId: value.userId || key
    })) : [];

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => {
                const style = {
                    ...provided.draggableProps.style,
                    cursor: 'grab',
                    ...(snapshot.isDropAnimating && { transitionDuration: '0.001s' }),
                } as React.CSSProperties;
                if (!snapshot.isDragging) {
                    style.transform = 'none';
                }

                return (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={style}
                        className={`mb-4 ${snapshot.isDragging ? 'opacity-100 z-50' : ''}`}
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
                                            <Badge className={cn('whitespace-nowrap', priorityConfig[task.ProjectType || 'Thankless']?.className)}>
                                                {task.ProjectType}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{priorityConfig[task.ProjectType || 'Thankless']?.tooltip}</p></TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='space-y-2'>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <p>Due: {format(dueDate, 'MMM d, yyyy')}</p>
                                        <p>{task.Progress || 0}%</p>
                                    </div>
                                    <Progress value={task.Progress || 0} className="h-2" indicatorClassName={cn(isCompleted ? "bg-success" : "", isOverdue ? "bg-destructive" : "")} />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex gap-1">
                                        <TaskChecklist task={task} />
                                        <TaskComments task={task} />
                                    </div>
                                    <div className="flex items-center -space-x-2">
                                        {/* Move Buttons */}
                                        <div className="flex flex-col mr-2 space-y-0.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 rounded-full hover:bg-muted disabled:opacity-30"
                                                onPointerDown={(e) => {
                                                    e.stopPropagation(); // prevent drag start
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    if (!isMoving) onMove(task.id, 'up');
                                                }}
                                                disabled={isMoving}
                                            >
                                                <ChevronUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 rounded-full hover:bg-muted disabled:opacity-30"
                                                onPointerDown={(e) => {
                                                    e.stopPropagation(); // prevent drag start
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    if (!isMoving) onMove(task.id, 'down');
                                                }}
                                                disabled={isMoving}
                                            >
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </div>
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
                                                <Avatar className={cn("h-6 w-6", matchedGroup ? "w-auto px-2 rounded-full" : "")}>
                                                    <AvatarFallback className={cn(matchedGroup ? "text-xs bg-blue-100 text-blue-700 w-auto px-2" : "")}>{assigneeInitials}</AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{task.Assignee || 'Unassigned'}</p></TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            }}
        </Draggable>
    );
}

function TaskColumn({ title, tasks, droppableId, onTaskClick, presenceData, dragDestination, assigneeGroups, onMove, movingTaskId }: { title: string; tasks: Task[]; droppableId: string; onTaskClick: (task: Task) => void; presenceData: Record<string, Presence>; dragDestination: { droppableId: string; index: number } | null; assigneeGroups: AssigneeGroup[]; onMove: (taskId: string, direction: 'up' | 'down') => void; movingTaskId?: string | null }) {
    const statusConfig: Record<TaskStatus, { borderColor: string }> = {
        'หยุดงาน': { borderColor: 'border-t-destructive' },
        'กำลังดำเนินการ': { borderColor: 'border-t-accent' },
        'จบงานแล้ว': { borderColor: 'border-t-success' },
        'ยังไม่ได้เริ่ม': { borderColor: 'border-t-primary/50' },
        'ยังไม่เริ่ม': { borderColor: 'border-t-primary/50' },
        'ติดปัญหา': { borderColor: 'border-t-destructive' },
    };
    const statusMap: Record<string, TaskStatus> = { 'To Do': 'ยังไม่ได้เริ่ม', 'In Progress': 'กำลังดำเนินการ', 'Done': 'จบงานแล้ว' };

    const isDropTarget = dragDestination?.droppableId === droppableId;

    return (
        <div className={cn("flex h-full flex-col rounded-lg bg-card p-4 border-t-4", statusConfig[statusMap[title]] || 'border-t-muted')}>
            <h3 className="font-semibold text-lg text-foreground mb-4">{title} <span className='text-sm font-normal text-muted-foreground'>({tasks.length})</span></h3>
            <StrictModeDroppable droppableId={droppableId}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn("flex flex-1 flex-col min-h-[150px]", snapshot.isDraggingOver ? 'bg-accent/5' : '')}
                    >
                        {tasks.length > 0 ? tasks.map((task, index) => {
                            const showIndicatorBefore = isDropTarget && dragDestination.index === index;
                            return (
                                <div
                                    key={task.id}
                                    data-task-index={index}
                                    data-task-id={task.id}
                                    data-column-id={droppableId}
                                    className="task-card-wrapper"
                                >
                                    {showIndicatorBefore && <DropIndicator />}
                                    {showIndicatorBefore && <DropIndicator />}
                                    <TaskCard
                                        task={task}
                                        index={index}
                                        onClick={() => onTaskClick(task)}
                                        editors={presenceData[task.id]?.editors}
                                        assigneeGroups={assigneeGroups}
                                        onMove={onMove}
                                        isMoving={movingTaskId === task.id}
                                    />
                                </div>
                            );
                        }) : null}
                        {isDropTarget && dragDestination.index === tasks.length && <DropIndicator />}

                        {tasks.length === 0 && !isDropTarget && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>}
                        {provided.placeholder}
                    </div>
                )}
            </StrictModeDroppable>
        </div>
    );
}

export function ProjectDetailsClient({ project, tasks: initialTasks, assignees }: { project: Project, tasks: Task[]; assignees: string[] }) {
    const [serverTasks, setServerTasks] = useState(initialTasks);
    const [dragDestination, setDragDestination] = useState<{ droppableId: string; index: number } | null>(null);
    // --- (4) UPDATE THE STATE TYPE FOR PRESENCE DATA ---
    const [presenceData, setPresenceData] = useState<Record<string, Presence>>({});
    const [assigneeGroups, setAssigneeGroups] = useState<AssigneeGroup[]>([]);
    const { toast } = useToast();
    const [timeframe, setTimeframe] = useState('monthly');
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [isClient, setIsClient] = useState(false);

    // Custom Drag Logic Refs
    const mousePosRef = useRef<{ x: number, y: number } | null>(null);
    const customDragIndexRef = useRef<number | null>(null);
    // Use Ref for synchronous locking (prevent race condition)
    const isMovingRef = useRef(false);
    // T-160, T-162: Track pending moves. Local-First Merge Pattern.
    const pendingMovesRef = useRef<Record<string, { expectedOrder: number, timestamp: number }>>({});
    const [pendingMovesVersion, setPendingMovesVersion] = useState(0); // Trigger re-render for local updates
    const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

    // T-162: Derived State (Local-First Merge)
    // Always prioritize pending moves over server data until confirmed.
    const tasks = useMemo(() => {
        const merged = serverTasks.map(t => {
            const pending = pendingMovesRef.current[t.id];
            if (pending) {
                // Return a new object with overridden Order
                return { ...t, Order: pending.expectedOrder };
            }
            return t;
        });
        return merged.sort((a, b) => (a.Order || 0) - (b.Order || 0));
    }, [serverTasks, pendingMovesVersion]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
                    Effort: data.Effort || 0,
                    Order: data.Order || 0,
                    checklist: data.checklist || [],
                    comments: data.comments || [],
                } as Task;
            });

            // T-162: Cleanup Pending Moves if Server Caught Up
            // We only clear the pending move if the server data MATCHES the expected order.
            // This prevents "Flashback" where server sends stale data.
            const currentPending = pendingMovesRef.current;
            if (Object.keys(currentPending).length > 0) {
                taskList.forEach(t => {
                    const pending = currentPending[t.id];
                    if (pending) {
                        // Tolerance check for float precision
                        if (Math.abs((t.Order || 0) - pending.expectedOrder) < 0.0001) {
                            delete pendingMovesRef.current[t.id];
                        }
                    }
                });
            }

            // Just set server tasks. The useMemo will handle the merge and sort.
            setServerTasks(taskList);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            if (error.code === 'permission-denied') {
                toast({
                    title: "Access Denied",
                    description: "Please sign in to view tasks.",
                    variant: "destructive",
                });
            }
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
        }, (error) => {
            console.error("Error fetching presence:", error);
        });

        const groupsQuery = query(collection(db, 'assignee_groups'));
        const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
            const groups = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AssigneeGroup));
            setAssigneeGroups(groups);
        });


        return () => {
            unsubscribeTasks();
            unsubscribePresence();
            unsubscribeGroups();
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
        setDragDestination(null);
        let { destination, source, draggableId } = result;

        // Use custom index if valid and destination column matches
        if (customDragIndexRef.current !== null && destination) {
            // We trust our custom index more than RBD for the "insert position"
            // BUT, we need to be careful. RBD `destination.index` might be different.
            // Let's override the index.
            destination = {
                ...destination,
                index: customDragIndexRef.current
            };
        }
        customDragIndexRef.current = null; // Reset

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistic Update
        const newTasks = Array.from(tasks);
        const draggedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
        if (draggedTaskIndex === -1) return;
        const [draggedTask] = newTasks.splice(draggedTaskIndex, 1);

        const statusMap: Record<string, TaskStatus> = { 'to-do': 'ยังไม่ได้เริ่ม', 'in-progress': 'กำลังดำเนินการ', 'done': 'จบงานแล้ว' };
        const newStatus = statusMap[destination.droppableId];

        // Update status if changed
        if (newStatus && newStatus !== draggedTask.Status) {
            draggedTask.Status = newStatus;
        }

        // Calculate insertion index in the *global* list is tricky because we filter by column.
        // Easier approach: Get the list of tasks in the destination column *sorted by order*.
        const destColumnTasks = newTasks.filter(t => t.Status === newStatus);

        // Insert physically into the destination array to calculate neighbors
        destColumnTasks.splice(destination.index, 0, draggedTask);

        // Calculate New Order
        let newOrder = 0;
        const prevTask = destColumnTasks[destination.index - 1];
        const nextTask = destColumnTasks[destination.index + 1];

        if (!prevTask && !nextTask) {
            // Only task in column
            newOrder = 1000;
        } else if (!prevTask) {
            // First in column
            newOrder = (nextTask.Order || 1000) / 2;
        } else if (!nextTask) {
            // Last in column
            newOrder = (prevTask.Order || 0) + 1000;
        } else {
            // Middle
            newOrder = ((prevTask.Order || 0) + (nextTask.Order || 0)) / 2;
        }

        if (draggedTask.Order !== newOrder) {
            draggedTask.Order = newOrder;

            // T-161, T-162: Register pending move for Drag & Drop
            pendingMovesRef.current[draggableId] = {
                expectedOrder: newOrder,
                timestamp: Date.now()
            };
            // Force re-render via version update
            setPendingMovesVersion(v => v + 1);
        }

        // No need to manually push and setTasks. 
        // The pendingMovesRef + setPendingMovesVersion will trigger the useMemo to re-calc the list
        // with the new Order, and thus re-sort it automatically.

        try {
            await updateTaskOrder(draggableId, newOrder, newStatus);
            // toast({ title: "Updated", description: "Order updated." }); // Too noisy
        } catch (error) {
            toast({ variant: "destructive", title: "Update failed", description: "Could not update task order." });
            // In real app, revert state here
        }
    };

    const handleManualMove = async (taskId: string, direction: 'up' | 'down') => {
        if (isMovingRef.current) return; // Sync Lock
        isMovingRef.current = true;
        setMovingTaskId(taskId); // Async UI update

        try {
            const taskToMove = tasks.find(t => t.id === taskId);
            if (!taskToMove) return;

            const statusMapReversed: Record<string, string> = {
                'ยังไม่ได้เริ่ม': 'to-do',
                'กำลังดำเนินการ': 'in-progress',
                'จบงานแล้ว': 'done'
            };
            const columnKey = statusMapReversed[taskToMove.Status];
            if (!columnKey) return;

            // Get tasks in column, sorted by current visual order (which relies on `tasks` sort order)
            const columnTasks = tasksByColumn[columnKey as keyof typeof tasksByColumn];
            const currentIndex = columnTasks.findIndex(t => t.id === taskId);
            if (currentIndex === -1) return;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= columnTasks.length) return;

            // Create a new array with the move applied
            const newColumnTasks = [...columnTasks];
            [newColumnTasks[currentIndex], newColumnTasks[targetIndex]] = [newColumnTasks[targetIndex], newColumnTasks[currentIndex]];

            // Assign new robust orders (spacing of 1024 to allow future inserts)
            const updates = newColumnTasks.map((t, index) => ({
                id: t.id,
                Order: (index + 1) * 1024,
                Status: t.Status // Keep status
            }));

            // T-160, T-162: Register pending moves
            updates.forEach(u => {
                pendingMovesRef.current[u.id] = {
                    expectedOrder: u.Order,
                    timestamp: Date.now()
                };
            });

            // Trigger UI Update via derived state
            setPendingMovesVersion(v => v + 1);

            // Optimistic Update (No longer needed to manually construct and set tasks)
            // const newGlobalTasks = tasks.map(t => { ... });
            // setTasks(newGlobalTasks); 
            // Logic handled by useMemo now.

            // 4. Update in Firestore
            // ... updates ...

            try {
                // Batch update via Promise.all
                await Promise.all(updates.map(u => updateTaskOrder(u.id, u.Order)));
            } catch (error) {
                console.error("Manual move failed", error);
                toast({ variant: "destructive", title: "Move failed" });
            }
        } finally {
            // Enforce minimum delay for stability using Ref
            setTimeout(() => {
                isMovingRef.current = false;
                setMovingTaskId(null);
            }, 500);
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
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            {project.owner && <Badge variant="secondary" className="text-xs">Owner: {project.owner}</Badge>}
                        </div>
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
                        <DragDropContext
                            onDragEnd={onDragEnd}

                            onDragUpdate={(update) => {
                                // Default fallback first
                                let newDest = update.destination ? { ...update.destination } : null;

                                if (mousePosRef.current) {
                                    const { x, y } = mousePosRef.current;

                                    // Strategy: Coordinate Geometry Collision with Midpoint
                                    const taskWrappers = Array.from(document.querySelectorAll('[data-task-index]'));

                                    let foundIndex = -1;
                                    let foundDroppableId = null;
                                    let insertPosition = 'before'; // 'before' or 'after'

                                    for (const wrapper of taskWrappers) {
                                        // Fix: Skip Self-Collision (Ghost Card)
                                        if (wrapper.getAttribute('data-task-id') === update.draggableId) {
                                            continue;
                                        }

                                        const rect = wrapper.getBoundingClientRect();
                                        // Check if mouse is inside this card's box (with some horizontal tolerance maybe? strict for now)
                                        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                                            foundIndex = parseInt(wrapper.getAttribute('data-task-index') || '0', 10);
                                            foundDroppableId = wrapper.getAttribute('data-column-id');

                                            // Midpoint Calculation
                                            const midpoint = rect.top + (rect.height / 2);
                                            if (y < midpoint) {
                                                insertPosition = 'before';
                                            } else {
                                                insertPosition = 'after';
                                            }

                                            console.log(`[DragDebug-v2.2] Hovering Card Index: ${foundIndex}, Column: ${foundDroppableId}, MouseY: ${y}, Midpoint: ${midpoint}, Insert: ${insertPosition}`);
                                            break;
                                        }
                                    }

                                    if (foundIndex !== -1 && foundDroppableId) {
                                        // Calculate final index
                                        let finalIndex = foundIndex;
                                        if (insertPosition === 'after') {
                                            finalIndex = foundIndex + 1;
                                        }

                                        // Important: If we are inserting "after" an item that is effectively "before" us in original list, logic holds.
                                        // But if we move item from 0 to 1...
                                        // For simplicity, let's just trust absolute index map.

                                        console.log(`[DragDebug-v2.2] Override Destination -> Column: ${foundDroppableId}, Index: ${finalIndex}`);

                                        newDest = {
                                            droppableId: foundDroppableId,
                                            index: finalIndex
                                        };
                                        customDragIndexRef.current = finalIndex;
                                    } else {
                                        // Not hovering a card directly.
                                        console.log('[DragDebug-v2.2] No card hover detected. Using RBD default.');
                                        customDragIndexRef.current = newDest ? newDest.index : null;
                                    }
                                }

                                setDragDestination(newDest);
                            }}
                        >
                            <div className="text-xs text-muted-foreground text-right absolute top-0 right-0 p-2 opacity-50">v2.2 SelfCollisionFix</div>
                            <style>{`
                                [data-rbd-dragging-state="dragging"] {
                                    pointer-events: none !important;
                                    opacity: 0.8;
                                }
                                [data-rbd-dragging-state="dragging"] * {
                                    pointer-events: none !important;
                                }
                            `}</style>
                            <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                                <div className="md:w-1/3 w-full">
                                    <TaskColumn title="To Do" tasks={tasksByColumn['to-do']} droppableId="to-do" onTaskClick={handleEditTask} presenceData={presenceData} dragDestination={dragDestination} assigneeGroups={assigneeGroups} onMove={handleManualMove} />
                                </div>
                                <div className="md:w-1/3 w-full">
                                    <TaskColumn title="In Progress" tasks={tasksByColumn['in-progress']} droppableId="in-progress" onTaskClick={handleEditTask} presenceData={presenceData} dragDestination={dragDestination} assigneeGroups={assigneeGroups} onMove={handleManualMove} />
                                </div>
                                <div className="md:w-1/3 w-full">
                                    <TaskColumn title="Done" tasks={tasksByColumn['done']} droppableId="done" onTaskClick={handleEditTask} presenceData={presenceData} dragDestination={dragDestination} assigneeGroups={assigneeGroups} onMove={handleManualMove} />
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
                {isTaskDialogOpen && (
                    <EditTaskDialog
                        isOpen={isTaskDialogOpen}
                        onOpenChange={setIsTaskDialogOpen}
                        task={selectedTask}
                        projectId={project.id}
                        assignees={assignees}
                        assigneeGroups={assigneeGroups}
                    />
                )}
            </div>
        </TooltipProvider >
    )
}
