export interface Task {
    id: string;
    TaskName: string;
    Status: string;
    Progress: number;
    Assignee: string;
    ProjectType: string;
    projectId: string;
    StartDate: string;
    EndDate: string;
    Effort: number;
    Effect: number;
    title?: string;
    effort?: number;
    effect?: number;
    priority?: string;
}
