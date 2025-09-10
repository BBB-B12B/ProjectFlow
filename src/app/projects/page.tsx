import type { Project, Task } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectsClientPage } from './projects-client-page';
import { redirect } from 'next/navigation';

async function getProjects(): Promise<{ projects: Project[], projectNamesMap: Record<string, string> }> {
    try {
        const [projectSnapshot, taskSnapshot] = await Promise.all([
            getDocs(collection(db, 'projects')),
            getDocs(collection(db, 'tasks'))
        ]);

        const allTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        const projectNamesMap: Record<string, string> = {};

        const projectList = projectSnapshot.docs
            .map(doc => {
                const data = doc.data();
                const projectId = doc.id;
                const projectName = data.name || data.ProjectName;
                projectNamesMap[projectId] = projectName;

                const tasksForProject = allTasks.filter(task => task.projectId === projectId);
                const completedTasks = tasksForProject.filter(task => task.Status === 'จบงานแล้ว').length;
                const totalTasks = tasksForProject.length;

                return {
                    id: projectId,
                    name: projectName,
                    description: data.description,
                    startDate: data.startDate || data.StartDate,
                    endDate: data.endDate || data.EndDate,
                    status: data.status || 'กำลังดำเนินการ',
                    team: data.team,
                    completedTasks,
                    totalTasks,
                    isDarkModeOnly: data.isDarkModeOnly || false, 
                } as Project;
            })
            .filter(project => project.status !== 'Archived');

        return { projects: projectList, projectNamesMap };

    } catch (error) {
        console.error("Error fetching projects and tasks:", error);
        return { projects: [], projectNamesMap: {} };
    }
}

export default async function ProjectsPage() {
    const { projects, projectNamesMap } = await getProjects();
    const osTeamPassword = process.env.OS_TEAM_PASSWORD; // This line might be vestigial if not used later
    
    console.log("ProjectsPage - projectNamesMap before passing to client:", projectNamesMap); // ADDED: Log here

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

    return <ProjectsClientPage projects={projects} projectNamesMap={projectNamesMap} />;
}