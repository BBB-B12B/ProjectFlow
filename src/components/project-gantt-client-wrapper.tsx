
'use client';

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { ProjectGanttChart } from '@/components/project-gantt-chart';
import type { Project } from '@/lib/types';


export function ProjectGanttClientWrapper({ initialProjects }: { initialProjects: Project[] }) {
    const [timeframe, setTimeframe] = useState('Monthly');

    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Project Gantt Chart</CardTitle>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="timeframe" className="text-sm font-medium">Timeframe</Label>
                        <Select value={timeframe} onValueChange={setTimeframe}>
                            <SelectTrigger className="w-[120px]" id="timeframe">
                                <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Weekly">Weekly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <ProjectGanttChart projects={initialProjects} timeframe={timeframe} />
            </CardContent>
        </>
    );
}
