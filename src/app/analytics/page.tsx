import type { Task, TaskStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Lightbulb, Zap,ClipboardList, Hourglass, CheckCircle2 } from 'lucide-react';
import { TaskEffortChart } from '@/components/task-effort-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getTasks(): Promise<Task[]> {
    const tasksCol = collection(db, 'tasks');
    const taskSnapshot = await getDocs(tasksCol);
    const taskList = taskSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...(data as Omit<Task, 'id'>),
            // Mapping for chart compatibility
            title: data.TaskName,
            effort: data.Effort,
            effect: data.Effect,
            priority: data.ProjectType,
        }
    });
    return taskList;
}

export default async function AnalyticsPage() {
  const tasks = await getTasks();
  const totalTasks = tasks.length;
  const tasksByStatus = {
    'To Do': tasks.filter((t) => t.Status === 'กำลังดำเนินการ' && new Date(t.StartDate) > new Date()).length,
    'In Progress': tasks.filter((t) => t.Status === 'กำลังดำเนินการ' && new Date(t.StartDate) <= new Date()).length,
    'Done': tasks.filter((t) => t.Status === 'จบงานแล้ว').length,
  };

  const quickWins = tasks.filter(t => (t.Effect ?? 0) >= 4 && (t.Effort ?? 0) <= 2 && t.Status !== 'จบงานแล้ว');
  const majorProjects = tasks.filter(t => (t.Effect ?? 0) >= 4 && (t.Effort ?? 0) >= 4 && t.Status !== 'จบงานแล้ว');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Insights into your project tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus['To Do']}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus['In Progress']}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus['Done']}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Task Prioritization Matrix</CardTitle>
            <CardDescription>Visualize tasks by effort vs. business effect to identify key priorities.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <TaskEffortChart data={tasks} />
          </CardContent>
        </Card>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Alert>
              <Zap className="h-4 w-4 text-accent" />
              <AlertTitle>Quick Wins ({quickWins.length})</AlertTitle>
              <AlertDescription>
                High-effect, low-effort tasks. Focus on these for immediate impact.
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {quickWins.length > 0 ? quickWins.slice(0, 2).map(t => <li key={t.id} className="truncate">{t.TaskName}</li>) : <li>No current quick wins.</li>}
                  {quickWins.length > 2 && <li>and {quickWins.length - 2} more...</li>}
                </ul>
              </AlertDescription>
            </Alert>
            <Alert>
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertTitle>Major Projects ({majorProjects.length})</AlertTitle>
              <AlertDescription>
                High-effect, high-effort tasks. Plan these carefully as they provide significant value.
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                   {majorProjects.length > 0 ? majorProjects.slice(0, 2).map(t => <li key={t.id} className="truncate">{t.TaskName}</li>) : <li>No current major projects.</li>}
                   {majorProjects.length > 2 && <li>and {majorProjects.length - 2} more...</li>}
                </ul>
              </AlertDescription>
            </Alert>
        </div>
      </div>
    </div>
  );
}
