export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  daysOfWeek: number[]; // 0 (Sun) to 6 (Sat)
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
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
    description: "Despertar a las 6:15 AM (Vacaciones) / 7:30 AM (Transición)",
    icon: "sunrise",
    color: "#A3E635",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Todos los días
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Pasear a Aika",
    description: "Caminata de 1 hora por la mañana con Aika",
    icon: "dog",
    color: "#38BDF8", // Celeste
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Meditación de Foco",
    description: "15 minutos de respiración para entrenar la concentración",
    icon: "brain",
    color: "#A78BFA", // Violeta
    daysOfWeek: [1, 2, 3, 4, 5], // Lun-Vie
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Bloque Foco Matutino",
    description: "Estudio sin distracciones ni celular (8:15 AM - 9:30 AM)",
    icon: "target",
    color: "#F43F5E", // Rojo/Rosa
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Curso POO (TEC)",
    description: "Asistir y participar activamente (10:30 AM - 1:30 PM)",
    icon: "school",
    color: "#F59E0B", // Ámbar
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Deep Work (Flow State)",
    description: "Programar MoodleSync / ONYX sin celular (3:30 PM - 8:00 PM)",
    icon: "zap",
    color: "#2563EB", // Azul
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Equilibrio Personal",
    description: "Guitarra, ajedrez, lectura o meditación (8:00 PM - 10:00 PM)",
    icon: "guitar",
    color: "#10B981", // Esmeralda
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Desconexión Digital",
    description: "Apagar pantallas y alejar teléfono (10:30 PM / 11:00 PM)",
    icon: "moon",
    color: "#EC4899", // Rosa
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
  }
};
