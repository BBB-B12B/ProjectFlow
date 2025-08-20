export type TaskStatus = 'จบงานแล้ว' | 'กำลังดำเนินการ' | 'หยุดงาน' | '';
export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';

export interface Task {
  id: string;
  No: number;
  ProjectName: string;
  Category: string;
  TaskName: string;
  Assignee: string;
  StartDate: string;
  EndDate: string;
  Duration: number;
  Status: TaskStatus;
  Owner: string;
  ProjectType: ProjectType;
  User: string;
  Want: string;
  LastUpdateDate: string;
  dependencies?: string[];
  Effect?: number;
  Effort?: number;
  // Kept for compatibility with existing components that might be migrated.
  title?: string; // Will be mapped from TaskName
  status?: TaskStatus; // Mapped from Status
  priority?: 'Low' | 'Medium' | 'High'; // This will be removed or mapped.
  dueDate?: string; // Mapped from EndDate
  effort?: number; // Mapped from Effort
  effect?: number; // Mapped from Effect
  projectId?: string; // Mapped from ProjectName
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  No: number;
  ProjectName: string;
  StartDate: string;
  EndDate: string;
  Duration: number;
  CompletedCount: number;
  PendingCount: number;
  Status: 'จบงานแล้ว' | 'กำลังดำเนินการ';
}
