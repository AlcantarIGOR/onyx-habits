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

const DEFAULT_HABITS: Habit[] = [
  {
    id: "1",
    name: "Despertar temprano",
    description: "Levantarse temprano para empezar bien el día",
    icon: "sunrise",
    color: "#A3E635",
    type: "good",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Pasear a Aika",
    description: "Caminata de 1 hora por la mañana con Aika",
    icon: "dog",
    color: "#38BDF8",
    type: "good",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Tomar 2L de agua",
    description: "Beber al menos 2 litros de agua durante el día",
    icon: "brain",
    color: "#38BDF8",
    type: "good",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Meditación",
    description: "15 minutos de respiración y enfoque",
    icon: "brain",
    color: "#A78BFA",
    type: "good",
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "No fumar hoy",
    description: "Mantenerme libre de humo todo el día",
    icon: "target",
    color: "#F43F5E",
    type: "bad",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: new Date().toISOString(),
  },
];

// Helper to normalize date to local YYYY-MM-DD
export function getLocalDateString(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const storage = {
  getHabits(): Habit[] {
    return getStorageItem<Habit[]>("onyx_habits", DEFAULT_HABITS);
  },

  saveHabit(habit: Omit<Habit, "id" | "createdAt"> & { id?: string }): Habit {
    const habits = this.getHabits();
    const isNew = !habit.id;
    const newHabit: Habit = {
      id: habit.id || Math.random().toString(36).substring(2, 9),
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      type: habit.type || "good",
      daysOfWeek: habit.daysOfWeek,
      createdAt: isNew ? new Date().toISOString() : (habits.find(h => h.id === habit.id)?.createdAt || new Date().toISOString()),
    };

    if (isNew) {
      habits.push(newHabit);
    } else {
      const idx = habits.findIndex(h => h.id === habit.id);
      if (idx !== -1) habits[idx] = newHabit;
    }

    setStorageItem("onyx_habits", habits);
    return newHabit;
  },

  deleteHabit(id: string): void {
    const habits = this.getHabits().filter(h => h.id !== id);
    setStorageItem("onyx_habits", habits);
    
    // Also delete logs associated
    const logs = this.getLogs().filter(l => l.habitId !== id);
    setStorageItem("onyx_habit_logs", logs);
  },

  getLogs(): HabitLog[] {
    return getStorageItem<HabitLog[]>("onyx_habit_logs", []);
  },

  toggleHabitLog(habitId: string, date: string): HabitLog {
    const logs = this.getLogs();
    const existingIdx = logs.findIndex(l => l.habitId === habitId && l.date === date);

    if (existingIdx !== -1) {
      // Toggle
      logs[existingIdx].completed = !logs[existingIdx].completed;
      setStorageItem("onyx_habit_logs", logs);
      return logs[existingIdx];
    } else {
      // Create new
      const newLog: HabitLog = {
        id: Math.random().toString(36).substring(2, 9),
        habitId,
        date,
        completed: true,
      };
      logs.push(newLog);
      setStorageItem("onyx_habit_logs", logs);
      return newLog;
    }
  },

  getReflections(): DailyReflection[] {
    return getStorageItem<DailyReflection[]>("onyx_reflections", []);
  },

  getReflectionForDate(date: string): DailyReflection | null {
    const reflections = this.getReflections();
    return reflections.find(r => r.date === date) || null;
  },

  saveReflection(reflection: Omit<DailyReflection, "id"> & { id?: string }): DailyReflection {
    const reflections = this.getReflections();
    const existingIdx = reflections.findIndex(r => r.date === reflection.date);

    const newReflection: DailyReflection = {
      id: reflection.id || (existingIdx !== -1 ? reflections[existingIdx].id : Math.random().toString(36).substring(2, 9)),
      date: reflection.date,
      flowRating: reflection.flowRating,
      victory: reflection.victory,
      lesson: reflection.lesson,
      notes: reflection.notes,
    };

    if (existingIdx !== -1) {
      reflections[existingIdx] = newReflection;
    } else {
      reflections.push(newReflection);
    }

    setStorageItem("onyx_reflections", reflections);
    return newReflection;
  },

  getStats() {
    const habits = this.getHabits();
    const logs = this.getLogs().filter(l => l.completed);
    
    // Calculate current streak of days where at least 50% of active habits were completed
    const activeHabitsCountByDay = (date: Date) => {
      const dayOfWeek = date.getDay(); // 0-6
      return habits.filter(h => h.daysOfWeek.includes(dayOfWeek)).length;
    };

    const completedHabitsCountByDay = (dateStr: string) => {
      return logs.filter(l => l.date === dateStr).length;
    };

    // Simple streak calculator
    let streak = 0;
    let tempDate = new Date();
    
    // We check backwards starting today
    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDateString(tempDate);
      const activeCount = activeHabitsCountByDay(tempDate);
      const completedCount = completedHabitsCountByDay(dateStr);
      
      if (activeCount === 0) {
        // Weekend or day with no habits: skip without breaking streak
        tempDate.setDate(tempDate.getDate() - 1);
        continue;
      }

      const ratio = completedCount / activeCount;
      if (ratio >= 0.5) {
        streak++;
      } else {
        // If it's today and he hasn't completed 50% yet, don't break the streak immediately
        if (i === 0) {
          // Just skip today, check yesterday
          tempDate.setDate(tempDate.getDate() - 1);
          continue;
        }
        break;
      }
      tempDate.setDate(tempDate.getDate() - 1);
    }

    // Overall completion rate
    const totalPossible = habits.length * 30; // Last 30 days
    // Count active logs in last 30 days
    let completedInLast30Days = 0;
    let activeInLast30Days = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const dateStr = getLocalDateString(checkDate);
      activeInLast30Days += activeHabitsCountByDay(checkDate);
      completedInLast30Days += logs.filter(l => l.date === dateStr).length;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const completionRate = activeInLast30Days > 0 ? Math.round((completedInLast30Days / activeInLast30Days) * 100) : 0;

    return {
      streak,
      completionRate,
      totalHabits: habits.length,
    };
  },

  // ==================== TASKS ====================
  getTasks(date?: string): Task[] {
    const tasks = getStorageItem<Task[]>("personal_tasks", []);
    if (date) return tasks.filter(t => t.date === date);
    return tasks;
  },

  saveTask(task: Omit<Task, "id" | "createdAt"> & { id?: string }): Task {
    const tasks = this.getTasks();
    const isNew = !task.id;
    const newTask: Task = {
      id: task.id || Math.random().toString(36).substring(2, 9),
      text: task.text,
      completed: task.completed,
      priority: task.priority,
      date: task.date,
      createdAt: isNew ? new Date().toISOString() : (tasks.find(t => t.id === task.id)?.createdAt || new Date().toISOString()),
    };

    if (isNew) {
      tasks.push(newTask);
    } else {
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) tasks[idx] = newTask;
    }

    setStorageItem("personal_tasks", tasks);
    return newTask;
  },

  toggleTask(id: string): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx].completed = !tasks[idx].completed;
      setStorageItem("personal_tasks", tasks);
    }
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    setStorageItem("personal_tasks", tasks);
  },

  // ==================== STICKY NOTES ====================
  getStickyNotes(): StickyNote[] {
    return getStorageItem<StickyNote[]>("personal_stickynotes", [
      {
        id: "default_1",
        content: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
        color: "#A78BFA",
        createdAt: new Date().toISOString(),
      },
      {
        id: "default_2",
        content: "No cuentes los días, haz que los días cuenten. 💪",
        color: "#38BDF8",
        createdAt: new Date().toISOString(),
      },
    ]);
  },

  saveStickyNote(note: Omit<StickyNote, "id" | "createdAt"> & { id?: string }): StickyNote {
    const notes = this.getStickyNotes();
    const isNew = !note.id;
    const newNote: StickyNote = {
      id: note.id || Math.random().toString(36).substring(2, 9),
      content: note.content,
      color: note.color,
      createdAt: isNew ? new Date().toISOString() : (notes.find(n => n.id === note.id)?.createdAt || new Date().toISOString()),
    };

    if (isNew) {
      notes.push(newNote);
    } else {
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx !== -1) notes[idx] = newNote;
    }

    setStorageItem("personal_stickynotes", notes);
    return newNote;
  },

  deleteStickyNote(id: string): void {
    const notes = this.getStickyNotes().filter(n => n.id !== id);
    setStorageItem("personal_stickynotes", notes);
  },
};
