import type { Task, Project } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectDetailsClient } from '@/components/project-details-client';
import { BackButton } from '@/components/back-button';
import { getUniqueAssignees } from './actions';

async function getProject(id: string): Promise<Project | null> {
    const projectDocRef = doc(db, 'projects', id);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) {
        return null;
    }
    const data = projectDoc.data();
    return {
      id: projectDoc.id,
      name: data.ProjectName,
      description: data.description || 'No description available.',
      startDate: data.StartDate,
      endDate: data.EndDate,
      ...data
    } as Project;
}

async function getProjectTasks(projectId: string): Promise<Task[]> {
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, where('projectId', '==', projectId));
    const taskSnapshot = await getDocs(q);
    const taskList = taskSnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure all necessary fields from the DB are explicitly mapped
      return {
        id: doc.id,
        TaskName: data.TaskName || '',
        Status: data.Status || '',
        EndDate: data.EndDate || '',
        StartDate: data.StartDate || '',
        ProjectType: data.ProjectType || '',
        Assignee: data.Assignee || '',
        Category: data.Category || '',
        Owner: data.Owner || '',
        Want: data.Want || '',
        // Add any other fields from your DB schema here with defaults
        ...data,
      } as Task;
    });
    return taskList;
}

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  // Fetch data in parallel
  const [project, projectTasks, assignees] = await Promise.all([
    getProject(params.id),
    getProjectTasks(params.id),
    getUniqueAssignees()
  ]);
  
  if (!project) {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    if(projectSnapshot.empty) {
      redirect('/seed');
    }
    notFound();
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <ProjectDetailsClient tasks={projectTasks} assignees={assignees} />
    </div>
  );
}
