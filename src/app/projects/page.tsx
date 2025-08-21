
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ProjectGanttClientWrapper } from '@/components/project-gantt-client-wrapper';

async function getProjects(): Promise<Project[]> {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    
    if (projectSnapshot.empty) {
        return [];
    }

    const projectList = projectSnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Create a resilient mapping that checks for both camelCase and PascalCase
        return {
          id: doc.id,
          name: data.name || data.ProjectName, // Check for both name formats
          description: data.description || '',
          startDate: data.startDate || data.StartDate, // Check for both date formats
          endDate: data.endDate || data.EndDate,       // Check for both date formats
          status: data.status || data.Status,
        } as Project;
      })
      .filter(project => {
        // The filter now works correctly with the resilient mapping
        const hasEssentialData = project.name && project.startDate && project.endDate;
        if (!hasEssentialData) {
          console.warn(`Project with ID ${project.id} is missing essential data and will be filtered out.`);
        }
        return hasEssentialData;
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
