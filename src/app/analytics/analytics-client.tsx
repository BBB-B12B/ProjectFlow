// src/app/analytics/analytics-client.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { normalizeAssigneeName, formatAssigneeDisplayName } from '@/lib/utils';
import {
  TaskStatusChart,
  TaskAssigneeChart,
  ProjectProgressChart,
  TaskPrioritizationMatrix,
  BurndownChart,
  FilteredTasksTable
} from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditTaskDialog } from '@/components/edit-task-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ProjectTrackingProgress } from '@/lib/types';

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
  isDarkModeOnly?: boolean; 
}

interface AnalyticsClientProps {
  initialTasks: Task[];
  initialProjects: Project[];
}

// Enhanced filter state interface
interface FilterState {
  status: string | null;
  assignee: string | null;
  projectId: string | null;
  priorityQuadrant: string | null;
  dateRange: { start: Date | null; end: Date | null };
  progressRange: { min: number; max: number };
}

export default function AnalyticsClient({
  initialTasks,
  initialProjects,
}: AnalyticsClientProps) {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(initialProjects);
  
  // Add tracking data state
  const [trackingData, setTrackingData] = useState<Map<string, number>>(new Map());
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  
  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    status: null,
    assignee: null,
    projectId: null,
    priorityQuadrant: null,
    dateRange: { start: null, end: null },
    progressRange: { min: 0, max: 100 }
  });

  // Track which chart triggered the filter for visual feedback
  const [activeFilterSource, setActiveFilterSource] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Function to fetch tracking data for all tasks
  const fetchTrackingData = useCallback(async () => {
    if (filteredTasks.length === 0) return;
    
    setTrackingLoading(true);
    try {
      const trackingRef = collection(db, 'projectTrackingProgress');
      const trackingSnapshot = await getDocs(trackingRef);
      
      const taskHoursMap = new Map<string, number>();
      
      trackingSnapshot.forEach((doc) => {
        const data = doc.data() as ProjectTrackingProgress;
        const currentHours = taskHoursMap.get(data.taskId) || 0;
        taskHoursMap.set(data.taskId, currentHours + (data.hoursWorked || 0));
      });
      
      setTrackingData(taskHoursMap);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setTrackingLoading(false);
    }
  }, [filteredTasks]);

  // Fetch tracking data when component mounts or filtered tasks change
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Filter update functions
  const updateFilter = useCallback((key: keyof FilterState, value: any, source?: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setActiveFilterSource(source || null);
  }, []);

  const handleStatusFilter = useCallback((status: string | null, source: string = 'status-chart') => {
    updateFilter('status', status, source);
  }, [updateFilter]);

  const handleAssigneeFilter = useCallback((assignee: string | null, source: string = 'assignee-chart') => {
    updateFilter('assignee', assignee, source);
  }, [updateFilter]);

  const handleProjectFilter = useCallback((projectId: string | null, source: string = 'progress-chart') => {
    updateFilter('projectId', projectId, source);
  }, [updateFilter]);

  const handlePriorityQuadrantFilter = useCallback((quadrant: string | null, source: string = 'matrix-chart') => {
    updateFilter('priorityQuadrant', quadrant, source);
  }, [updateFilter]);

  const handleDateRangeFilter = useCallback((dateRange: { start: Date | null; end: Date | null }, source: string = 'burndown-chart') => {
    updateFilter('dateRange', dateRange, source);
  }, [updateFilter]);

  const handleProgressRangeFilter = useCallback((progressRange: { min: number; max: number }, source: string = 'progress-filter') => {
    updateFilter('progressRange', progressRange, source);
  }, [updateFilter]);

  // Function to clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      status: null,
      assignee: null,
      projectId: null,
      priorityQuadrant: null,
      dateRange: { start: null, end: null },
      progressRange: { min: 0, max: 100 }
    });
    setActiveFilterSource(null);
  }, []);

  // Function to determine priority quadrant based on effort/effect
  const getPriorityQuadrant = (effort: number, effect: number): string => {
    if (effort <= 5 && effect > 5) return 'quick-wins'; // Low effort, high effect
    if (effort > 5 && effect > 5) return 'major-projects'; // High effort, high effect
    if (effort <= 5 && effect <= 5) return 'fill-ins'; // Low effort, low effect
    if (effort > 5 && effect <= 5) return 'thankless-tasks'; // High effort, low effect
    return 'unknown';
  };

  // Enhanced filtering logic
  useEffect(() => {
    console.log('Current theme detected:', currentTheme);

    // Filter projects based on theme
    const newFilteredProjects = initialProjects.filter(project => {
      if (project.isDarkModeOnly === undefined || project.isDarkModeOnly === null) {
        return true;
      }
      if (project.isDarkModeOnly === true) {
        return currentTheme === 'dark';
      }
      if (project.isDarkModeOnly === false) {
        return currentTheme === 'light';
      }
      return true;
    });

    const filteredProjectIds = new Set(newFilteredProjects.map(p => p.id));

    let updatedTasks = initialTasks.filter(task => 
      task.projectId ? filteredProjectIds.has(task.projectId) : true
    );

    // Apply status filter
    if (filters.status) {
      updatedTasks = updatedTasks.filter(task => 
        task.Status?.toLowerCase() === filters.status?.toLowerCase()
      );
    }

    // Apply assignee filter
    if (filters.assignee) {
      updatedTasks = updatedTasks.filter(task => {
        const assignees = task.Assignee?.split(',').map(name => name.trim()).filter(name => name.length > 0) || [];
        return assignees.includes(filters.assignee!) || (filters.assignee === 'Unassigned' && assignees.length === 0);
      });
    }

    // Apply project filter
    if (filters.projectId) {
      updatedTasks = updatedTasks.filter(task => task.projectId === filters.projectId);
    }

    // Apply priority quadrant filter
    if (filters.priorityQuadrant) {
      updatedTasks = updatedTasks.filter(task => {
        const quadrant = getPriorityQuadrant(task.Effort || 0, task.Effect || 0);
        return quadrant === filters.priorityQuadrant;
      });
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      updatedTasks = updatedTasks.filter(task => {
        if (!task.EndDate) return false;
        const taskDate = new Date(task.EndDate);
        if (isNaN(taskDate.getTime())) return false;
        
        if (filters.dateRange.start && taskDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && taskDate > filters.dateRange.end) return false;
        
        return true;
      });
    }

    // Apply progress range filter
    if (filters.progressRange.min > 0 || filters.progressRange.max < 100) {
      updatedTasks = updatedTasks.filter(task => {
        const progress = task.Progress || 0;
        return progress >= filters.progressRange.min && progress <= filters.progressRange.max;
      });
    }

    console.log('Applied filters:', filters);
    console.log('Filtered projects count:', newFilteredProjects.length);
    console.log('Filtered tasks count:', updatedTasks.length);

    setFilteredProjects(newFilteredProjects);
    setFilteredTasks(updatedTasks);

  }, [currentTheme, initialProjects, initialTasks, filters]);

  // Create a map from projectId to filtered project name for charts
  const projectNamesMap = new Map<string, string>();
  filteredProjects.forEach(project => {
    projectNamesMap.set(project.id, project.name);
  });

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return filters.status || 
           filters.assignee || 
           filters.projectId || 
           filters.priorityQuadrant ||
           filters.dateRange.start || 
           filters.dateRange.end ||
           filters.progressRange.min > 0 || 
           filters.progressRange.max < 100;
  };

  // Helper function to get filter badge color based on source
  const getFilterBadgeColor = (filterType: string) => {
    const isActive = activeFilterSource === filterType;
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium transition-all duration-200";
    
    if (isActive) {
      return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ring-2 ring-purple-400`;
    }
    
    switch (filterType) {
      case 'status-chart':
        return `${baseClasses} mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'assignee-chart':
        return `${baseClasses} mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'progress-chart':
        return `${baseClasses} mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'matrix-chart':
        return `${baseClasses} mt-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'burndown-chart':
        return `${baseClasses} mt-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200`;
      case 'date-filter':
        return `${baseClasses} mt-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200`;
      default:
        return `${baseClasses} mt-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  };

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  }, []);

  // สร้าง assignees list จาก tasks
  const assignees = React.useMemo(() => {
    const assigneeMap = new Map<string, string>();
    
    filteredTasks.forEach(task => {
      if (task.Assignee) {
        task.Assignee.split(',').forEach(name => {
          const trimmed = name.trim();
          if (trimmed.length > 0) {
            const normalized = normalizeAssigneeName(trimmed);
            const formatted = formatAssigneeDisplayName(trimmed);
            
            // เก็บเฉพาะตัวแรกที่พบ หรือเลือกตัวที่มี format ดีกว่า
            if (!assigneeMap.has(normalized) || 
                (formatted.charAt(0) === formatted.charAt(0).toUpperCase() && 
                 assigneeMap.get(normalized)?.charAt(0) !== assigneeMap.get(normalized)?.charAt(0).toUpperCase())) {
              assigneeMap.set(normalized, formatted);
            }
          }
        });
      }
    });
    return Array.from(assigneeMap.values()).sort();
  }, [filteredTasks]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Date Range Filter - ลอยที่มุมขวาบน */}
        <div className="relative">
          <div className={`absolute top-0 right-0 z-10 ${activeFilterSource === 'date-filter' ? 'ring-2 ring-purple-400' : ''} transition-all duration-200 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-gray-700`}>
            <div className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Due Date Filter</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">From:</label>
                <input
                  type="date"
                  value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateRangeFilter({
                    ...filters.dateRange,
                    start: e.target.value ? new Date(e.target.value) : null
                  }, 'date-filter')}
                  className="text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">To:</label>
                <input
                  type="date"
                  value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateRangeFilter({
                    ...filters.dateRange,
                    end: e.target.value ? new Date(e.target.value) : null
                  }, 'date-filter')}
                  className="text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              {(filters.dateRange.start || filters.dateRange.end) && (
                <button
                  onClick={() => handleDateRangeFilter({ start: null, end: null }, 'date-filter')}
                  className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Interactive insights into your project tasks - click on charts to filter data</p>
        </div>

        {/* Enhanced Filter Indicators and Controls */}
        {hasActiveFilters() && (
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
                
                {filters.status && (
                  <span className={getFilterBadgeColor('status-chart')}>
                    Status: {filters.status}
                  </span>
                )}
                
                {filters.assignee && (
                  <span className={getFilterBadgeColor('assignee-chart')}>
                    Assignee: {filters.assignee}
                  </span>
                )}
                
                {filters.projectId && (
                  <span className={getFilterBadgeColor('progress-chart')}>
                    Project: {projectNamesMap.get(filters.projectId) || filters.projectId}
                  </span>
                )}
                
                {filters.priorityQuadrant && (
                  <span className={getFilterBadgeColor('matrix-chart')}>
                    Priority: {filters.priorityQuadrant.replace('-', ' ')}
                  </span>
                )}
                
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <span className={getFilterBadgeColor('burndown-chart')}>
                    Date Range: {filters.dateRange.start?.toLocaleDateString()} - {filters.dateRange.end?.toLocaleDateString()}
                  </span>
                )}
                
                {(filters.progressRange.min > 0 || filters.progressRange.max < 100) && (
                  <span className={getFilterBadgeColor('progress-filter')}>
                    Progress: {filters.progressRange.min}% - {filters.progressRange.max}%
                  </span>
                )}
                
                <button 
                  onClick={handleClearFilters} 
                  className="ml-4 mt-1 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredTasks.length} of {initialTasks.length} tasks
                {activeFilterSource && (
                  <span className="ml-2 text-purple-600 dark:text-purple-400">
                    • Last filtered by: {activeFilterSource.replace('-', ' ')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 1: Task Status + Task Assignee */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskStatusChart 
            tasks={filteredTasks} 
            selectedStatus={filters.status} 
            setSelectedStatus={handleStatusFilter}
            isHighlighted={activeFilterSource === 'status-chart'}
          />
          <TaskAssigneeChart 
            tasks={filteredTasks} 
            selectedAssignee={filters.assignee} 
            setSelectedAssignee={handleAssigneeFilter}
            isHighlighted={activeFilterSource === 'assignee-chart'}
          />
        </div>

        {/* Row 2: Project Progress + Task Prioritization Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectProgressChart 
            tasks={filteredTasks} 
            projectNamesMap={projectNamesMap}
            selectedProjectId={filters.projectId}
            setSelectedProjectId={handleProjectFilter}
            isHighlighted={activeFilterSource === 'progress-chart'}
          />
          <TaskPrioritizationMatrix 
            tasks={filteredTasks}
            selectedQuadrant={filters.priorityQuadrant}
            setSelectedQuadrant={handlePriorityQuadrantFilter}
            isHighlighted={activeFilterSource === 'matrix-chart'}
          />
        </div>

        {/* Row 3: Burn-down Chart (Full Width) */}
        <div className="grid grid-cols-1">
          <BurndownChart 
            tasks={filteredTasks}
            selectedDateRange={filters.dateRange}
            setSelectedDateRange={handleDateRangeFilter}
            isHighlighted={activeFilterSource === 'burndown-chart'}
          />
        </div>

        <div className="grid grid-cols-1">
          {/* Progress Range Filter - ลอยที่มุมขวาบน */}
          <div className="relative">
            <div className={`absolute top-1 right-1 z-10 ${activeFilterSource === 'progress-filter' ? 'ring-2 ring-purple-400' : ''} transition-all duration-200 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Progress:</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">Min:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.progressRange.min}
                    onChange={(e) => handleProgressRangeFilter({
                      ...filters.progressRange,
                      min: parseInt(e.target.value)
                    }, 'progress-filter')}
                    className="w-16"
                  />
                  <span className="text-xs w-7">{filters.progressRange.min}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">Max:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.progressRange.max}
                    onChange={(e) => handleProgressRangeFilter({
                      ...filters.progressRange,
                      max: parseInt(e.target.value)
                    }, 'progress-filter')}
                    className="w-16"
                  />
                  <span className="text-xs w-7">{filters.progressRange.max}%</span>
                </div>
              </div>
            </div>

            {/* Filtered Tasks Table */}
            <FilteredTasksTable 
              tasks={filteredTasks} 
              projectNamesMap={projectNamesMap} 
              filters={filters}
              trackingData={trackingData}
              trackingLoading={trackingLoading}
              onTaskClick={handleTaskClick} 
            />
          </div>
        </div>
      </div>
      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={selectedTask}
        projectId={selectedTask?.projectId || ''}
        assignees={assignees}
      />
    </div>
  );
}