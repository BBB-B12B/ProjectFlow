'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  TaskStatusChart,
  TaskAssigneeChart,
  ProjectProgressChart,
  TaskPrioritizationMatrix,
  BurndownChart,
  FilteredTasksTable
} from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type definitions (copied from page.tsx to ensure consistency within client component)
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
  isDarkModeOnly?: boolean; 
}

interface AnalyticsClientProps {
  initialTasks: Task[];
  initialProjects: Project[];
}

export default function AnalyticsClient({
  initialTasks,
  initialProjects,
}: AnalyticsClientProps) {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(initialProjects);

  useEffect(() => {
    console.log('Current theme detected:', currentTheme);

    const newFilteredProjects = initialProjects.filter(project => {
      // If isDarkModeOnly is undefined or null, always include the project
      if (project.isDarkModeOnly === undefined || project.isDarkModeOnly === null) {
        return true;
      }
      // If isDarkModeOnly is true, show only in dark mode
      if (project.isDarkModeOnly === true) {
        return currentTheme === 'dark';
      }
      // If isDarkModeOnly is false, show only in light mode
      if (project.isDarkModeOnly === false) {
        return currentTheme === 'light';
      }
      return true; // Fallback: include by default if logic is not met
    });

    // Get IDs of filtered projects
    const filteredProjectIds = new Set(newFilteredProjects.map(p => p.id));

    // Filter tasks based on filtered projects
    const newFilteredTasks = initialTasks.filter(task => 
      task.projectId ? filteredProjectIds.has(task.projectId) : true // Include tasks with no projectId or if their project is filtered
    );

    console.log('Filtered projects count:', newFilteredProjects.length);
    console.log('Filtered tasks count:', newFilteredTasks.length);

    setFilteredProjects(newFilteredProjects);
    setFilteredTasks(newFilteredTasks);

  }, [currentTheme, initialProjects, initialTasks]);

  // Create a map from projectId to filtered project name for charts
  const projectNamesMap = new Map<string, string>();
  filteredProjects.forEach(project => {
    projectNamesMap.set(project.id, project.name);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6"> {/* Added dark:bg-gray-800 */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-300">Insights into your project tasks.</p>
        </div>

        {/* Row 1: Task Status + Task Assignee */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskStatusChart tasks={filteredTasks} />
          <TaskAssigneeChart tasks={filteredTasks} />
        </div>

        {/* Row 2: Project Progress + Task Prioritization Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectProgressChart tasks={filteredTasks} projectNamesMap={projectNamesMap} />
          <TaskPrioritizationMatrix tasks={filteredTasks} />
        </div>

        {/* Row 3: Burn-down Chart (Full Width) */}
        <div className="grid grid-cols-1">
          <BurndownChart tasks={filteredTasks} />
        </div>

        {/* Row 4: Filtered Tasks Table (Full Width) */}
        <div className="grid grid-cols-1">
          <FilteredTasksTable tasks={filteredTasks} projectNamesMap={projectNamesMap} />
        </div>

      </div>
    </div>
  );
}
