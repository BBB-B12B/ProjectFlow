'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDarkMode } from './use-dark-mode';
import { Task } from './types';

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
                <div className="w-full flex flex-col">
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
                    </div>
                    {/* เพิ่มปุ่มคลิกสำหรับ Assignee */}
                    <div className="mt-4 mb-6 flex flex-wrap gap-2 justify-center">
                        {chartData.slice(0, 4).map((assignee, index) => (
                            <button
                                key={index}
                                onClick={() => handleBarClick(assignee)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${assignee.isSelected
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ring-2 ring-purple-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {assignee.name} ({assignee.tasks})
                            </button>
                        ))}
                        {chartData.length > 4 && (
                            <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                +{chartData.length - 4} more (click on chart bars)
                            </span>
                        )}
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
