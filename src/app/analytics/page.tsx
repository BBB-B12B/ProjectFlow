import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  TaskStatusChart,
  TaskAssigneeChart,
  ProjectProgressChart,
  TaskPrioritizationMatrix,
  BurndownChart,
  FilteredTasksTable
} from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Make sure Card components are still imported if used directly here

// Type definitions (can be moved to a shared types file if many components use it)
interface Task {
  id: string;
  TaskName: string;
  Status: string;
  Progress: number;
  Assignee: string;
  ProjectType: string;
  projectId: string;
  StartDate: string;
  EndDate: string;
  Effort: number;
  Effect: number;
  title?: string;
  effort?: number;
  effect?: number;
  priority?: string;
}

// ฟังก์ชันดึงข้อมูลจาก Firebase (kept in the server component)
async function getTasks(): Promise<Task[]> {
  try {
    const tasksCol = collection(db, 'tasks');
    const taskSnapshot = await getDocs(tasksCol);
    const taskList = taskSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        TaskName: data.TaskName || '',
        Status: data.Status || '',
        Progress: data.Progress || 0,
        Assignee: data.Assignee || '',
        ProjectType: data.ProjectType || '',
        projectId: data.projectId || '',
        StartDate: data.StartDate || '',
        EndDate: data.EndDate || '',
        Effort: data.Effort || 0,
        Effect: data.Effect || 0,
        title: data.TaskName || '',
        effort: data.Effort || 0,
        effect: data.Effect || 0,
        priority: data.ProjectType || '',
      } as Task;
    });
    return taskList;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// Main Analytics Page Component (Server Component)
export default async function AnalyticsPage() {
  const tasks = await getTasks();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-600">Insights into your project tasks.</p>
        </div>

        {/* Row 1: Task Status + Task Assignee */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskStatusChart tasks={tasks} />
          <TaskAssigneeChart tasks={tasks} />
        </div>

        {/* Row 2: Project Progress + Task Prioritization Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectProgressChart tasks={tasks} />
          <TaskPrioritizationMatrix tasks={tasks} />
        </div>

        {/* Row 3: Burn-down Chart (Full Width) */}
        <div className="grid grid-cols-1">
          <BurndownChart tasks={tasks} />
        </div>

        {/* Row 4: Filtered Tasks Table (Full Width) */}
        <div className="grid grid-cols-1">
          <FilteredTasksTable tasks={tasks} />
        </div>

      </div>
    </div>
  );
}
