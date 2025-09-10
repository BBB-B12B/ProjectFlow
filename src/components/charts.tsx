'use client';
import React from 'react';
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

// Helper function to split multiselect assignees
function splitAssignees(assigneeString: string): string[] {
  if (!assigneeString || assigneeString.trim() === '') return ['Unassigned'];
  
  // Split by comma and clean up whitespace
  return assigneeString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(name => name || 'Unassigned');
}

// Component สำหรับ Task Status Donut Chart
export function TaskStatusChart({ tasks }: { tasks: Task[] }) {
  console.log('TaskStatusChart received tasks:', tasks.length, tasks.slice(0, 2)); // Debug log

  // Create better status mapping based on Thai status values
  const tasksByStatus = {
    'To Do': tasks.filter((t) => {
      const status = t.Status?.toLowerCase();
      return status === 'ยังไม่เริ่ม' || status === 'รอดำเนินการ' || status === 'todo' || status === 'to do';
    }).length,
    'In Progress': tasks.filter((t) => {
      const status = t.Status?.toLowerCase();
      return status === 'กำลังดำเนินการ' || status === 'in progress' || status === 'doing' || status === 'progress';
    }).length,
    'Done': tasks.filter((t) => {
      const status = t.Status?.toLowerCase();
      return status === 'จบงานแล้ว' || status === 'เสร็จแล้ว' || status === 'done' || status === 'completed';
    }).length,
  };

  const total = tasks.length || 1;
  const chartData = [
    { name: 'To Do', value: (tasksByStatus['To Do'] / total) * 100, count: tasksByStatus['To Do'], color: '#67e8f9' },
    { name: 'In Progress', value: (tasksByStatus['In Progress'] / total) * 100, count: tasksByStatus['In Progress'], color: '#0ea5e9' },
    { name: 'Done', value: (tasksByStatus['Done'] / total) * 100, count: tasksByStatus['Done'], color: '#0369a1' }
  ];

  return (
    <Card className="bg-white rounded-xl border border-gray-200 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Task Status</CardTitle>
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
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-gray-600">Total Task</span>
              <span className="text-2xl font-bold">{tasks.length}</span>
              <span className="text-sm text-gray-600">tasks</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center min-w-[100px]">
              <div className="text-sm text-gray-600 mb-1">To Do</div>
              <div className="text-2xl font-bold">{tasksByStatus['To Do']}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center min-w-[100px]">
              <div className="text-sm text-gray-600 mb-1">In Progress</div>
              <div className="text-2xl font-bold">{tasksByStatus['In Progress']}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center col-span-2 min-w-[100px]">
              <div className="text-sm text-gray-600 mb-1">Done</div>
              <div className="text-2xl font-bold">{tasksByStatus['Done']}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs justify-center">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
              <span>{item.name} {item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Component สำหรับ Task Assignee Bar Chart - Vertical Layout
export function TaskAssigneeChart({ tasks }: { tasks: Task[] }) {
  // Process assignee data with multiselect support
  const assigneeData = tasks.reduce((acc: Record<string, number>, task) => {
    // Split multiselect assignees (e.g., "Pe,Jang" becomes ["Pe", "Jang"])
    const assigneeString = task.Assignee || '';
    const assignees = assigneeString
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // If no assignees, mark as Unassigned
    if (assignees.length === 0) {
      assignees.push('Unassigned');
    }
    
    // Count tasks for each assignee
    assignees.forEach(assignee => {
      acc[assignee] = (acc[assignee] || 0) + 1;
    });
    
    return acc;
  }, {});

  // Convert to chart data and sort by task count (descending)
  const chartData = Object.entries(assigneeData)
    .map(([name, taskCount]) => ({ 
      name, 
      tasks: taskCount 
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 10); // Show top 10 assignees

  return (
    <Card className="bg-white rounded-xl border border-gray-200 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Task Assignee</CardTitle>
        <p className="text-sm text-gray-600">Number of tasks assigned to each person</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name"
                angle={chartData.length > 6 ? -45 : 0}
                textAnchor={chartData.length > 6 ? "end" : "middle"}
                height={chartData.length > 6 ? 60 : 40}
                fontSize={12}
                interval={0}
                tick={{ fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false}
                fontSize={12}
                tick={{ fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  fontSize: '14px',
                  padding: '12px'
                }}
                formatter={(value: any) => [value, 'Tasks']}
                labelFormatter={(label: any) => `Assignee: ${label}`}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Bar 
                dataKey="tasks" 
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                stroke="#2563eb"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary info - responsive */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
          <span>Total People: {chartData.length}</span>
          <span>Total Tasks: {chartData.reduce((sum, item) => sum + item.tasks, 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Component สำหรับ Project Progress
export function ProjectProgressChart({ tasks, projectNamesMap }: { tasks: Task[], projectNamesMap?: Map<string, string> }) {
  console.log('ProjectProgressChart received tasks:', tasks.length); // Debug log

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
      // Use project name from map if available, otherwise use projectId
      const projectName = projectNamesMap?.get(project.projectId) || project.projectId;
      const displayName = projectName === 'Unknown' ? 'Unknown Project' : 
                         projectName.length > 20 ? `${projectName.substring(0, 20)}...` : projectName;
      
      return {
        name: displayName,
        fullName: projectName, // Keep full name for tooltip
        progress: Math.round((project.totalProgress / project.totalTasks) || 0),
        taskCount: project.totalTasks
      };
    })
    .filter(project => project.name !== 'Unknown Project')
    .sort((a, b) => b.progress - a.progress) // Sort by progress descending
    .slice(0, 6);

  return (
    <Card className="bg-white rounded-xl border border-gray-200 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">% Complete of Project</CardTitle>
        <p className="text-sm text-gray-600">Project completion percentage by average task progress</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {chartData.length > 0 ? chartData.map((project, index) => (
            <div key={index} className="flex items-center gap-3 group">
              <span className="text-sm font-medium w-32 text-gray-700 truncate" title={project.fullName}>
                {project.name}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-6 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(project.progress, 100)}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                  {project.progress}%
                </span>
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">
                {project.taskCount} tasks
              </span>
            </div>
          )) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-sm">No project data available</div>
              <div className="text-xs mt-1">Projects will appear here once tasks are assigned to them</div>
            </div>
          )}
        </div>
        
        {/* Summary info */}
        {chartData.length > 0 && (
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600 pt-4 border-t border-gray-100">
            <span>Active Projects: {chartData.length}</span>
            <span>Avg Progress: {Math.round(chartData.reduce((sum, p) => sum + p.progress, 0) / chartData.length)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component สำหรับ Task Prioritization Matrix
export function TaskPrioritizationMatrix({ tasks }: { tasks: Task[] }) {
  console.log('TaskPrioritizationMatrix received tasks:', tasks.length); // Debug log

  const scatterData = tasks
    .filter(task => (task.Effort > 0 || task.Effect > 0) && task.TaskName)
    .map((task) => ({
      effort: Number(task.Effort || 0),
      effect: Number(task.Effect || 0),
      name: task.TaskName?.substring(0, 30) + (task.TaskName?.length > 30 ? '...' : '') || '',
    }));

  return (
    <Card className="bg-white rounded-xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Task Prioritization Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="effort" 
                name="Effort" 
                domain={[0, 10]}
                label={{ value: 'Effort', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="effect" 
                name="Effect" 
                domain={[0, 10]}
                label={{ value: 'Effect', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => [value, name]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.name;
                  }
                  return '';
                }}
              />
              <ReferenceLine x={5} strokeDasharray="5 5" stroke="#000" strokeWidth={2} />
              <ReferenceLine y={5} strokeDasharray="5 5" stroke="#000" strokeWidth={2} />
              <Scatter 
                name="Tasks" 
                data={scatterData} 
                fill="#67e8f9" 
                stroke="#0ea5e9"
                strokeWidth={2}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Component สำหรับ Burn-down Chart
export function BurndownChart({ tasks }: { tasks: Task[] }) {
  console.log('BurndownChart received tasks:', tasks.length); // Debug log

  const burnDownData = tasks
    .filter((task: Task) => task.EndDate)
    .reduce((acc: Array<{ month: string; effort: number }>, task: Task) => {
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
            effort: task.Effort || 0
          });
        }
        
        return acc;
      } catch (error) {
        return acc;
      }
    }, [])
    .sort((a, b) => {
      // Sort by month/year properly
      const dateA = new Date(a.month + ' 01');
      const dateB = new Date(b.month + ' 01');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-12); // Last 12 months

  const colors = ['#3b82f6', '#1e40af', '#7c3aed', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

  return (
    <Card className="bg-white rounded-xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Burn-down chart for Effort</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={burnDownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="effort" radius={[4, 4, 0, 0]}>
                {burnDownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Component สำหรับ Filtered Tasks Table
export function FilteredTasksTable({ tasks }: { tasks: Task[] }) {
  const displayTasks = tasks.slice(0, 10);

  return (
    <Card className="bg-white rounded-xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Filtered Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600 uppercase text-xs">Task Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 uppercase text-xs">Progress</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 uppercase text-xs">Status</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 uppercase text-xs">Assignee</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 uppercase text-xs">Project Type</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 uppercase text-xs">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.map((task, index) => (
                <tr key={task.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900">
                    {task.TaskName?.substring(0, 40)}{task.TaskName?.length > 40 ? '...' : ''}
                  </td>
                  <td className="py-3 px-2 text-gray-700">{task.Progress || 0}%</td>
                  <td className="py-3 px-2 text-gray-700">{task.Status}</td>
                  <td className="py-3 px-2 text-gray-700">
                    {splitAssignees(task.Assignee).slice(0, 2).join(', ')}
                    {splitAssignees(task.Assignee).length > 2 && '...'}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.ProjectType === 'QuickWin' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.ProjectType}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-700">{task.EndDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}