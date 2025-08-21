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
