import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  isDarkModeOnly?: boolean; // Add this field
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
        isDarkModeOnly: data.isDarkModeOnly ?? false, // Fetch isDarkModeOnly, default to false
      } as Project;
    });
    return projectList;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

// Client Component to handle theme-based filtering
import AnalyticsClient from './analytics-client';

// Main Analytics Page Component (Server Component)
export default async function AnalyticsPage() {
  // Fetch both tasks and projects data
  const [tasks, projects] = await Promise.all([
    getTasks(),
    getProjects()
  ]);

  // Log for debugging
  console.log('Projects loaded:', projects.length);
  console.log('Sample projects with isDarkModeOnly:', projects.slice(0, 3).map(p => ({ 
    name: p.name, 
    isDarkModeOnly: p.isDarkModeOnly 
  })));
  console.log('Sample tasks with projectId:', tasks.slice(0, 3).map(t => ({ 
    TaskName: t.TaskName, 
    projectId: t.projectId 
  })));

  return (
    // AnalyticsClient will handle the div with min-h-screen bg-gray-50 p-6 and its children
    <AnalyticsClient initialTasks={tasks} initialProjects={projects} />
  );
}
