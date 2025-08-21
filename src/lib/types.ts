export type TaskStatus = 'จบงานแล้ว' | 'กำลังดำเนินการ' | 'หยุดงาน' | 'ยังไม่ได้เริ่ม' | '';
export type ProjectType = 'Main' | 'QuickWin' | 'Fillin' | 'Thankless';

// Cleaned up Task interface
export interface Task {
    id: string;
    No: number;
    TaskName: string;
    StartDate: string;
    EndDate: string;
    Duration: number;
    Status: TaskStatus;
    LastUpdateDate: string;
    Assignee: string;
    Owner: string;
    User: string;
    Effect: number;
    Effort: number;
    ProjectName: string;
    projectId: string;
    Want: string;
    Category: string;
    ProjectType: ProjectType;
}

// Cleaned up Project interface for consistency
export interface Project {
    id: string;
    name: string; // Use camelCase for consistency
    description: string;
    startDate: string;
    endDate: string;
    status: 'จบงานแล้ว' | 'กำลังดำเนินการ'; // Use camelCase
}
