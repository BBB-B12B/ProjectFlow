
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectGanttClientWrapper } from '@/components/project-gantt-client-wrapper';

async function getProjects(): Promise<Project[]> {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    if (projectSnapshot.empty) {
        return [];
    }
    const projectList = projectSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.ProjectName,
            description: data.description || '',
            startDate: data.StartDate,
            endDate: data.EndDate,
            ...data
        } as Project;
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
        <ProjectGanttClientWrapper initialProjects={projects} />
      </Card>
    </div>
  );
}
