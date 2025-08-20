
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProjectGanttChart } from '@/components/project-gantt-chart';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';

async function getProjects(): Promise<Project[]> {
  const projectsCol = collection(db, 'projects');
  const projectSnapshot = await getDocs(projectsCol);
  const projectList = projectSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.ProjectName,
      description: data.description || '',
      startDate: data.StartDate,
      endDate: data.EndDate,
      ...(data as Omit<Project, 'id' | 'name' | 'description' | 'startDate' | 'endDate'>),
    };
  });
  return projectList;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeframe, setTimeframe] = useState('Monthly');

  useState(() => {
    getProjects().then(setProjects);
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">An overview of all your projects.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <Card>
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
          <ProjectGanttChart projects={projects} timeframe={timeframe} />
        </CardContent>
      </Card>
    </div>
  );
}
