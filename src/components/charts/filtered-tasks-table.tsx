'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Calendar, User, Briefcase, ListTodo, Sliders } from 'lucide-react';
import { useDarkMode } from './use-dark-mode';
import { Task } from './types';
import { format } from 'date-fns';

interface FilterState {
    status: string | null;
    assignee: string | null;
    projectId: string | null;
    priorityQuadrant: string | null;
    dateRange: { start: Date | null; end: Date | null };
    progressRange: { min: number; max: number };
}

export function FilteredTasksTable({
    tasks,
    projectNamesMap,
    filters,
    onTaskClick
}: {
    tasks: Task[],
    projectNamesMap?: Map<string, string>,
    filters?: FilterState,
    onTaskClick?: (task: Task) => void
}) {
    const isDark = useDarkMode();
    // Helper function for status colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ยังไม่ได้เริ่ม': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'กำลังดำเนินการ': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'ติดปัญหา': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'จบงานแล้ว': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Helper function for priority quadrant colors
    const getQuadrantInfo = (effort: number, effect: number) => {
        if (effort <= 5 && effect > 5) return { label: 'Quick Win', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
        if (effort > 5 && effect > 5) return { label: 'Major Project', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
        if (effort <= 5 && effect <= 5) return { label: 'Fill-in', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
        if (effort > 5 && effect <= 5) return { label: 'Thankless', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    };

    // Helper to render assignees as separate badges
    const renderAssignees = (assigneeString?: string) => {
        if (!assigneeString) return <span className="text-xs text-gray-400 italic">Unassigned</span>;
        const names = assigneeString.split(',').map(name => name.trim()).filter(Boolean);
        return (
            <div className="flex flex-wrap gap-1">
                {names.map((name, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                        {name}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md mt-6 w-full`}>
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <CardTitle className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
                        <ListTodo className="w-5 h-5 text-purple-500" />
                        Task List
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                            ({tasks.length} tasks found)
                        </span>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-md h-[500px] w-full overflow-auto relative">
                    <table className="w-full text-left border-collapse caption-bottom text-sm">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className={`${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'} text-xs uppercase tracking-wider`}>
                                <th className={`p-4 font-semibold ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Task Name</th>
                                <th className={`p-4 font-semibold ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Status</th>
                                <th className={`p-4 font-semibold ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Priority</th>
                                <th className={`p-4 font-semibold hidden md:table-cell ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Details</th>
                                <th className={`p-4 font-semibold hidden lg:table-cell ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Assignee</th>
                                <th className={`p-4 font-semibold hidden xl:table-cell ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Project</th>
                                <th className={`p-4 font-semibold ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>Action</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {tasks.length > 0 ? (
                                tasks.map((task) => {
                                    const quadrant = getQuadrantInfo(task.Effort || 0, task.Effect || 0);
                                    const projectName = projectNamesMap?.get(task.projectId || '') || task.projectId || 'Unknown Project';

                                    return (
                                        <tr key={task.id} className={`${isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50'} transition-colors duration-150`}>
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-sm md:text-base line-clamp-2" title={task.TaskName}>{task.TaskName}</div>
                                                {/* Mobile-only details */}
                                                <div className="md:hidden mt-2 space-y-1">
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" /> {projectName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {task.Assignee || 'Unassigned'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Sliders className="w-3 h-3" /> {task.Progress}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(task.Status)} shadow-sm`}>
                                                    {task.Status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${quadrant.color} border border-transparent`}>
                                                    {quadrant.label}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top hidden md:table-cell">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-500 w-16">Progress:</span>
                                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-purple-500 h-2 rounded-full"
                                                                style={{ width: `${task.Progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{task.Progress}%</span>
                                                    </div>

                                                    {(task.StartDate || task.EndDate) && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Calendar className="w-3 h-3 text-gray-400" />
                                                            {task.EndDate ? (
                                                                <span>Due: {format(new Date(task.EndDate), 'MMM d, yyyy')}</span>
                                                            ) : (
                                                                <span>Start: {format(new Date(task.StartDate), 'MMM d, yyyy')}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top hidden lg:table-cell">
                                                {renderAssignees(task.Assignee)}
                                            </td>
                                            <td className="p-4 align-top hidden xl:table-cell">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={projectName}>
                                                    {projectName}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 shadow-sm h-8 w-8 p-0 rounded-full"
                                                    onClick={() => onTaskClick && onTaskClick(task)}
                                                    title="Edit task"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <ListTodo className="w-8 h-8 opacity-20" />
                                            <p>No tasks match the selected filters.</p>
                                            <Button
                                                variant="link"
                                                onClick={() => window.location.reload()}
                                                className="text-purple-600 dark:text-purple-400"
                                            >
                                                Clear filters
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
