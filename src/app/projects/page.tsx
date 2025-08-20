import { projects } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProjectGanttChart } from '@/components/project-gantt-chart';

export default function ProjectsPage() {
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
