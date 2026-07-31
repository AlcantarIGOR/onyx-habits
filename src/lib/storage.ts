export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: "good" | "bad"; // good = hábito positivo, bad = hábito a evitar
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

// Helper to normalize date to local YYYY-MM-DD
export function getLocalDateString(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}
