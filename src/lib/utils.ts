import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TaskWithStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Parse date strings from API responses back to Date objects
 */
export function parseDateString(value: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse tasks from API response, converting date strings to Date objects
 */
export function parseTasksFromAPI(tasks: any[]): TaskWithStatus[] {
  return tasks.map(task => ({
    ...task,
    planned_start: parseDateString(task.planned_start),
    planned_finish: parseDateString(task.planned_finish),
    actual_start: parseDateString(task.actual_start),
    actual_finish: parseDateString(task.actual_finish),
    last_updated: parseDateString(task.last_updated),
  }));
}
