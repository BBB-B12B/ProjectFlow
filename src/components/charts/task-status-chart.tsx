'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from './use-dark-mode';
import { Task } from './types';

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
