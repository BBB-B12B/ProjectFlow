'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDarkMode } from './use-dark-mode';
import { Task } from './types';

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
