"use client";

import React, { useState, useEffect } from "react";
import {
  Habit,
  HabitLog,
  Task,
  getLocalDateString,
} from "@/lib/storage";
import {
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Sunrise,
  Dog,
  Brain,
  Target,
  School,
  Music,
  Moon,
  Award,
  Zap,
  ListTodo,
  Heart,
  Timer,
  StickyNote as StickyIcon,
  Flame,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PomodoroTimer from "@/components/PomodoroTimer";
import { StickyNotes } from "@/components/StickyNotes";

// ─── Icon Mapper ─────────────────────────────────────────────────
const IconMapper = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    sunrise: Sunrise, dog: Dog, brain: Brain, target: Target,
    school: School, zap: Zap, guitar: Music, moon: Moon, chess: Award,
  };
  const IconComponent = icons[name] || CheckCircle2;
  return <IconComponent className={className} />;
};

// ─── Priority config ─────────────────────────────────────────────
const PRIORITY_CONFIG = {
  high:   { label: "Alta",  dot: "bg-accent-rose",  sort: 0 },
  medium: { label: "Media", dot: "bg-accent-amber", sort: 1 },
  low:    { label: "Baja",  dot: "bg-text-muted/40",    sort: 2 },
} as const;

type TabKey = "tasks" | "habits" | "focus" | "notes";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "tasks",  label: "Tareas",  icon: ListTodo },
  { key: "habits", label: "Hábitos", icon: Heart },
  { key: "focus",  label: "Enfoque", icon: Timer },
  { key: "notes",  label: "Notas",   icon: StickyIcon },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");

  // Data State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayStr, setTodayStr] = useState("");
  const [loading, setLoading] = useState(true);

  // Form State
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");

  const loadData = async (dateStr: string) => {
    setLoading(true);
    try {
      const [tasksRes, habitsRes, logsRes] = await Promise.all([
        fetch(`/api/tasks?date=${dateStr}`),
        fetch("/api/habits"),
        fetch("/api/habits/logs"),
      ]);

      if (tasksRes.ok && habitsRes.ok && logsRes.ok) {
        const tasksData = await tasksRes.json();
        const habitsData = await habitsRes.json();
        const logsData = await logsRes.json();
        setTasks(tasksData);
        setHabits(habitsData);
        setLogs(logsData);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const dateStr = getLocalDateString();
    setTodayStr(dateStr);
    loadData(dateStr);
  }, []);

  if (!mounted) return null;

  // ── Stats calculation ──────────────────────────────────────────
  const calculateStats = () => {
    const activeHabitsCountByDay = (date: Date) => {
      const dayOfWeek = date.getDay();
      return habits.filter((h) => h.daysOfWeek.includes(dayOfWeek)).length;
    };

    const completedHabitsCountByDay = (dateStr: string) => {
      return logs.filter((l) => l.date === dateStr && l.completed).length;
    };

    let streak = 0;
    let tempDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDateString(tempDate);
      const activeCount = activeHabitsCountByDay(tempDate);
      const completedCount = completedHabitsCountByDay(dateStr);

      if (activeCount === 0) {
        tempDate.setDate(tempDate.getDate() - 1);
        continue;
      }

      const ratio = completedCount / activeCount;
      if (ratio >= 0.5) {
        streak++;
      } else {
        if (i === 0) {
          tempDate.setDate(tempDate.getDate() - 1);
          continue;
        }
        break;
      }
      tempDate.setDate(tempDate.getDate() - 1);
    }

    let completedInLast30Days = 0;
    let activeInLast30Days = 0;
    let checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateStr = getLocalDateString(checkDate);
      activeInLast30Days += activeHabitsCountByDay(checkDate);
      completedInLast30Days += logs.filter((l) => l.date === dateStr && l.completed).length;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const completionRate =
      activeInLast30Days > 0
        ? Math.round((completedInLast30Days / activeInLast30Days) * 100)
        : 0;

    return { streak, completionRate };
  };

  const { streak, completionRate } = calculateStats();

  // ── Habits Logic ───────────────────────────────────────────────
  const todayDayOfWeek = new Date().getDay();
  const activeHabitsToday = habits.filter((h) => h.daysOfWeek.includes(todayDayOfWeek));
  const goodHabits = activeHabitsToday.filter((h) => h.type !== "bad");
  const badHabits = activeHabitsToday.filter((h) => h.type === "bad");

  const isCompletedToday = (habitId: string) =>
    logs.some((l) => l.habitId === habitId && l.date === todayStr && l.completed);

  const handleToggleHabit = async (habitId: string) => {
    // Optimistic UI toggle
    setLogs((prev) => {
      const exists = prev.some((l) => l.habitId === habitId && l.date === todayStr);
      if (exists) {
        return prev.map((l) =>
          l.habitId === habitId && l.date === todayStr
            ? { ...l, completed: !l.completed }
            : l
        );
      } else {
        return [...prev, { id: "temp", habitId, date: todayStr, completed: true }];
      }
    });

    try {
      await fetch("/api/habits/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: todayStr }),
      });
      // reload logs to get correct IDs
      const res = await fetch("/api/habits/logs");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const completedHabits = activeHabitsToday.filter((h) => isCompletedToday(h.id)).length;
  const progressPercent =
    activeHabitsToday.length > 0
      ? Math.round((completedHabits / activeHabitsToday.length) * 100)
      : 0;

  // ── Tasks Logic ────────────────────────────────────────────────
  const sortedTasks = [...tasks].sort(
    (a, b) => PRIORITY_CONFIG[a.priority].sort - PRIORITY_CONFIG[b.priority].sort
  );

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    // Optimistic add
    const tempTask: Task = {
      id: "temp",
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      date: todayStr,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, tempTask]);
    setNewTaskText("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: tempTask.text,
          completed: false,
          priority: newTaskPriority,
          date: todayStr,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === "temp" ? saved : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          text: task.text,
          completed: !task.completed,
          priority: task.priority,
          date: todayStr,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const completedTasks = tasks.filter((t) => t.completed).length;

  // ── Greeting Header ────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const dateFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Greeting & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {greeting}
          </h2>
          <p className="text-sm text-text-muted capitalize">{dateFormatted}</p>
        </div>

        {/* Stats Summary */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Flame className="w-4 h-4 text-primary" />
            <span>Racha: <strong className="text-foreground">{streak}d</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <TrendingUp className="w-4 h-4 text-accent-green" />
            <span>Mes: <strong className="text-foreground">{completionRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-4 sm:flex gap-1 p-1 bg-card-dark/50 rounded-xl w-full sm:w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-foreground"
                  : "text-text-muted hover:text-foreground/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-card-dark rounded-lg border border-border-dark/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center text-text-muted text-xs font-mono"
          >
            Cargando sincronización...
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* TASKS TAB */}
            {activeTab === "tasks" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">
                    {completedTasks} de {tasks.length} completadas
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                      placeholder="¿Qué necesitas hacer hoy?"
                      className="flex-1 bg-card-dark border border-border-dark/50 rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary/30 focus:outline-none transition placeholder:text-text-muted/60"
                    />
                    <button
                      onClick={handleAddTask}
                      className="px-4 py-3 bg-card-dark border border-border-dark/50 text-text-muted hover:text-foreground rounded-xl hover:bg-card-hover transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewTaskPriority(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          newTaskPriority === p
                            ? "bg-card-dark border border-border-dark/50 text-foreground/80"
                            : "text-text-muted hover:text-foreground/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                        {PRIORITY_CONFIG[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sortedTasks.length > 0 ? (
                      sortedTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                            task.completed
                              ? "opacity-45"
                              : "bg-card-dark/50 hover:bg-card-dark"
                          }`}
                        >
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                              task.completed
                                ? "bg-primary/20 border-primary/30 text-primary"
                                : "border-border-dark hover:border-primary/30"
                            }`}
                          >
                            {task.completed && <span className="text-[9px]">✓</span>}
                          </button>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[task.priority].dot}`} />
                          <span className={`flex-1 text-[13px] ${task.completed ? "line-through text-text-muted" : "text-foreground/90"}`}>
                            {task.text}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-16 text-center text-text-muted text-sm">
                        Sin tareas para hoy. Escribe algo arriba para empezar.
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* HABITS TAB */}
            {activeTab === "habits" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">
                    {completedHabits} de {activeHabitsToday.length} hábitos completados hoy
                  </p>
                  <div className="flex-1 max-w-[120px] bg-border-dark h-1 rounded-full overflow-hidden ml-4">
                    <motion.div
                      className="bg-accent-green h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {goodHabits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-accent-green/70" />
                      <h3 className="text-[13px] font-medium text-text-muted">
                        Hábitos positivos
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {goodHabits.map((habit) => {
                        const completed = isCompletedToday(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            layout
                            onClick={() => handleToggleHabit(habit.id)}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                              completed
                                ? "opacity-45"
                                : "bg-card-dark/50 hover:bg-card-dark"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: completed ? "rgba(30,30,36,0.3)" : `${habit.color}10`,
                                color: completed ? "#56565f" : `${habit.color}99`,
                              }}
                            >
                              <IconMapper name={habit.icon} className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-[13px] font-medium ${completed ? "line-through text-text-muted" : "text-foreground/90"}`}>
                                {habit.name}
                              </h4>
                              <p className="text-[11px] text-text-muted truncate mt-0.5">
                                {habit.description}
                              </p>
                            </div>
                            <div className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all ${
                              completed
                                ? "bg-accent-green/15 border-accent-green/30 text-accent-green"
                                : "border-border-dark"
                            }`}>
                              {completed && <span className="text-[9px]">✓</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {badHabits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-accent-rose/70" />
                      <h3 className="text-[13px] font-medium text-text-muted">
                        Hábitos a evitar
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {badHabits.map((habit) => {
                        const completed = isCompletedToday(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            layout
                            onClick={() => handleToggleHabit(habit.id)}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                              completed
                                ? "bg-accent-green/5 border border-accent-green/10"
                                : "bg-card-dark/50 hover:bg-card-dark"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: completed ? "rgba(126, 200, 155, 0.08)" : `${habit.color}10`,
                                color: completed ? "#7EC89B" : `${habit.color}99`,
                              }}
                            >
                              <IconMapper name={habit.icon} className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-[13px] font-medium ${completed ? "text-accent-green/80" : "text-foreground/90"}`}>
                                {habit.name}
                              </h4>
                              <p className="text-[11px] text-text-muted truncate mt-0.5">
                                {completed ? "Éxito — lo evitaste hoy" : habit.description}
                              </p>
                            </div>
                            <div className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all ${
                              completed
                                ? "bg-accent-green/15 border-accent-green/30 text-accent-green"
                                : "border-accent-rose/20"
                            }`}>
                              {completed && <span className="text-[9px]">✓</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeHabitsToday.length === 0 && (
                  <div className="py-16 text-center text-text-muted text-sm">
                    No hay hábitos programados para hoy.
                  </div>
                )}
              </div>
            )}

            {/* FOCUS TAB */}
            {activeTab === "focus" && (
              <div className="max-w-sm mx-auto">
                <PomodoroTimer />
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="max-w-md mx-auto">
                <StickyNotes />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
