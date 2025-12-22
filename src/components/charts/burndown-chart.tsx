'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDarkMode } from './use-dark-mode';
import { Task } from './types';

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

    return (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border transition-all duration-200 hover:shadow-lg ${isHighlighted ? 'ring-2 ring-purple-400' : ''}`}>
            <CardHeader>
                <CardTitle className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
                    Burn-down chart for Effort
                    {(selectedDateRange?.start || selectedDateRange?.end) && <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Filtered</span>}
                </CardTitle>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click on bars to filter tasks by month</p>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={burnDownData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f1f5f9'} />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: isDark ? '#9ca3af' : '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
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
                                itemStyle={{ color: isDark ? '#f3f4f6' : '#000' }}
                                cursor={{ fill: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                            />
                            <Bar
                                dataKey="effort"
                                name="Total Effort"
                                fill={isDark ? '#3b82f6' : '#3b82f6'}
                                radius={[4, 4, 0, 0]}
                                onClick={handleBarClick}
                                style={{ cursor: 'pointer' }}
                            >
                                {burnDownData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isSelected ? '#8b5cf6' : (isDark ? '#3b82f6' : '#3b82f6')}
                                        style={{
                                            opacity: entry.isSelected ? 1 : ((selectedDateRange?.start || selectedDateRange?.end) ? 0.5 : 1),
                                            filter: entry.isSelected ? 'brightness(1.1)' : 'none'
                                        }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className={`mt-4 flex justify-between items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Total Effort: {burnDownData.reduce((sum, item) => sum + item.effort, 0)} points</span>
                    <span>Timeline: {burnDownData.length} months</span>
                </div>
            </CardContent>
        </Card>
    );
}
