export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: "fundamental" | "maintenance" | "growth" | "good" | "bad";
  daysOfWeek: number[]; // 0 (Sun) to 6 (Sat)
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  date: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string | null;
}

export interface StickyNote {
  id: string;
  content: string;
  color: string; // hex color for accent
  createdAt: string;
}

export interface DailyReflection {
  id: string;
  date: string; // YYYY-MM-DD
  flowRating: number; // 1-5
  victory: string;
  lesson: string;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  color: string;
  createdAt: string;
}

export interface SobrietyCounter {
  id: string;
  name: string;
  icon: string;
  lastResetDate: string; // YYYY-MM-DD
  targetDate: string;    // YYYY-MM-DD
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  location?: string;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  color: string;
  category: "class" | "routine" | "personal" | "study";
  daysOfWeek: number[];   // 0=Sun..6=Sat for recurring
  specificDate?: string;  // YYYY-MM-DD for one-off
  createdAt: string;
}

// Helper to normalize date to local YYYY-MM-DD (Mexico City Timezone)
export function getLocalDateString(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  }
}

export function getLocalDayOfWeek(date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      weekday: "short",
    });
    const dayName = formatter.format(date);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[dayName] ?? date.getDay();
  } catch {
    return date.getDay();
  }
}
