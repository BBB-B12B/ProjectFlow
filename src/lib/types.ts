export type TaskStatus = 'จบงานแล้ว' | 'กำลังดำเนินการ' | 'หยุดงาน' | 'ยังไม่ได้เริ่ม' | '';
export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';

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
    Progress?: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'จบงานแล้ว' | 'กำลังดำเนินการ' | 'Archived';
    completedTasks: number;
    totalTasks: number;
    team?: string;
}

// --- (1) UPDATE THE PRESENCE TYPE ---
// This now represents a single editor.
export interface Editor {
    userId: string;
    userName: string;
    lastSeen: any;
    avatarUrl?: string;
}

// A Presence document now contains a map of editors.
export interface Presence {
    editors: { [userId: string]: Editor };
}
