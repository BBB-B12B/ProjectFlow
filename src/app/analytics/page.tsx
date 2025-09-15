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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type definitions
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

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  team?: string;
}

// ฟังก์ชันดึงข้อมูล Task จาก Firebase
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

// ฟังก์ชันดึงข้อมูล Project จาก Firebase
async function getProjects(): Promise<Project[]> {
  try {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    const projectList = projectSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.ProjectName || data.title || `Project ${doc.id.substring(0, 8)}`,
        description: data.description || '',
        status: data.status || '',
        team: data.team || '',
      } as Project;
    });
    return projectList;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

// Main Analytics Page Component (Server Component)
export default async function AnalyticsPage() {
  // Fetch both tasks and projects data
  const [tasks, projects] = await Promise.all([
    getTasks(),
    getProjects()
  ]);

  // Create a map from projectId to project name for easy lookup
  const projectNamesMap = new Map<string, string>();
  projects.forEach(project => {
    projectNamesMap.set(project.id, project.name);
  });

  // Log for debugging
  console.log('Projects loaded:', projects.length);
  console.log('Project names map:', Object.fromEntries(projectNamesMap));
  console.log('Sample tasks with projectId:', tasks.slice(0, 3).map(t => ({ 
    TaskName: t.TaskName, 
    projectId: t.projectId 
  })));

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
          <ProjectProgressChart tasks={tasks} projectNamesMap={projectNamesMap} />
          <TaskPrioritizationMatrix tasks={tasks} />
        </div>

        {/* Row 3: Burn-down Chart (Full Width) */}
        <div className="grid grid-cols-1">
          <BurndownChart tasks={tasks} />
        </div>

        {/* Row 4: Filtered Tasks Table (Full Width) */}
        <div className="grid grid-cols-1">
          <FilteredTasksTable tasks={tasks} projectNamesMap={projectNamesMap} />
        </div>

      </div>
    </div>
  );
}