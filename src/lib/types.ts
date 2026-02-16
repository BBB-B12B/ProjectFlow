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
  category?: string;
  githubLink?: string; // Deprecated
  links?: { label: string; url: string; }[];
  inProgressTasks?: number;
  totalFiles?: number;
}

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
  // Social Media Fields
  lineId?: string;
  lineLink?: string;
  facebookName?: string;
  facebookLink?: string;
  whatsappNumber?: string;
  whatsappLink?: string;
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

export type TaskStatus = 'ยังไม่เริ่ม' | 'กำลังดำเนินการ' | 'ติดปัญหา' | 'จบงานแล้ว' | 'หยุดงาน' | 'ยังไม่ได้เริ่ม';

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string; // ISO String
  createdBy: {
    name: string;
    avatarUrl?: string;
  };
}

export interface Task {
  id: string;
  projectId: string;
  TaskName: string;
  Description?: string; // Added Description field matching Task.description
  Assignee?: string; // Changed Assignee to be a string directly
  StartDate: string;
  EndDate: string;
  Status: TaskStatus;
  Effort?: number;
  Effect?: number;
  Progress?: number;
  ProjectType?: 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';
  Category?: string;
  Owner?: string; // Represents "Customer Group" (e.g., SME, Enterprise), NOT a specific person.
  Want?: string;
  checklist?: ChecklistItem[];
  comments?: TaskComment[];
  Order?: number; // For manual sorting
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
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string; // ISO Date string
    exceptions?: string[]; // ISO Date strings of skipped instances
  };
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
  attachments?: string[]; // URLs of uploaded files
  editHistory?: {
    editedAt: string;
    editedBy: string;
    previousHours: number;
    previousProgress: number;
  }[];
}

export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';

// New interfaces for real-time presence (Lock System)
export interface Editor {
  userName: string;
  avatarUrl?: string; // Optional since it might not be available immediately
  userId?: string; // Adding userId if it's needed
  lastSeen?: any; // Firestore Timestamp
}

export interface Presence {
  editors?: Record<string, Editor>;
}

export interface AssigneeGroup {
  id: string;
  name: string;
  members: string[]; // List of user names
  projectId?: string; // Optional: Link to specific project if needed, or global
}

