"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Task, TaskStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Hourglass, CheckCircle2 } from 'lucide-react';
import { TaskEffortChart, BarChart, PieChart, ChartContainer, ChartConfig } from '@/components/ui/chart';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type ProjectDoc = { name?: string };

async function getTasksClient(): Promise<Task[]> {
    try {
        const tasksCol = collection(db, 'tasks');
        const taskSnapshot = await getDocs(tasksCol);
        const taskList = taskSnapshot.docs.map(doc => {
            const data = doc.data();
            const task = {
              id: doc.id,
              ...(data as Omit<Task, 'id'>),
              title: String(data.TaskName ?? '').trim(),
              effort: Number(data.Effort) || 0,
              effect: Number(data.Effect) || 0,
              priority: String(data.ProjectType ?? '').trim(),
              Project: String(data.Project ?? 'Unknown Project').trim(),
              Status: String(data.Status ?? '').trim() as TaskStatus,
              Assignee: String(data.Assignee ?? 'Unassigned').trim(),
              EndDate: data.EndDate && !Number.isNaN(Date.parse(data.EndDate))
              ? new Date(data.EndDate).toISOString()
              : '',
              StartDate: data.StartDate && !Number.isNaN(Date.parse(data.StartDate))
              ? new Date(data.StartDate).toISOString()
              : '',
              Progress: Number(data.Progress) || 0,
            };
            return task;
        });
        console.log("All Fetched Tasks:", taskList);
        return taskList;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

async function getProjectsClient(): Promise<Array<{ id: string; name: string }>> {
  try {
    const projectsCol = collection(db, 'projects');
    const snap = await getDocs(projectsCol);
    return snap.docs.map((doc) => {
      const data = doc.data() as ProjectDoc;
      return { id: doc.id, name: (data.name || doc.id).trim() };
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

const analyticsChartConfig = {
  totalTasks: { label: "Total Tasks", color: "hsl(var(--primary))" },
  'to-do': { label: "To Do", color: "#3b82f6" }, 
  'in-progress': { label: "In Progress", color: "#f59e0b" },
  'done': { label: "Done", color: "#10b981" },
  tasks: { label: "Tasks", color: "#8b5cf6" },
  percent: { label: "% Complete", color: "#f97316" },
  value: { label: "Effort", color: "#06b6d4" },
} satisfies ChartConfig;

// Mapping for display names to actual TaskStatus values
const statusMap: Record<string, TaskStatus> = {
  'To Do': 'ยังไม่ได้เริ่ม',
  'In Progress': 'กำลังดำเนินการ',
  'Done': 'จบงานแล้ว',
  'Stopped': 'หยุดงาน',
};

// Reverse mapping for displaying the filtered status
const reverseStatusMap: Record<TaskStatus, string> = {
  'ยังไม่ได้เริ่ม': 'To Do',
  'กำลังดำเนินการ': 'In Progress',
  'จบงานแล้ว': 'Done',
  'หยุดงาน': 'Stopped',
  '': 'No Status',
};

function SmallStatusCard({ title, value }: { title: string; value: number }) {
  const iconMap = {
    'To Do': <ClipboardList className="h-4 w-4 text-muted-foreground" />,
    'In Progress': <Hourglass className="h-4 w-4 text-muted-foreground" />,
    'Done': <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <Card className="min-w-[120px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {iconMap[title as keyof typeof iconMap]}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    (async () => {
      const [taskList, projectList] = await Promise.all([
        getTasksClient(),
        getProjectsClient(),
      ]);
      setTasks(taskList);
      setProjects(projectList);
    })();
  }, []);

  useEffect(() => {
    let current = tasks;
  
    if (selectedStatus) {
      current = current.filter(t => t.Status === selectedStatus);
    }
    if (selectedAssignee) {
      current = current.filter(t => {
        if (!t.Assignee) return false;
        return t.Assignee.split(",").map(s => s.trim()).includes(selectedAssignee);
      });
    }
  
    setFilteredTasks(current);
  }, [tasks, selectedStatus, selectedAssignee]);

  const { tasksByStatus, totalTasks, tasksByAssignee, projectCompletion, burnDownData } = useMemo(() => {
    console.log("=== Analytics Data Processing ===");
    console.log("Total tasks:", tasks.length);
    console.log("Total projects:", projects.length);
    
    const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
    const tasksByStatus = {
      'To Do': tasks.filter((t) => t.Status === 'ยังไม่ได้เริ่ม').length, 
      'In Progress': tasks.filter((t) => t.Status === 'กำลังดำเนินการ').length, 
      'Done': tasks.filter((t) => t.Status === 'จบงานแล้ว').length, 
    };
    const totalTasks = tasks.length;
    
    console.log("Tasks by status:", tasksByStatus);
  
    // Task by Assignee - Fixed to handle comma-separated assignees
    const tasksByAssigneeMap: Record<string, number> = {};
    tasks.forEach((task: any) => {
      const assigneeString = String(task.Assignee ?? '').trim();
      console.log(`Processing task: ${task.title || task.TaskName}, Assignee: "${assigneeString}"`);
      
      if (assigneeString && assigneeString.toLowerCase() !== 'unassigned') {
        const assignees = assigneeString.split(',').map(s => s.trim()).filter(Boolean);
        console.log(`  Split assignees:`, assignees);
        
        assignees.forEach(assignee => {
          tasksByAssigneeMap[assignee] = (tasksByAssigneeMap[assignee] || 0) + 1;
        });
      }
    });
    
    console.log("Tasks by assignee map:", tasksByAssigneeMap);
  
    const tasksByAssignee = Object.entries(tasksByAssigneeMap)
      .map(([name, count]) => ({ name, tasks: count as number }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 10); // Show top 10 assignees
  
    // Project completion
    const projectKeyOf = (task: any) =>
      task.projectId || task.ProjectId ||
      String(task.Project ?? 'Unknown Project')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
    
    const projectCompletionMap = tasks.reduce((acc, t: any) => {
      const key = projectKeyOf(t);
      const displayName = projectMap[key] || (t.Project?.trim() || key);
      acc[key] ??= { total: 0, done: 0, name: displayName };
      acc[key].total += 1;
      if (t.Status === 'จบงานแล้ว') acc[key].done += 1;
      return acc;
    }, {} as Record<string, { total: number; done: number; name: string }>);
    
    console.log("Project completion map:", projectCompletionMap);
      
    const projectCompletion = Object.entries(projectCompletionMap)
      .map(([id, { total, done, name }]) => ({
        id,
        name,
        percent: total ? Math.round((done / total) * 100) : 0,
        total,
        done,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 8); // Show top 8 projects
      
    console.log("Final project completion:", projectCompletion);

    // Burn-down data
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const burnDownAggregation: Record<string, number> = {};
    tasks.forEach((t: any) => {
      if (!t.EndDate) return;
      const d = new Date(t.EndDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      const effortValue = t.effort || t.Effort || 0;
      console.log(`Burn-down: Task ${t.title || t.TaskName}, End: ${t.EndDate}, Effort: ${effortValue}, Key: ${key}`);
      burnDownAggregation[key] = (burnDownAggregation[key] || 0) + effortValue;
    });
    
    console.log("Burn-down aggregation:", burnDownAggregation);
    
    const burnDownData = Object.entries(burnDownAggregation)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const [ma, ya] = a.name.split(' ');
        const [mb, yb] = b.name.split(' ');
        return new Date(2000 + +ya, monthNames.indexOf(ma), 1).getTime()
            - new Date(2000 + +yb, monthNames.indexOf(mb), 1).getTime();
    });
    
    console.log("Final burn-down data:", burnDownData);
    console.log("=== End Analytics Data Processing ===");

    return {
      tasksByStatus,
      totalTasks,
      tasksByAssignee,
      projectCompletion,
      burnDownData,
    };
  }, [tasks, projects]);

      
  const handlePieSliceClick = (data: any) => {
    const statusInThai = statusMap[data.name];
    const newStatus = statusInThai === selectedStatus ? null : statusInThai; 
    setSelectedStatus(newStatus);
  };
  
  const handleAssigneeBarClick = (data: any) => {
    const newAssignee = data.name === selectedAssignee ? null : data.name;
    setSelectedAssignee(newAssignee);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {/* Task Status - PieChart */}
        <Card className="lg:col-span-2 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Task Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[300px] w-full">
              <ChartContainer config={analyticsChartConfig} className="h-full w-full">
                <PieChart
                  data={[
                    { name: 'To Do', value: tasksByStatus['To Do'], colorKey: 'to-do' },
                    { name: 'In Progress', value: tasksByStatus['In Progress'], colorKey: 'in-progress' },
                    { name: 'Done', value: tasksByStatus['Done'], colorKey: 'done' },
                  ]}
                  category="value"
                  index="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  onCellClick={handlePieSliceClick}
                  label={({ viewBox }: any) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy - 10}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalTasks}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy + 15}
                            className="fill-muted-foreground text-base"
                          >
                            tasks
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Small Status Cards */}
        <SmallStatusCard title="To Do" value={tasksByStatus['To Do']} />
        <SmallStatusCard title="In Progress" value={tasksByStatus['In Progress']} />
        <SmallStatusCard title="Done" value={tasksByStatus['Done']} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Task Assignee */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Task Assignee</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[400px] w-full">
              <ChartContainer config={analyticsChartConfig} className="h-full w-full">
                <BarChart
                  data={tasksByAssignee}
                  index="name"
                  categories={['tasks']}
                  layout="vertical"
                  yAxisWidth={120}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  xAxisLabel="Number of Tasks"
                  onBarClick={handleAssigneeBarClick}
                />
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* % Complete of Project */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>% Complete of Project</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[400px] w-full">
              <ChartContainer config={analyticsChartConfig} className="h-full w-full">
                <BarChart
                  data={projectCompletion}
                  index="name"
                  categories={['percent']}
                  layout="vertical"
                  yAxisWidth={150}
                  xAxisLabel="Completion Percentage"
                  numberDomain={[0, 100]}
                  numberTicks={[0, 20, 40, 60, 80, 100]}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                />
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Task Prioritization Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Task Prioritization Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[300px] w-full">
              <TaskEffortChart 
                data={tasks.map((task: any) => ({
                  id: task.id,
                  title: task.title || task.TaskName || 'Untitled Task',
                  effort: task.effort || task.Effort || 0,
                  effect: task.effect || task.Effect || 0
                }))} 
              />
            </div>
          </CardContent>
        </Card>
      
        {/* Burn-down chart for Effort */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Burn-down chart for Effort</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[300px] w-full">
              <ChartContainer config={analyticsChartConfig} className="h-full w-full">
                <BarChart
                  data={(burnDownData ?? []).filter(d => Number.isFinite(d.value))}
                  index="name"
                  categories={['value']}
                  xAxisLabel="Month/Year"
                  yAxisLabel="Effort"
                  margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                />
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Filtered Tasks</CardTitle>
          <CardDescription>
            {selectedStatus || selectedAssignee
              ? `Showing tasks for ${selectedStatus ? reverseStatusMap[selectedStatus] : ''}${selectedStatus && selectedAssignee ? ' and ' : ''}${selectedAssignee || ''}`
              : 'Click on a chart element to filter tasks.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(task as any).title || (task as any).TaskName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Progress ?? 0}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.Status === 'จบงานแล้ว' ? 'bg-green-100 text-green-800' :
                          task.Status === 'กำลังดำเนินการ' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reverseStatusMap[task.Status] || task.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Assignee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(task as any).Project}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.EndDate ? new Date(task.EndDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 whitespace-nowrap text-sm text-gray-500 text-center">
                      No tasks match the current filter.
                    </td>
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