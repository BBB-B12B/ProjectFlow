import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Project, Task } from './types';

// Use a type helper for the seed data to ensure it matches the Project interface
type SeedProject = Omit<Project, 'id'>;
type SeedTask = Omit<Task, 'id'>;

const projects: SeedProject[] = [
]

const tasks: SeedTask[] = [
    {
        Category: 'Design',
        TaskName: 'Design new homepage mockups',
        Assignee: 'Alice',
        StartDate: '2024-08-01',
        EndDate: '2024-08-15',
        Status: 'จบงานแล้ว',
        Owner: 'Project Manager',
        ProjectType: 'Main',
        Want: 'High-fidelity mockups in Figma',
        Effect: 5,
        Effort: 5,
        Progress: 100,
        projectId: 'proj-1',
    },
    {
        Category: 'Development',
        TaskName: 'Develop front-end components',
        Assignee: 'Bob',
        StartDate: '2024-08-16',
        EndDate: '2024-09-01',
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'Main',
        Want: 'Reusable components in React',
        Effect: 5,
        Effort: 4,
        Progress: 75,
        projectId: 'proj-1',
    },
    {
        Category: 'Development',
        TaskName: 'Setup CMS for the blog section',
        Assignee: 'Charlie',
        StartDate: '2024-09-02',
        EndDate: '2024-09-10',
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'Fillin',
        Want: 'Headless CMS integration',
        Effect: 4,
        Effort: 3,
        Progress: 50,
        projectId: 'proj-1',
    },
    {
        Category: 'QA',
        TaskName: 'User testing for new design',
        Assignee: 'Diana',
        StartDate: '2024-09-11',
        EndDate: '2024-09-20',
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'QuickWin',
        Want: 'Usability feedback report',
        Effect: 5,
        Effort: 3,
        Progress: 20,
        projectId: 'proj-1',
    },
    // Tasks for Mobile App Launch (proj-2)
    {
        Category: 'Planning',
        TaskName: 'Finalize app features',
        Assignee: 'Alice',
        StartDate: '2024-08-10',
        EndDate: '2024-08-18',
        Status: 'จบงานแล้ว',
        Owner: 'Product Owner',
        ProjectType: 'Main',
        Want: 'A clear list of MVP features',
        Effect: 5,
        Effort: 3,
        Progress: 100,
        projectId: 'proj-2',
    },
    {
        Category: 'Development',
        TaskName: 'Build user authentication flow',
        Assignee: 'Bob, Peggy',
        StartDate: '2024-08-19',
        EndDate: '2024-08-30',
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'Main',
        Want: 'Secure login and registration',
        Effect: 5,
        Effort: 4,
        Progress: 60,
        projectId: 'proj-2',
    },
    {
        Category: 'Marketing',
        TaskName: 'Prepare App Store submission',
        Assignee: 'Eve',
        StartDate: '2024-09-15',
        EndDate: '2024-09-25',
        Status: 'ยังไม่ได้เริ่ม',
        Owner: 'Marketing Head',
        ProjectType: 'QuickWin',
        Want: 'App Store Connect and Google Play Console setup',
        Effect: 4,
        Effort: 3,
        Progress: 0,
        projectId: 'proj-2',
    },
];

export async function seedDatabase() {
  const batch = writeBatch(db);

  projects.forEach((project, index) => {
    const projectId = `proj-${index + 1}`;
    const projectRef = doc(db, 'projects', projectId);
    // Ensure project data matches the new streamlined Project interface
    const projectData = {
        ProjectName: project.name,
        description: project.description,
        StartDate: project.startDate,
        EndDate: project.endDate,
        status: project.status,
    };
    batch.set(projectRef, projectData);
  });

  tasks.forEach(task => {
    const taskRef = doc(collection(db, 'tasks'));
    batch.set(taskRef, task);
  });

  await batch.commit();
}
