export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'วางแผน';
  team?: string;
  completedTasks: number;
  totalTasks: number;
  isDarkModeOnly?: boolean; // Added this field
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  startDate: string;
  endDate: string;
  Status: 'ยังไม่เริ่ม' | 'กำลังดำเนินการ' | 'ติดปัญหา' | 'จบงานแล้ว';
  effort?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: string;
}
