import type { Task, TaskStatus, Project, ProjectType } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';
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
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getProject(id: string): Promise<Project | null> {
    const projectDocRef = doc(db, 'projects', id);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) {
        return null;
    }
    const data = projectDoc.data();
    return {
      id: projectDoc.id,
      name: data.ProjectName,
      description: data.description || 'No description available.',
      startDate: data.StartDate,
      endDate: data.EndDate,
      ...data
    } as Project;
}

async function getProjectTasks(projectId: string): Promise<Task[]> {
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, where('projectId', '==', projectId));
    const taskSnapshot = await getDocs(q);
    const taskList = taskSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...(data as Omit<Task, 'id'>),
        title: data.TaskName,
        status: data.Status,
        dueDate: data.EndDate,
        // A default priority is needed for the card display
        priority: 'Medium',
      }
    });
    return taskList;
}

function TaskCard({ task }: { task: Task }) {
  const priorityConfig: Record<ProjectType, { className: string; tooltip: string }> = {
    Main: {
      className: 'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30',
      tooltip: 'Main Project',
    },
    QuickWin: {
      className: 'border-transparent bg-success/20 text-success-dark hover:bg-success/30',
      tooltip: 'Quick Win',
    },
    Fillin: {
      className: 'border-transparent bg-warning/20 text-warning-dark hover:bg-warning/30',
      tooltip: 'Fill-in Task',
    },
    Thankless: {
        className: 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted/60',
        tooltip: 'Thankless Task',
    },
  };

  return (
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
              <TooltipContent>
                <p>{priorityConfig[task.ProjectType]?.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Due: {format(parseISO(task.EndDate), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  );
}

function TaskColumn({ title, tasks, status }: { title: string; tasks: Task[]; status: TaskStatus }) {
  const statusConfig: Record<TaskStatus, { borderColor: string }> = {
    'หยุดงาน': { borderColor: 'border-t-destructive' },
    'กำลังดำเนินการ': { borderColor: 'border-t-accent' },
    'จบงานแล้ว': { borderColor: 'border-t-success' },
    '': { borderColor: 'border-t-primary/50' },
  };

  return (
    <div className={cn("flex h-full flex-col gap-4 rounded-lg bg-card p-4 border-t-4", statusConfig[status]?.borderColor || 'border-t-muted')}>
      <h3 className="font-semibold text-lg text-foreground">{title} <span className='text-sm font-normal text-muted-foreground'>({tasks.length})</span></h3>
      <div className="flex flex-1 flex-col gap-4">
        {tasks.length > 0 ? tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        )) : <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>}
      </div>
    </div>
  );
}

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) {
    // Check if any projects exist at all. If not, maybe redirect to seed page.
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    if(projectSnapshot.empty) {
      redirect('/seed');
    }
    notFound();
  }

  const projectTasks = await getProjectTasks(params.id);
  
  const tasksByStatus = {
    'To Do': projectTasks.filter((t) => t.Status === 'กำลังดำเนินการ' && new Date(t.StartDate) > new Date()), // Not started yet
    'In Progress': projectTasks.filter((t) => t.Status === 'กำลังดำเนินการ' && new Date(t.StartDate) <= new Date()),
    'Done': projectTasks.filter((t) => t.Status === 'จบงานแล้ว'),
  };

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.ProjectName}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <div className="grid flex-1 grid-cols-1 items-start gap-6 md:grid-cols-3">
        <TaskColumn title="To Do" tasks={tasksByStatus['To Do']} status="กำลังดำเนินการ" />
        <TaskColumn title="In Progress" tasks={tasksByStatus['In Progress']} status="กำลังดำเนินการ" />
        <TaskColumn title="Done" tasks={tasksByStatus['Done']} status="จบงานแล้ว" />
      </div>
    </div>
  );
}
