//home/user/studio/src/components/charts.tsx
'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ReferenceLine } from 'recharts';

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

// แก้ไข useDarkMode hook เพื่อป้องกัน hydration error
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkDarkMode = () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
      };
      
      checkDarkMode();
      
      // ตรวจสอบการเปลี่ยนแปลง dark mode
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => observer.disconnect();
    }
  }, []);
  
  return isDark;
}

// Helper function to split multiselect assignees
function splitAssignees(assigneeString: string): string[] {
  if (!assigneeString || assigneeString.trim() === '') return ['Unassigned'];
  
  return assigneeString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(name => name || 'Unassigned');
}

// Enhanced Task Status Chart with click interactions
export function TaskStatusChart({ 
  tasks, 
  selectedStatus, 
  setSelectedStatus, 
  isHighlighted = false 
}: { 
  tasks: Task[], 
  selectedStatus: string | null, 
  setSelectedStatus: (status: string | null, source?: string) => void,
  isHighlighted?: boolean
}) {
  console.log('TaskStatusChart received tasks:', tasks.length);
  const isDark = useDarkMode();

  // Create better status mapping
  const tasksByStatus = {
    'To Do': tasks.filter((t) => {
      const status = t.Status;
      return status === 'ยังไม่ได้เริ่ม';
    }).length,
    'In Progress': tasks.filter((t) => {
      const status = t.Status;
      return status === 'กำลังดำเนินการ';
    }).length,
    'Done': tasks.filter((t) => {
      const status = t.Status;
      return status === 'จบงานแล้ว';
    }).length,
  };

  const total = tasks.length || 1;
  const chartData = [
    { 
      name: 'To Do', 
      value: (tasksByStatus['To Do'] / total) * 100, 
      count: tasksByStatus['To Do'], 
      color: selectedStatus === 'To Do' ? '#8b5cf6' : (isDark ? '#38bdf8' : '#67e8f9'),
      isSelected: selectedStatus === 'To Do'
    },
    { 
      name: 'In Progress', 
      value: (tasksByStatus['In Progress'] / total) * 100, 
      count: tasksByStatus['In Progress'], 
      color: selectedStatus === 'In Progress' ? '#8b5cf6' : (isDark ? '#0ea5e9' : '#3b82f6'),
      isSelected: selectedStatus === 'In Progress'
    },
    { 
      name: 'Done', 
      value: (tasksByStatus['Done'] / total) * 100, 
      count: tasksByStatus['Done'], 
      color: selectedStatus === 'Done' ? '#8b5cf6' : (isDark ? '#0369a1' : '#1e40af'),
      isSelected: selectedStatus === 'Done'
    }
  ];

  const handleSegmentClick = (data: any) => {
    const statusMapping: Record<string, string> = {
      'To Do': 'ยังไม่ได้เริ่ม',
      'In Progress': 'กำลังดำเนินการ', 
      'Done': 'จบงานแล้ว'
    };
    
    const actualStatus = statusMapping[data.name];
    if (selectedStatus === actualStatus) {
      setSelectedStatus(null, 'status-chart');
    } else {
      setSelectedStatus(actualStatus, 'status-chart');
    }
  };

  return (
    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border transition-all duration-200 hover:shadow-lg ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
          Task Status
          {selectedStatus && <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Filtered</span>}
        </CardTitle>
        <p className="text-xs text-gray-500 dark:text-gray-400">Click on segments to filter</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex items-center justify-center gap-8">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              startAngle={90}
              endAngle={450}
              onClick={handleSegmentClick}
              stroke="transparent"
              strokeWidth={2}
            >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{ 
                      cursor: 'pointer',
                      opacity: entry.isSelected ? 1 : (selectedStatus ? 0.5 : 1),
                      filter: entry.isSelected ? 'brightness(1.1)' : 'none'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : 'white',
                  border: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  fontSize: '14px',
                  padding: '12px',
                  color: isDark ? '#f3f4f6' : '#000'
                }}
                formatter={(value: any, name: any, props: any) => [`${props.payload.count} tasks`, name]}
                labelFormatter={(label: any, props: any) => `Status: ${props[0]?.payload.name} (Click to filter)`}
              />
            </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Task</span>
              <span className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{tasks.length}</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>tasks</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(tasksByStatus).map(([status, count]) => (
              <div 
                key={status}
                className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg text-center min-w-[100px] cursor-pointer transition-all duration-200 hover:scale-105 ${selectedStatus === status ? 'ring-2 ring-purple-400' : ''}`}
                onClick={() => handleSegmentClick({ name: status })}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{status}</div>
                <div className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{count}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs justify-center">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${item.isSelected ? 'font-bold' : ''}`}
              onClick={() => handleSegmentClick(item)}
            >
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.name} {item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Task Assignee Chart with click interactions
export function TaskAssigneeChart({ 
  tasks, 
  selectedAssignee, 
  setSelectedAssignee, 
  isHighlighted = false 
}: { 
  tasks: Task[], 
  selectedAssignee: string | null, 
  setSelectedAssignee: (assignee: string | null, source?: string) => void,
  isHighlighted?: boolean
}) {
  const isDark = useDarkMode();
  
  // Process assignee data with multiselect support
  const assigneeData = tasks.reduce((acc: Record<string, number>, task) => {
    const assigneeString = task.Assignee || '';
    const assignees = assigneeString
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (assignees.length === 0) {
      assignees.push('Unassigned');
    }
    
    assignees.forEach(assignee => {
      acc[assignee] = (acc[assignee] || 0) + 1;
    });
    
    return acc;
  }, {});

  // Convert to chart data and sort by task count (descending)
  const chartData = Object.entries(assigneeData)
    .map(([name, taskCount]) => ({ 
      name, 
      tasks: taskCount,
      isSelected: selectedAssignee === name
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 10);

  const handleBarClick = (data: any) => {
    const clickedAssignee = data.name;
    if (selectedAssignee === clickedAssignee) {
      setSelectedAssignee(null, 'assignee-chart');
    } else {
      setSelectedAssignee(clickedAssignee, 'assignee-chart');
    }
  };

  return (
    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border transition-all duration-200 hover:shadow-lg ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
          Task Assignee
          {selectedAssignee && <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Filtered</span>}
        </CardTitle>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click on bars to filter by assignee</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="w-full h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ 
                top: 20, 
                right: 30, 
                left: 20, 
                bottom: chartData.length > 6 ? 60 : 40 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f1f5f9'} />
              <XAxis 
                dataKey="name"
                angle={chartData.length > 6 ? -45 : 0}
                textAnchor={chartData.length > 6 ? "end" : "middle"}
                height={chartData.length > 6 ? 60 : 40}
                fontSize={12}
                interval={0}
                tick={{ fill: isDark ? '#9ca3af' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false}
                fontSize={12}
                tick={{ fill: isDark ? '#9ca3af' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : 'white',
                  border: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  fontSize: '14px',
                  padding: '12px',
                  color: isDark ? '#f3f4f6' : '#000'
                }}
                formatter={(value: any) => [value, 'Tasks']}
                labelFormatter={(label: any) => `Assignee: ${label} (Click to filter)`}
                cursor={{ fill: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
              />
              <Bar 
                dataKey="tasks" 
                radius={[6, 6, 0, 0]}
                stroke={isDark ? '#3b82f6' : '#2563eb'}
                strokeWidth={1}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isSelected ? '#8b5cf6' : (isDark ? '#60a5fa' : '#3b82f6')}
                    style={{ 
                      opacity: entry.isSelected ? 1 : (selectedAssignee ? 0.5 : 1),
                      filter: entry.isSelected ? 'brightness(1.1)' : 'none'
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* เพิ่มปุ่มคลิกสำหรับ Assignee */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {chartData.map((assignee, index) => (
              <button
                key={index}
                onClick={() => handleBarClick(assignee)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  assignee.isSelected
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ring-2 ring-purple-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {assignee.name} ({assignee.tasks})
              </button>
            ))}
          </div>
        </div>
        
        <div className={`mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>Total People: {chartData.length}</span>
          <span>Total Tasks: {chartData.reduce((sum, item) => sum + item.tasks, 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Project Progress Chart with click interactions
export function ProjectProgressChart({ 
  tasks, 
  projectNamesMap, 
  selectedProjectId, 
  setSelectedProjectId, 
  isHighlighted = false 
}: { 
  tasks: Task[], 
  projectNamesMap?: Map<string, string>,
  selectedProjectId?: string | null,
  setSelectedProjectId?: (projectId: string | null, source?: string) => void,
  isHighlighted?: boolean
}) {
  console.log('ProjectProgressChart received tasks:', tasks.length);
  const isDark = useDarkMode();
  
  const progressData = tasks.reduce((acc: Record<string, any>, task: Task) => {
    const projectId = task.projectId || task.ProjectType || 'Unknown';
    if (!acc[projectId]) {
      acc[projectId] = {
        projectId,
        totalTasks: 0,
        totalProgress: 0,
      };
    }
    
    acc[projectId].totalTasks += 1;
    acc[projectId].totalProgress += task.Progress || 0;
    
    return acc;
  }, {});

  const chartData = Object.values(progressData)
    .map((project: any) => {
      const projectName = projectNamesMap?.get(project.projectId) || project.projectId;
      const displayName = projectName === 'Unknown' ? 'Unknown Project' : 
                         projectName.length > 20 ? `${projectName.substring(0, 20)}...` : projectName;
      
      return {
        projectId: project.projectId,
        name: displayName,
        fullName: projectName,
        progress: Math.round((project.totalProgress / project.totalTasks) || 0),
        taskCount: project.totalTasks,
        isSelected: selectedProjectId === project.projectId
      };
    })
    .filter(project => project.name !== 'Unknown Project')
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);

  const handleProjectClick = (project: any) => {
    if (!setSelectedProjectId) return;
    
    if (selectedProjectId === project.projectId) {
      setSelectedProjectId(null, 'progress-chart');
    } else {
      setSelectedProjectId(project.projectId, 'progress-chart');
    }
  };

  return (
    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border transition-all duration-200 hover:shadow-lg ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
          % Complete of Project
          {selectedProjectId && <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Filtered</span>}
        </CardTitle>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click on projects to filter tasks</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {chartData.length > 0 ? chartData.map((project, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 group cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg ${project.isSelected ? 'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              onClick={() => handleProjectClick(project)}
            >
              <span className={`text-sm font-medium w-32 ${isDark ? 'text-gray-300' : 'text-gray-700'} truncate`} title={project.fullName}>
                {project.name}
              </span>
              <div className={`flex-1 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-6 relative overflow-hidden`}>
                <div 
                  className={`h-6 rounded-full transition-all duration-500 ease-out ${project.isSelected ? 'bg-gradient-to-r from-purple-400 to-purple-600' : 'bg-gradient-to-r from-cyan-400 to-cyan-600'}`}
                  style={{ width: `${Math.min(project.progress, 100)}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                  {project.progress}%
                </span>
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} w-16 text-right`}>
                {project.taskCount} tasks
              </span>
            </div>
          )) : (
            <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} py-8`}>
              <div className="text-sm">No project data available</div>
              <div className="text-xs mt-1">Projects will appear here once tasks are assigned to them</div>
            </div>
          )}
        </div>
        
        {chartData.length > 0 && (
          <div className={`mt-6 flex justify-between items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
            <span>Active Projects: {chartData.length}</span>
            <span>Avg Progress: {Math.round(chartData.reduce((sum, p) => sum + p.progress, 0) / chartData.length)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Task Prioritization Matrix with quadrant selection
export function TaskPrioritizationMatrix({ 
  tasks, 
  selectedQuadrant, 
  setSelectedQuadrant, 
  isHighlighted = false 
}: { 
  tasks: Task[],
  selectedQuadrant?: string | null,
  setSelectedQuadrant?: (quadrant: string | null, source?: string) => void,
  isHighlighted?: boolean
}) {
  console.log('TaskPrioritizationMatrix received tasks:', tasks.length);
  const isDark = useDarkMode();

  // Helper function to determine quadrant
  const getQuadrant = (effort: number, effect: number): string => {
    if (effort <= 5 && effect > 5) return 'quick-wins';
    if (effort > 5 && effect > 5) return 'major-projects';
    if (effort <= 5 && effect <= 5) return 'fill-ins';
    if (effort > 5 && effect <= 5) return 'thankless-tasks';
    return 'unknown';
  };

  const groupedTasks = tasks
    .filter(task => (task.Effort > 0 || task.Effect > 0) && task.TaskName)
    .reduce((acc: Record<string, Task[]>, task) => {
      const key = `${task.Effort || 0}-${task.Effect || 0}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(task);
      return acc;
    }, {});

  const scatterData = Object.entries(groupedTasks).map(([key, tasks]) => {
    const [effort, effect] = key.split('-').map(Number);
    const quadrant = getQuadrant(effort, effect);
    
    if (tasks.length === 1) {
      const task = tasks[0];
      return {
        effort,
        effect,
        name: task.TaskName?.substring(0, 30) + (task.TaskName?.length > 30 ? '...' : '') || '',
        fullName: task.TaskName || '',
        status: task.Status || 'Unknown',
        assignee: task.Assignee || 'Unassigned',
        progress: task.Progress || 0,
        taskCount: 1,
        quadrant,
        isSelected: selectedQuadrant === quadrant
      };
    } else {
      return {
        effort,
        effect,
        name: `${tasks.length} tasks`,
        fullName: `Multiple tasks (${tasks.length})`,
        status: 'Multiple',
        assignee: 'Multiple',
        progress: Math.round(tasks.reduce((sum, t) => sum + (t.Progress || 0), 0) / tasks.length),
        taskCount: tasks.length,
        quadrant,
        isSelected: selectedQuadrant === quadrant,
        taskList: tasks.map(t => ({
          name: t.TaskName || 'Unnamed',
          status: t.Status || 'Unknown',
          assignee: t.Assignee || 'Unassigned',
          progress: t.Progress || 0
        }))
      };
    }
  });

  const handleScatterClick = (data: any) => {
    if (!setSelectedQuadrant) return;
    
    const clickedQuadrant = data.quadrant;
    if (selectedQuadrant === clickedQuadrant) {
      setSelectedQuadrant(null, 'matrix-chart');
    } else {
      setSelectedQuadrant(clickedQuadrant, 'matrix-chart');
    }
  };

  // Quadrant labels for reference
  const quadrantLabels = [
    { x: 2.5, y: 7.5, label: 'Quick Wins', color: '#22c55e', key: 'quick-wins' },
    { x: 7.5, y: 7.5, label: 'Major Projects', color: '#f59e0b', key: 'major-projects' },
    { x: 2.5, y: 2.5, label: 'Fill-ins', color: '#6b7280', key: 'fill-ins' },
    { x: 7.5, y: 2.5, label: 'Thankless Tasks', color: '#ef4444', key: 'thankless-tasks' }
  ];

  return (
    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border transition-all duration-200 hover:shadow-lg ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}>
      <CardHeader>
        <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
          Task Prioritization Matrix
          {selectedQuadrant && <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Filtered</span>}
        </CardTitle>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click on points to filter by priority quadrant</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart 
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              data={scatterData}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f1f5f9'} />
              <XAxis 
                type="number" 
                dataKey="effort" 
                name="Effort" 
                domain={[0, 10]}
                tick={{ fill: isDark ? '#9ca3af' : '#64748b' }}
                label={{ value: 'Effort', position: 'insideBottom', offset: -5, fill: isDark ? '#9ca3af' : '#64748b' }}
              />
              <YAxis 
                type="number" 
                dataKey="effect" 
                name="Effect" 
                domain={[0, 10]}
                tick={{ fill: isDark ? '#9ca3af' : '#64748b' }}
                label={{ value: 'Effect', angle: -90, position: 'insideLeft', fill: isDark ? '#9ca3af' : '#64748b' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0].payload;
                  
                  return (
                    <div className={`${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-800'} rounded-lg shadow-lg p-3 min-w-[200px]`}>
                      <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{data.fullName}</div>
                      <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Effort: {data.effort} | Effect: {data.effect}</div>
                      <div className={`text-xs px-2 py-1 rounded ${data.quadrant === 'quick-wins' ? 'bg-green-100 text-green-800' : data.quadrant === 'major-projects' ? 'bg-yellow-100 text-yellow-800' : data.quadrant === 'fill-ins' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                        {data.quadrant.replace('-', ' ')}
                      </div>
                      
                      {data.taskCount === 1 ? (
                        <>
                          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Status: {data.status}</div>
                          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Assignee: {data.assignee}</div>
                          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Progress: {data.progress}%</div>
                        </>
                      ) : (
                        <>
                          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Tasks: {data.taskCount}</div>
                          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Avg Progress: {data.progress}%</div>
                        </>
                      )}
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Click to filter by quadrant</div>
                    </div>
                  );
                }}
              />
              <ReferenceLine x={5} strokeDasharray="5 5" stroke={isDark ? '#6b7280' : '#000'} strokeWidth={2} />
              <ReferenceLine y={5} strokeDasharray="5 5" stroke={isDark ? '#6b7280' : '#000'} strokeWidth={2} />
              
              {/* Quadrant background areas */}
              {quadrantLabels.map((quad) => (
                <text
                  key={quad.key}
                  x={`${(quad.x / 10) * 100}%`}
                  y={`${100 - (quad.y / 10) * 100}%`}
                  textAnchor="middle"
                  className={`text-xs fill-current ${selectedQuadrant === quad.key ? 'font-bold' : 'opacity-50'} ${isDark ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`}
                  onClick={() => setSelectedQuadrant && setSelectedQuadrant(selectedQuadrant === quad.key ? null : quad.key, 'matrix-chart')}
                >
                  {quad.label}
                </text>
              ))}
              
              <Scatter 
                name="Tasks" 
                data={scatterData} 
                stroke={isDark ? '#0ea5e9' : '#0ea5e9'}
                strokeWidth={2}
                r={6}
                onClick={handleScatterClick}
                style={{ cursor: 'pointer' }}
              >
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isSelected ? '#8b5cf6' : (isDark ? '#38bdf8' : '#67e8f9')}
                    style={{ 
                      opacity: entry.isSelected ? 1 : (selectedQuadrant ? 0.5 : 1),
                      filter: entry.isSelected ? 'brightness(1.1)' : 'none'
                    }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant legend with click functionality */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {quadrantLabels.map((quad) => (
            <button
              key={quad.key}
              onClick={() => setSelectedQuadrant && setSelectedQuadrant(selectedQuadrant === quad.key ? null : quad.key, 'matrix-chart')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedQuadrant === quad.key
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ring-2 ring-purple-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {quad.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// แก้ไข Burn-down Chart - ป้องกัน undefined error
export function BurndownChart({ 
  tasks, 
  selectedDateRange, 
  setSelectedDateRange, 
  isHighlighted = false 
}: { 
  tasks: Task[],
  selectedDateRange?: { start: Date | null; end: Date | null },
  setSelectedDateRange?: (dateRange: { start: Date | null; end: Date | null }, source?: string) => void,
  isHighlighted?: boolean
}) {
  console.log('BurndownChart received tasks:', tasks.length);
  const isDark = useDarkMode();
  
  const burnDownData = tasks
    .filter((task: Task) => task.EndDate)
    .reduce((acc: Array<{ month: string; effort: number; date: Date }>, task: Task) => {
      try {
        const date = new Date(task.EndDate);
        if (isNaN(date.getTime())) return acc;
        
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const existingMonth = acc.find(item => item.month === monthYear);
        if (existingMonth) {
          existingMonth.effort += task.Effort || 0;
        } else {
          acc.push({
            month: monthYear,
            effort: task.Effort || 0,
            date: new Date(date.getFullYear(), date.getMonth(), 1)
          });
        }
        
        return acc;
      } catch (error) {
        return acc;
      }
    }, [])
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-12)
    .map((item, index) => ({
      ...item,
      isSelected: selectedDateRange?.start && selectedDateRange?.end 
        ? item.date >= selectedDateRange.start && item.date <= selectedDateRange.end
        : false
    }));

  // แก้ไข handleBarClick - ป้องกัน undefined error
  const handleBarClick = (data: any, index: number) => {
    if (!setSelectedDateRange || !data || !data.date) return;

    try {
      const clickedDate = data.date;
      const startOfMonth = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1);
      const endOfMonth = new Date(clickedDate.getFullYear(), clickedDate.getMonth() + 1, 0);

      if (selectedDateRange?.start && selectedDateRange?.end &&
          startOfMonth.getTime() === selectedDateRange.start.getTime() &&
          endOfMonth.getTime() === selectedDateRange.end.getTime()) {
        setSelectedDateRange({ start: null, end: null }, 'burndown-chart');
      } else {
        setSelectedDateRange({ start: startOfMonth, end: endOfMonth }, 'burndown-chart');
      }
    } catch (error) {
      console.error('Error in handleBarClick:', error);
    }
  };

  const colors = isDark 
    ? ['#60a5fa', '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e']
    : ['#3b82f6', '#1e40af', '#7c3aed', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

  return (
    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border transition-all duration-200 hover:shadow-lg ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}>
      <CardHeader>
        <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
          Burn-down chart for Effort
          {(selectedDateRange?.start || selectedDateRange?.end) && <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Filtered</span>}
        </CardTitle>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click on bars to filter by date range</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={burnDownData}
              onClick={(data, index) => handleBarClick(data?.activePayload?.[0]?.payload, index)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f1f5f9'} />
              <XAxis 
                dataKey="month" 
                fontSize={12} 
                tick={{ fill: isDark ? '#9ca3af' : '#64748b' }} 
              />
              <YAxis tick={{ fill: isDark ? '#9ca3af' : '#64748b' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : 'white',
                  border: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: isDark ? '#f3f4f6' : '#000'
                }}
                formatter={(value: any) => [value, 'Effort']}
                labelFormatter={(label: any) => `${label} (Click to filter)`}
              />
              <Bar 
                dataKey="effort" 
                radius={[4, 4, 0, 0]}
                style={{ cursor: 'pointer' }}
              >
                {burnDownData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isSelected ? '#8b5cf6' : colors[index % colors.length]}
                    style={{ 
                      opacity: entry.isSelected ? 1 : ((selectedDateRange?.start || selectedDateRange?.end) ? 0.5 : 1),
                      filter: entry.isSelected ? 'brightness(1.1)' : 'none'
                    }}
                    onClick={() => handleBarClick(entry, index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Filtered Tasks Table with row interactions
export function FilteredTasksTable({ 
  tasks, 
  projectNamesMap, 
  filters, 
  onTaskClick 
}: { 
  tasks: Task[], 
  projectNamesMap?: Map<string, string>,
  filters?: any,
  onTaskClick?: (task: Task) => void
}) {
  const isDark = useDarkMode();
  
  // เพิ่ม sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // ฟังก์ชัน handle sort
  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // จัดเรียงข้อมูล
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue: any;
    let bValue: any;
    
    switch (sortConfig.key) {
      case 'TaskName':
        aValue = a.TaskName || '';
        bValue = b.TaskName || '';
        break;
      case 'Progress':
        aValue = a.Progress || 0;
        bValue = b.Progress || 0;
        break;
      case 'Status':
        aValue = a.Status || '';
        bValue = b.Status || '';
        break;
      case 'Assignee':
        aValue = a.Assignee || '';
        bValue = b.Assignee || '';
        break;
      case 'ProjectType':
        aValue = a.ProjectType || '';
        bValue = b.ProjectType || '';
        break;
      case 'EndDate':
        aValue = a.EndDate ? new Date(a.EndDate) : new Date(0);
        bValue = b.EndDate ? new Date(b.EndDate) : new Date(0);
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // ฟังก์ชันสำหรับแสดง sort icon
  const getSortIcon = (key: keyof Task) => {
    if (sortConfig.key !== key) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const displayTasks = sortedTasks.slice(0, 10);

  return (
    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border`}>
      <CardHeader>
        <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
          Filtered Tasks
          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
            {tasks.length} tasks
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <th 
                  className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} uppercase text-xs cursor-pointer transition-colors`}
                  onClick={() => handleSort('TaskName')}
                >
                  Task Name {getSortIcon('TaskName')}
                </th>
                <th 
                  className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} uppercase text-xs cursor-pointer transition-colors`}
                  onClick={() => handleSort('Progress')}
                >
                  Progress {getSortIcon('Progress')}
                </th>
                <th 
                  className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} uppercase text-xs cursor-pointer transition-colors`}
                  onClick={() => handleSort('Status')}
                >
                  Status {getSortIcon('Status')}
                </th>
                <th 
                  className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} uppercase text-xs cursor-pointer transition-colors`}
                  onClick={() => handleSort('Assignee')}
                >
                  Assignee {getSortIcon('Assignee')}
                </th>
                <th 
                  className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} uppercase text-xs cursor-pointer transition-colors`}
                  onClick={() => handleSort('ProjectType')}
                >
                  Project Type {getSortIcon('ProjectType')}
                </th>
                <th 
                  className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} uppercase text-xs cursor-pointer transition-colors`}
                  onClick={() => handleSort('EndDate')}
                >
                  Due Date {getSortIcon('EndDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.map((task, index) => (
                <tr 
                  key={task.id || index} 
                  className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors duration-200 cursor-pointer`}
                  onClick={() => onTaskClick && onTaskClick(task)}
                >
                  <td className={`py-3 px-2 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {task.TaskName?.substring(0, 40)}{task.TaskName?.length > 40 ? '...' : ''}
                  </td>
                  <td 
                    className={`py-3 px-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                    title={`Progress: ${task.Progress || 0}%\nStatus: ${task.Status || 'Unknown'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-8">{task.Progress || 0}%</span>
                      <div className={`flex-1 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-3 relative overflow-hidden min-w-[60px]`}>
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            (task.Progress || 0) === 100 
                              ? 'bg-green-600' 
                              : (task.Progress || 0) >= 70 
                              ? 'bg-green-500' 
                              : (task.Progress || 0) >= 50 
                              ? isDark ? 'bg-blue-500' : 'bg-gray-700'
                              : isDark ? 'bg-blue-600' : 'bg-gray-700'
                          }`}
                          style={{ width: `${Math.min(task.Progress || 0, 100)}%` }}
                        ></div>
                        {(task.Progress || 0) === 100 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                            Complete
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 px-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.Status?.toLowerCase().includes('done') || task.Status?.toLowerCase().includes('เสร็จ')
                        ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                        : task.Status?.toLowerCase().includes('progress') || task.Status?.toLowerCase().includes('กำลัง')
                        ? isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                        : isDark ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.Status}
                    </span>
                  </td>
                  <td className={`py-3 px-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {splitAssignees(task.Assignee).slice(0, 2).join(', ')}
                    {splitAssignees(task.Assignee).length > 2 && '...'}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.ProjectType === 'QuickWin'
                        ? isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                        : isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.ProjectType}
                    </span>
                  </td>
                  <td className={`py-3 px-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {task.EndDate ? new Date(task.EndDate).toLocaleDateString() : 'No date'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table summary */}
        <div className={`mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
          <span>Showing {displayTasks.length} of {tasks.length} tasks</span>
          <span className="text-xs">Click on headers to sort • Click on rows for details</span>
        </div>
      </CardContent>
    </Card>
  );
}