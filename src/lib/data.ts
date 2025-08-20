import type { Project, Task } from './types';

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the main company website.',
  },
  {
    id: 'proj-2',
    name: 'Mobile App Launch',
    description: 'Develop and launch the new iOS and Android mobile applications.',
  },
  {
    id: 'proj-3',
    name: 'Q3 Marketing Campaign',
    description: 'Plan and execute the marketing campaign for the third quarter.',
  },
  {
    id: 'proj-4',
    name: 'API Integration',
    description: 'Integrate third-party APIs for enhanced functionality.',
  },
];

export const tasks: Task[] = [
  // Tasks for Website Redesign (proj-1)
  {
    id: 'task-1',
    title: 'Design new homepage mockups',
    status: 'Done',
    priority: 'High',
    dueDate: '2024-08-15',
    effort: 4,
    effect: 5,
    projectId: 'proj-1',
  },
  {
    id: 'task-2',
    title: 'Develop front-end components',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2024-09-01',
    effort: 5,
    effect: 5,
    projectId: 'proj-1',
  },
  {
    id: 'task-3',
    title: 'Setup CMS for the blog section',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2024-09-10',
    effort: 3,
    effect: 4,
    projectId: 'proj-1',
  },
    {
    id: 'task-11',
    title: 'User testing for new design',
    status: 'To Do',
    priority: 'Low',
    dueDate: '2024-09-20',
    effort: 3,
    effect: 5,
    projectId: 'proj-1',
  },


  // Tasks for Mobile App Launch (proj-2)
  {
    id: 'task-4',
    title: 'Finalize app UI/UX',
    status: 'Done',
    priority: 'High',
    dueDate: '2024-08-10',
    effort: 4,
    effect: 5,
    projectId: 'proj-2',
  },
  {
    id: 'task-5',
    title: 'Build user authentication flow',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2024-08-25',
    effort: 4,
    effect: 5,
    projectId: 'proj-2',
  },
  {
    id: 'task-6',
    title: 'Implement push notifications',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2024-09-05',
    effort: 2,
    effect: 4,
    projectId: 'proj-2',
  },
    {
    id: 'task-12',
    title: 'Prepare App Store submission',
    status: 'To Do',
    priority: 'High',
    dueDate: '2024-09-25',
    effort: 2,
    effect: 5,
    projectId: 'proj-2',
  },


  // Tasks for Q3 Marketing Campaign (proj-3)
  {
    id: 'task-7',
    title: 'Define campaign KPIs',
    status: 'Done',
    priority: 'High',
    dueDate: '2024-08-01',
    effort: 1,
    effect: 4,
    projectId: 'proj-3',
  },
  {
    id: 'task-8',
    title: 'Create social media content calendar',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: '2024-08-20',
    effort: 3,
    effect: 3,
    projectId: 'proj-3',
  },
   {
    id: 'task-9',
    title: 'Launch email marketing sequence',
    status: 'To Do',
    priority: 'High',
    dueDate: '2024-09-01',
    effort: 2,
    effect: 4,
    projectId: 'proj-3',
  },

  // Task for API Integration (proj-4)
  {
    id: 'task-10',
    title: 'Research payment gateway APIs',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2024-08-18',
    effort: 2,
    effect: 5,
    projectId: 'proj-4',
  },
];
