// /home/user/studio/src/lib/types.ts
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
  Assignee?: string; // Changed Assignee to be a string directly
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
  relatedTask?: {
    id: string;
    name: string;
    projectId: string;
  };
  isDarkModeOnly?: boolean;
}

export interface ProjectTrackingProgress {
  id: string;
  taskId: string;
  projectId: string;
  trackerName: string;
  date: string; // วันที่ลงข้อมูล
  hoursWorked: number;
  progressPercentage: number;
  createdAt: string; // วันที่สร้างข้อมูล
  updatedAt: string; // วันที่แก้ไขล่าสุด
  editHistory?: {
    editedAt: string;
    editedBy: string;
    previousHours: number;
    previousProgress: number;
  }[];
}

export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';

// New interfaces for real-time presence
export interface Editor {
  userName: string;
  avatarUrl?: string;
  lastSeen: any; // Firebase Timestamp
}

export interface Presence {
  editors: {
    [userId: string]: Editor;
  };
}
