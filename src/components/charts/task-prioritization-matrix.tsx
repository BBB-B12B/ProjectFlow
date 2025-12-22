'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useDarkMode } from './use-dark-mode';
import { Task } from './types';

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
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${selectedQuadrant === quad.key
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
