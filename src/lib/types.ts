export interface Project {
  id: string;
  customerId?: string; // Link to Customer
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'วางแผน' | 'Archived';
  team?: string;
  owner?: string;
  completedTasks: number;
  totalTasks: number;
  isDarkModeOnly?: boolean;
}

// ... existing Task interface ...

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  businessType?: string;
  tags?: string[]; // VIP, Prospect, etc.
  status?: 'Lead' | 'Active' | 'Churn' | 'Inactive';
  lastContactDate?: string; // ISO Date
  healthScore?: number; // 0-100 calculated from ratings
  createdAt?: string;
  updatedAt?: string;
  isDarkModeOnly?: boolean; // True if this customer belongs to OS (Dark Mode)
  totalProjects?: number;
  completedProjects?: number;
}

export interface CustomerRating {
  id: string;
  customerId: string;
  raterId: string; // User ID
  payer: number; // 0-10
  visioner: number; // 0-10
  harder: number; // 0-10
  niceGuy: number; // 0-10
  comment?: string;
  updatedAt: string;
}

export interface CustomerActivityLog {
  id: string;
  customerId: string;
  type: 'Call' | 'Meeting' | 'Email' | 'Note' | 'Event' | 'TaskUpdate';
  description: string;
  date: string; // ISO Date
  relatedId?: string; // ID of the related CalendarEvent or Task
  performedBy?: string; // User who performed the action
}

export interface Task {
  id: string;
  projectId: string;
  TaskName: string;
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
  Owner?: string; // Represents "Customer Group" (e.g., SME, Enterprise), NOT a specific person.
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
  relatedCustomerIds?: string[]; // Added: Link events to multiple customers
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
