import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProjectGanttChart } from '@/components/project-gantt-chart';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

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

export default async function ProjectsPage() {
  const projects = await getProjects();

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
        <CardContent className="pt-6">
          <ProjectGanttChart projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
