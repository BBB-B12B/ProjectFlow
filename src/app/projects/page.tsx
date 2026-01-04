import type { Project, Task } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore/lite';
import { db } from '@/lib/firebase-lite';
import { ProjectsClientPage } from './projects-client-page';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

async function getProjects(): Promise<Project[]> {
    try {
        const [projectSnapshot, taskSnapshot] = await Promise.all([
            getDocs(collection(db, 'projects')),
            getDocs(collection(db, 'tasks'))
        ]);

        const allTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const projectList = projectSnapshot.docs
            .map(doc => {
                const data = doc.data();
                const projectId = doc.id;
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
                    isDarkModeOnly: data.isDarkModeOnly || false,
                    customerId: data.customerId,
                    owner: data.owner,
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
    const osTeamPassword = process.env.OS_TEAM_PASSWORD; // This line might be vestigial if not used later

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
