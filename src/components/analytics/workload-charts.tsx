"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkloadData {
    name: string
    hours: number
    id: string // projectId or employeeName/Id
}

interface ChartProps {
    data: WorkloadData[]
    title: string
    description?: string
    color?: string
    onBarClick?: (data: WorkloadData) => void
    selectedId?: string | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                        </span>
                        <span className="font-bold text-muted-foreground">
                            {payload[0].value.toFixed(1)} hrs
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export function ProjectWorkloadChart({ data, title, description, color = "#8b5cf6", onBarClick, selectedId }: ChartProps) {
    const { theme } = useTheme()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        onClick={(data) => {
                            if (data && data.activePayload && data.activePayload.length > 0) {
                                onBarClick?.(data.activePayload[0].payload);
                            }
                        }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="hours" radius={[0, 4, 4, 0]} cursor="pointer">
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={selectedId === entry.id ? "#3b82f6" : (selectedId ? "#27272a" : color)}
                                    className="transition-all duration-200"
                                    opacity={selectedId && selectedId !== entry.id ? 0.3 : 1}
                                />
                            ))}
                            <LabelList dataKey="hours" position="right" formatter={(val: number) => val.toFixed(1)} className="fill-foreground text-xs" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export function EmployeeWorkloadChart({ data, title, description, color = "#3b82f6", onBarClick, selectedId }: ChartProps) {
    return (
        <ProjectWorkloadChart
            data={data}
            title={title}
            description={description}
            color={color}
            onBarClick={onBarClick}
            selectedId={selectedId}
        />
    )
}
