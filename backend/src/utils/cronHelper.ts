import type { ScheduleFrequency } from "../types";

export function frequencyToCron(frequency: ScheduleFrequency): string {
  const map: Record<ScheduleFrequency, string> = {
    hourly:  "0 * * * *",
    daily:   "0 0 * * *",
    weekly:  "0 0 * * 0",
    monthly: "0 0 1 * *",
  };
  return map[frequency];
}

export function getNextRunTime(cronExpression: string): Date {
  const now  = new Date();
  const next = new Date(now);

  if (cronExpression === "0 * * * *") {
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
  } else if (cronExpression === "0 0 * * *") {
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + 1);
  } else if (cronExpression === "0 0 * * 0") {
    next.setHours(0, 0, 0, 0);
    const daysUntilSunday = 7 - next.getDay();
    next.setDate(next.getDate() + daysUntilSunday);
  } else if (cronExpression === "0 0 1 * *") {
    next.setHours(0, 0, 0, 0);
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
  }

  return next;
}

export function cronToLabel(cronExpression: string): string {
  const map: Record<string, string> = {
    "0 * * * *": "Every hour",
    "0 0 * * *": "Daily at midnight",
    "0 0 * * 0": "Weekly on Sunday",
    "0 0 1 * *": "Monthly on 1st",
  };
  return map[cronExpression] ?? cronExpression;
}