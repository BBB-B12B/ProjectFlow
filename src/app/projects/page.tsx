import type { Project, Task } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectsClientPage } from './projects-client-page';
import { redirect } from 'next/navigation';

async function getProjects(): Promise<Project[]> {
    try {
        // Fetch all projects and all tasks in parallel for efficiency
        const [projectSnapshot, taskSnapshot] = await Promise.all([
            getDocs(collection(db, 'projects')),
            getDocs(collection(db, 'tasks'))
        ]);

        const allTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const projectList = projectSnapshot.docs
            .map(doc => {
                const data = doc.data();
                const projectId = doc.id;

                // Filter tasks for the current project
                const tasksForProject = allTasks.filter(task => task.projectId === projectId);
                const completedTasks = tasksForProject.filter(task => task.Status === 'จบงานแล้ว').length;
                const totalTasks = tasksForProject.length;

                return {
                    id: projectId,
                    name: data.name || data.ProjectName,
                    description: data.description,
                    startDate: data.startDate || data.StartDate,
                    endDate: data.endDate || data.EndDate,
                    status: data.status || 'กำลังดำเนินการ',
                    team: data.team,
                    completedTasks,
                    totalTasks,
                } as Project;
            })
            .filter(project => project.status !== 'Archived');

        return projectList;

    } catch (error) {
        console.error("Error fetching projects and tasks:", error);
        return [];
    }
}

export default async function ProjectsPage() {
    const projects = await getProjects();
    
    if (projects.length === 0) {
        try {
            const allProjectsSnapshot = await getDocs(collection(db, 'projects'));
            if (allProjectsSnapshot.empty) {
                redirect('/seed');
            }
        } catch (error) {
            console.error("Could not verify if project collection is empty.", error);
        }
    }

    return <ProjectsClientPage projects={projects} />;
}
