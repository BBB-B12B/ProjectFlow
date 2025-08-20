import { projects, tasks } from '@/lib/data';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function TaskCard({ task }: { task: { id: string; title: string; priority: TaskPriority; dueDate: string } }) {
  const priorityConfig: Record<TaskPriority, { className: string; tooltip: string }> = {
    High: {
      className: 'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30',
      tooltip: 'High Priority',
    },
    Medium: {
      className: 'border-transparent bg-warning/20 text-warning-dark hover:bg-warning/30',
      tooltip: 'Medium Priority',
    },
    Low: {
      className: 'border-transparent bg-success/20 text-success-dark hover:bg-success/30',
      tooltip: 'Low Priority',
    },
  };

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <p className="font-medium text-card-foreground">{task.title}</p>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <Badge className={cn('whitespace-nowrap', priorityConfig[task.priority].className)}>
                  {task.priority}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{priorityConfig[task.priority].tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Due: {format(parseISO(task.dueDate), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  );
}

function TaskColumn({ title, tasks, status }: { title: string; tasks: Task[]; status: TaskStatus }) {
  const statusConfig: Record<TaskStatus, { borderColor: string }> = {
    'To Do': {
        borderColor: 'border-t-primary/50',
    },
    'In Progress': {
        borderColor: 'border-t-accent',
    },
    'Done': {
        borderColor: 'border-t-success',
    }
  };

  return (
    <div className={cn("flex h-full flex-col gap-4 rounded-lg bg-card p-4 border-t-4", statusConfig[status].borderColor)}>
      <h3 className="font-semibold text-lg text-foreground">{title} <span className='text-sm font-normal text-muted-foreground'>({tasks.length})</span></h3>
      <div className="flex flex-1 flex-col gap-4">
        {tasks.length > 0 ? tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        )) : <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>}
      </div>
    </div>
  );
}

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id);
  if (!project) {
    notFound();
  }

  const projectTasks = tasks.filter((t) => t.projectId === params.id);
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    'To Do': projectTasks.filter((t) => t.status === 'To Do'),
    'In Progress': projectTasks.filter((t) => t.status === 'In Progress'),
    'Done': projectTasks.filter((t) => t.status === 'Done'),
  };

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <div className="grid flex-1 grid-cols-1 items-start gap-6 md:grid-cols-3">
        <TaskColumn title="To Do" tasks={tasksByStatus['To Do']} status="To Do" />
        <TaskColumn title="In Progress" tasks={tasksByStatus['In Progress']} status="In Progress" />
        <TaskColumn title="Done" tasks={tasksByStatus['Done']} status="Done" />
      </div>
    </div>
  );
}
