// /home/user/studio/src/app/analytics/page.tsx
import React from 'react';
import { collection, getDocs } from 'firebase/firestore/lite';
import { db } from '@/lib/firebase-lite';
import { Project, Task } from '@/lib/types';
import AnalyticsClient from './analytics-client';

export const runtime = 'edge'; // Ensure Edge compatibility

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
        Status: (data.Status || 'ยังไม่เริ่ม') as Task['Status'], // Cast to strict Enum
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
        // Add missing required fields for Project type
        startDate: data.StartDate || '',
        endDate: data.EndDate || '',
        totalTasks: 0, // Default for analytics view if not computed here
        completedTasks: 0,
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

  // Log for debugging
  console.log('Projects loaded:', projects.length);

  return (
    // AnalyticsClient will handle the div with min-h-screen bg-gray-50 p-6 and its children
    <AnalyticsClient initialTasks={tasks} initialProjects={projects} />
  );
}
