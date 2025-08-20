export type Project = {
  id: string;
  name: string;
  description: string;
};

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  effort: number; // 1-5 scale
  effect: number; // 1-5 scale
  projectId: string;
};
