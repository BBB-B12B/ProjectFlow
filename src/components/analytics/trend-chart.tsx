"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrendData {
    name: string // Week or Month label
    hours: number
    key: string // ISO Week string or Year-Month string for logic
}

interface TrendChartProps {
    data: TrendData[]
    title: string
    description?: string
    viewMode: 'week' | 'month'
    onViewModeChange: (mode: 'week' | 'month') => void
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Period
                        </span>
                        <span className="font-bold text-muted-foreground">
                            {label}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Hours
                        </span>
                        <span className="font-bold text-foreground">
                            {payload[0].value.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export function WorkHoursTrendChart({ data, title, description, viewMode, onViewModeChange }: TrendChartProps) {
    const { theme } = useTheme()

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={viewMode === 'week' ? "default" : "outline"}
                        size="sm"
                        onClick={() => onViewModeChange('week')}
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={viewMode === 'month' ? "default" : "outline"}
                        size="sm"
                        onClick={() => onViewModeChange('month')}
                    >
                        Monthly
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pl-2 mt-4">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}h`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
