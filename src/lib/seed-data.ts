import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Project, Task } from './types';

// Use a type helper for the seed data to ensure it matches the Project interface
type SeedProject = Omit<Project, 'id'>;
type SeedTask = Omit<Task, 'id'>;

const projects: SeedProject[] = [
    {
        name: 'Website Redesign',
        description: 'A complete overhaul of the company website.',
        startDate: '2024-08-01',
        endDate: '2024-09-30',
        status: 'กำลังดำเนินการ',
    },
    {
        name: 'Mobile App Launch',
        description: 'Launch of the new mobile application for iOS and Android.',
        startDate: '2024-08-10',
        endDate: '2024-10-15',
        status: 'กำลังดำเนินการ',
    }
];

const tasks: SeedTask[] = [
    {
        No: 1,
        ProjectName: 'Website Redesign',
        Category: 'Design',
        TaskName: 'Design new homepage mockups',
        Assignee: 'Alice',
        StartDate: '2024-08-01',
        EndDate: '2024-08-15',
        Duration: 15,
        Status: 'จบงานแล้ว',
        Owner: 'Project Manager',
        ProjectType: 'Main',
        User: 'Design Team',
        Want: 'High-fidelity mockups in Figma',
        LastUpdateDate: '2024-08-20',
        Effect: 5,
        Effort: 5,
        projectId: 'proj-1',
    },
    {
        No: 2,
        ProjectName: 'Website Redesign',
        Category: 'Development',
        TaskName: 'Develop front-end components',
        Assignee: 'Bob',
        StartDate: '2024-08-16',
        EndDate: '2024-09-01',
        Duration: 17,
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'Main',
        User: 'Dev Team',
        Want: 'Reusable components in React',
        LastUpdateDate: '2024-08-20',
        Effect: 5,
        Effort: 4,
        projectId: 'proj-1',
    },
    {
        No: 3,
        ProjectName: 'Website Redesign',
        Category: 'Development',
        TaskName: 'Setup CMS for the blog section',
        Assignee: 'Charlie',
        StartDate: '2024-09-02',
        EndDate: '2024-09-10',
        Duration: 9,
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'Fillin',
        User: 'Dev Team',
        Want: 'Headless CMS integration',
        LastUpdateDate: '2024-08-20',
        Effect: 4,
        Effort: 3,
        projectId: 'proj-1',
    },
    {
        No: 11,
        ProjectName: 'Website Redesign',
        Category: 'QA',
        TaskName: 'User testing for new design',
        Assignee: 'Diana',
        StartDate: '2024-09-11',
        EndDate: '2024-09-20',
        Duration: 10,
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'QuickWin',
        User: 'QA Team',
        Want: 'Usability feedback report',
        LastUpdateDate: '2024-08-20',
        Effect: 5,
        Effort: 3,
        projectId: 'proj-1',
    },
    // Tasks for Mobile App Launch (proj-2)
    {
        No: 4,
        ProjectName: 'Mobile App Launch',
        Category: 'Planning',
        TaskName: 'Finalize app features',
        Assignee: 'Alice',
        StartDate: '2024-08-10',
        EndDate: '2024-08-18',
        Duration: 9,
        Status: 'จบงานแล้ว',
        Owner: 'Product Owner',
        ProjectType: 'Main',
        User: 'Product Team',
        Want: 'A clear list of MVP features',
        LastUpdateDate: '2024-08-20',
        Effect: 5,
        Effort: 3,
        projectId: 'proj-2',
    },
    {
        No: 5,
        ProjectName: 'Mobile App Launch',
        Category: 'Development',
        TaskName: 'Build user authentication flow',
        Assignee: 'Bob, Peggy',
        StartDate: '2024-08-19',
        EndDate: '2024-08-30',
        Duration: 12,
        Status: 'กำลังดำเนินการ',
        Owner: 'Project Manager',
        ProjectType: 'Main',
        User: 'Dev Team',
        Want: 'Secure login and registration',
        LastUpdateDate: '2024-08-20',
        Effect: 5,
        Effort: 4,
        projectId: 'proj-2',
    },
    {
        No: 6,
        ProjectName: 'Mobile App Launch',
        Category: 'Marketing',
        TaskName: 'Prepare App Store submission',
        Assignee: 'Eve',
        StartDate: '2024-09-15',
        EndDate: '2024-09-25',
        Duration: 11,
        Status: 'ยังไม่ได้เริ่ม',
        Owner: 'Marketing Head',
        ProjectType: 'QuickWin',
        User: 'Marketing Team',
        Want: 'App Store Connect and Google Play Console setup',
        LastUpdateDate: '2024-08-20',
        Effect: 4,
        Effort: 3,
        projectId: 'proj-2',
    },
];

export async function seedDatabase() {
  const batch = writeBatch(db);

  // Seed Projects with consistent field names
  projects.forEach((project, index) => {
    const projectId = `proj-${index + 1}`;
    const projectRef = doc(db, 'projects', projectId);
    batch.set(projectRef, project);
  });

  // Seed Tasks
  tasks.forEach(task => {
    const taskRef = doc(collection(db, 'tasks'));
    batch.set(taskRef, task);
  });

  await batch.commit();
}
