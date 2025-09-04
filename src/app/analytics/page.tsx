"use client";

import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartIcon, Lightbulb, Zap,ClipboardList, Hourglass, CheckCircle2 } from 'lucide-react';
import { TaskEffortChart } from '@/components/task-effort-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, PieChart, ChartContainer, ChartConfig } from '@/components/ui/chart';

// Placeholder for fetching tasks - in a real app, this might be an API call
// or server component data fetching. For client component, we'll keep it simple
async function getTasksClient(): Promise<Task[]> {
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

const analyticsChartConfig = {
  tasks: { label: "Tasks", color: "hsl(var(--primary))" },
  'To Do': { label: "To Do", color: "hsl(var(--info))" },
  'In Progress': { label: "In Progress", color: "hsl(var(--warning))" },
  'Done': { label: "Done", color: "hsl(var(--success))" },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    getTasksClient().then(setTasks);
  }, []);

  useEffect(() => {
    let currentFilteredTasks = tasks;

    if (selectedStatus) {
      currentFilteredTasks = currentFilteredTasks.filter(t => t.Status === selectedStatus);
    }
    if (selectedAssignee) {
      currentFilteredTasks = currentFilteredTasks.filter(t => t.Assignee === selectedAssignee);
    }

    setFilteredTasks(currentFilteredTasks);
  }, [tasks, selectedStatus, selectedAssignee]);

  const totalTasks = tasks.length;
  const tasksByStatus = {
    'To Do': tasks.filter((t) => t.Status === 'กำลังดำเนินการ' && new Date(t.StartDate) > new Date()).length,
    'In Progress': tasks.filter((t) => t.Status === 'กำลังดำเนินการ' && new Date(t.StartDate) <= new Date()).length,
    'Done': tasks.filter((t) => t.Status === 'จบงานแล้ว').length,
  };

  const tasksByAssignee: { [key: string]: number } = tasks.reduce((acc, task) => {
    if (task.Assignee) {
      acc[task.Assignee] = (acc[task.Assignee] || 0) + 1;
    }
    return acc;
  }, {} as { [key: string]: number });

  const tasksByAssigneeChartData = Object.entries(tasksByAssignee).map(([name, tasks]) => ({
    name,
    tasks,
  }));

  const handlePieSliceClick = (data: any) => {
    const newStatus = data.name === selectedStatus ? null : (data.name as TaskStatus);
    setSelectedStatus(newStatus);
  };

  const handleBarClick = (data: any) => {
    const newAssignee = data.name === selectedAssignee ? null : data.name;
    setSelectedAssignee(newAssignee);
  };

  const quickWins = tasks.filter(t => (t.Effect ?? 0) >= 4 && (t.Effort ?? 0) <= 2 && t.Status !== 'จบงานแล้ว');
  const majorProjects = tasks.filter(t => (t.Effect ?? 0) >= 4 && (t.Effort ?? 0) >= 4 && t.Status !== 'จบงานแล้ว');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Insights into your project tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"> {/* Changed to 2 columns on large screens */}
        <Card> {/* Task Status card with PieChart */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Status</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks} Total Tasks</div>
            <ChartContainer config={analyticsChartConfig} className="mt-4 h-32 w-full">
              <PieChart
                data={[
                  { name: 'To Do', value: tasksByStatus['To Do'] },
                  { name: 'In Progress', value: tasksByStatus['In Progress'] },
                  { name: 'Done', value: tasksByStatus['Done'] },
                ]}
                category="value"
                index="name"
                name="Task Status"
                onCellClick={handlePieSliceClick} // Add click handler
              />
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6"> {/* Vertical stack for other status cards */}
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

      <Card>
        <CardHeader>
          <CardTitle>Filtered Tasks</CardTitle>
          <CardDescription>
            {selectedStatus || selectedAssignee
              ? `Showing tasks for ${selectedStatus || ''}${selectedStatus && selectedAssignee ? ' and ' : ''}${selectedAssignee || ''}`
              : 'Click on a chart element to filter tasks.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.TaskName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Progress ?? 0}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Assignee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.ProjectType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.EndDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No tasks match the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
