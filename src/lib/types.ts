export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'วางแผน' | 'Archived';
  team?: string;
  completedTasks: number;
  totalTasks: number;
  isDarkModeOnly?: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  TaskName?: string;
  Description?: string; // Added Description field matching Task.description
  Assignee?: {
    name: string;
    avatar?: string;
  };
  StartDate: string;
  EndDate: string;
  Status: 'ยังไม่เริ่ม' | 'กำลังดำเนินการ' | 'ติดปัญหา' | 'จบงานแล้ว';
  Effort?: number;
  Effect?: number;
  Progress?: number;
  ProjectType?: 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';
  Category?: string;
  Owner?: string;
  Want?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: string;
}

export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';
