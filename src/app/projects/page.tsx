import type { Project } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectsClientPage } from './projects-client-page';
import { redirect } from 'next/navigation';

async function getProjects(): Promise<Project[]> {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    const projectList = projectSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            // Backwards compatibility: check for new 'name' field, fallback to old 'ProjectName'
            name: data.name || data.ProjectName,
            description: data.description,
            startDate: data.startDate || data.StartDate,
            endDate: data.endDate || data.EndDate,
            status: data.status,
        } as Project;
    });
    return projectList;
}

export default async function ProjectsPage() {
    const projects = await getProjects();
    
    if (projects.length === 0) {
        // If there are no projects, redirect to the seed page to populate the database
        redirect('/seed');
    }

    return <ProjectsClientPage projects={projects} />;
}
