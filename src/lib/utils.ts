// /home/user/studio/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChartConfig } from "@/components/ui/chart"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

// ======== Name Normalization Functions ========

export function normalizeAssigneeName(name: string): string {
  return name.trim().toLowerCase();
}

export function formatAssigneeDisplayName(name: string): string {
  return name.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeAssigneeList(assigneeString: string): string[] {
  if (!assigneeString) return [];
  
  return assigneeString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(normalizeAssigneeName);
}

export function formatAssigneeList(assigneeArray: string[]): string {
  return assigneeArray
    .map(formatAssigneeDisplayName)
    .join(', ');
}

// สำหรับลบข้อมูลซ้ำและจัดรูปแบบ
export function deduplicateAssignees(assigneeString: string): string {
  const normalized = normalizeAssigneeList(assigneeString);
  const unique = [...new Set(normalized)];
  return formatAssigneeList(unique);
}