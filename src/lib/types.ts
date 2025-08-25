export type TaskStatus = 'จบงานแล้ว' | 'กำลังดำเนินการ' | 'หยุดงาน' | 'ยังไม่ได้เริ่ม' | '';
export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';

// A more streamlined Task interface based on actual usage in the app
export interface Task {
    id: string;
    TaskName: string;
    StartDate: string;
    EndDate: string;
    Status: TaskStatus;
    Assignee: string;
    Owner: string;
    Effect: number;
    Effort: number;
    projectId: string;
    Want: string;
    Category: string;
    ProjectType: ProjectType;
    Progress?: number; // Optional as older tasks might not have it
}

// A streamlined Project interface
export interface Project {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'จบงานแล้ว' | 'กำลังดำเนินการ' | 'Archived';
    completedTasks: number;
    totalTasks: number;
    team?: string; // Add optional team field
}

// Interface for the presence feature
export interface Presence {
    userId: string;
    userName: string;
    lastSeen: any; // Firestore ServerTimestamp
    avatarUrl?: string; // Add optional avatarUrl
}
