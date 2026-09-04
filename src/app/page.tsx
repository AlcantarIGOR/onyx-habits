"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Habit,
  HabitLog,
  Task,
  ScheduleBlock,
  getLocalDateString,
} from "@/lib/storage";
import { useNavigation } from "@/lib/navigation";
import {
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Flame,
  TrendingUp,
  Pencil,
  Check,
  X,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarClock,
  Radio,
  Copy,
  ExternalLink,
  Share2,
  Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PomodoroTimer from "@/components/PomodoroTimer";
import { StickyNotes } from "@/components/StickyNotes";
import IconMapper from "@/components/IconMapper";
import CalendarWidget from "@/components/CalendarWidget";
import SobrietyTrackerWidget from "@/components/SobrietyTrackerWidget";
import DailyTimelineWidget from "@/components/DailyTimelineWidget";
import GamerHud from "@/components/GamerHud";
import BossBattlesWidget from "@/components/BossBattlesWidget";
import IosIntegrationModal from "@/components/IosIntegrationModal";
import { GamificationStats } from "@/lib/gamification";

// ─── Priority config ─────────────────────────────────────────────
const PRIORITY_CONFIG = {
  high:   { label: "Alta",  dot: "bg-accent-rose",  sort: 0 },
  medium: { label: "Media", dot: "bg-accent-amber", sort: 1 },
  low:    { label: "Baja",  dot: "bg-text-muted/40",    sort: 2 },
} as const;

// Helper to format date in Spanish
function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`;
}

export default function Dashboard() {
  const { activeSection, setActiveSection } = useNavigation();

  // Data State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [todayStr] = useState(() => getLocalDateString());
  const [loading, setLoading] = useState(true);

  // Form State
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");

  // Daily Log State
  const [logDate, setLogDate] = useState(todayStr);
  const [logTasks, setLogTasks] = useState<Task[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [habitCategoryFilter, setHabitCategoryFilter] = useState<"all" | "fundamental" | "maintenance" | "growth">("all");

  // iCal Sync Modal State
  const [isICalModalOpen, setIsICalModalOpen] = useState(false);
  const [copiedICal, setCopiedICal] = useState(false);

  // Gamification RPG State
  const [gamerStats, setGamerStats] = useState<GamificationStats | null>(null);
  const [floatingXp, setFloatingXp] = useState<{ id: number; text: string; color: string } | null>(null);

  const triggerXp = React.useCallback((text: string, color = "#10B981") => {
    setFloatingXp({ id: Date.now(), text, color });
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
    setTimeout(() => {
      setFloatingXp((current) => (current?.text === text ? null : current));
    }, 1800);
  }, []);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard?date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
        if (data.habits) setHabits(data.habits);
        if (data.logs) setLogs(data.logs);
        if (data.scheduleBlocks) setScheduleBlocks(data.scheduleBlocks);
        if (data.gamification) setGamerStats(data.gamification);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchData();

    // Auto-sync when user unlocks iPhone, clicks on PC window, or switches tabs
    const handleFocus = () => fetchData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Live Heartbeat Sync (every 2.5s): updates in real-time when marked on iPhone
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }, 2500);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Fetch completed tasks for the log date
  useEffect(() => {
    if (activeSection !== "log") return;
    let ignore = false;

    async function fetchLogTasks() {
      setLogLoading(true);
      try {
        const res = await fetch(`/api/tasks?completedDate=${logDate}`);
        if (!ignore && res.ok) {
          setLogTasks(await res.json());
        }
      } catch (err) {
        console.error("Error loading log tasks:", err);
      } finally {
        if (!ignore) setLogLoading(false);
      }
    }

    fetchLogTasks();
    return () => { ignore = true; };
  }, [activeSection, logDate]);

  // ── Stats ───────────────────────────────────────────────────────
  const { streak, completionRate } = useMemo(() => {
    const activeHabitsCountByDay = (date: Date) => {
      const dayOfWeek = date.getDay();
      return habits.filter((h) => h.daysOfWeek.includes(dayOfWeek)).length;
    };

    const completedHabitsCountByDay = (dateStr: string) =>
      logs.filter((l) => l.date === dateStr && l.completed).length;

    let calculatedStreak = 0;
    const tempDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDateString(tempDate);
      const activeCount = activeHabitsCountByDay(tempDate);
      const completedCount = completedHabitsCountByDay(dateStr);

      if (activeCount === 0) {
        tempDate.setDate(tempDate.getDate() - 1);
        continue;
      }

      if (completedCount / activeCount >= 0.5) {
        calculatedStreak++;
      } else {
        if (i === 0) { tempDate.setDate(tempDate.getDate() - 1); continue; }
        break;
      }
      tempDate.setDate(tempDate.getDate() - 1);
    }

    let completedInLast30Days = 0;
    let activeInLast30Days = 0;
    const checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateStr = getLocalDateString(checkDate);
      activeInLast30Days += activeHabitsCountByDay(checkDate);
      completedInLast30Days += logs.filter((l) => l.date === dateStr && l.completed).length;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const calculatedRate = activeInLast30Days > 0
      ? Math.round((completedInLast30Days / activeInLast30Days) * 100)
      : 0;

    return { streak: calculatedStreak, completionRate: calculatedRate };
  }, [habits, logs]);

  // ── Habits Logic ───────────────────────────────────────────────
  const todayDayOfWeek = new Date().getDay();
  const activeHabitsToday = habits.filter((h) => h.daysOfWeek.includes(todayDayOfWeek));
  const fundamentalHabits = activeHabitsToday.filter((h) => h.type === "fundamental");
  const maintenanceHabits = activeHabitsToday.filter((h) => h.type === "maintenance" || h.type === "good");
  const growthHabits = activeHabitsToday.filter((h) => h.type === "growth");
  const badHabits = activeHabitsToday.filter((h) => h.type === "bad");

  const isCompletedToday = (habitId: string) =>
    logs.some((l) => l.habitId === habitId && l.date === todayStr && l.completed);

  const handleToggleHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    const wasCompleted = isCompletedToday(habitId);

    if (!wasCompleted && habit) {
      const xp = habit.type === "fundamental" ? 30 : habit.type === "growth" ? 20 : 15;
      const color = habit.type === "fundamental" ? "#F43F5E" : habit.type === "growth" ? "#A855F7" : "#F59E0B";
      triggerXp(`+${xp} XP · ${habit.name}`, color);
    }

    setLogs((prev) => {
      const exists = prev.some((l) => l.habitId === habitId && l.date === todayStr);
      if (exists) {
        return prev.map((l) =>
          l.habitId === habitId && l.date === todayStr ? { ...l, completed: !l.completed } : l
        );
      }
      return [...prev, { id: "temp", habitId, date: todayStr, completed: true }];
    });

    try {
      await fetch("/api/habits/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: todayStr }),
      });
      const [res, gamificationRes] = await Promise.all([
        fetch("/api/habits/logs"),
        fetch("/api/gamification"),
      ]);
      if (res.ok) setLogs(await res.json());
      if (gamificationRes && gamificationRes.ok) setGamerStats(await gamificationRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const completedHabitsCount = activeHabitsToday.filter((h) => isCompletedToday(h.id)).length;
  const progressPercent = activeHabitsToday.length > 0
    ? Math.round((completedHabitsCount / activeHabitsToday.length) * 100)
    : 0;

  const fundamentalCompleted = fundamentalHabits.filter((h) => isCompletedToday(h.id)).length;
  const maintenanceCompleted = maintenanceHabits.filter((h) => isCompletedToday(h.id)).length;
  const growthCompleted = growthHabits.filter((h) => isCompletedToday(h.id)).length;

  // ── Tasks Logic ────────────────────────────────────────────────
  const sortedTasks = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed)
      .sort((a, b) => PRIORITY_CONFIG[a.priority].sort - PRIORITY_CONFIG[b.priority].sort);
    const completed = tasks.filter((t) => t.completed)
      .sort((a, b) => PRIORITY_CONFIG[a.priority].sort - PRIORITY_CONFIG[b.priority].sort);
    return [...pending, ...completed];
  }, [tasks]);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
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
        body: JSON.stringify({ text: tempTask.text, completed: false, priority: newTaskPriority, date: todayStr }),
      });
      if (res.ok) {
        const saved = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === "temp" ? saved : t)));
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (!task.completed) {
      const xp = task.priority === "high" ? 25 : task.priority === "low" ? 10 : 15;
      triggerXp(`+${xp} XP · Misión Cumplida`, "#10B981");
    }

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text: task.text, completed: !task.completed, priority: task.priority, date: task.date }),
      });
      const gamificationRes = await fetch("/api/gamification");
      if (gamificationRes && gamificationRes.ok) setGamerStats(await gamificationRes.json());
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try { await fetch(`/api/tasks?id=${id}`, { method: "DELETE" }); }
    catch (err) { console.error(err); }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditText(task.text);
    setEditPriority(task.priority);
  };

  const handleCancelEdit = () => { setEditingTaskId(null); setEditText(""); };

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editText.trim()) return;
    setTasks((prev) =>
      prev.map((t) => t.id === editingTaskId ? { ...t, text: editText.trim(), priority: editPriority } : t)
    );
    const savedId = editingTaskId;
    setEditingTaskId(null);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedId, text: editText.trim(), priority: editPriority }),
      });
    } catch (err) { console.error(err); }
  };

  const navigateLogDate = (direction: number) => {
    const d = new Date(logDate + "T12:00:00");
    d.setDate(d.getDate() + direction);
    setLogDate(getLocalDateString(d));
  };

  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // ── Live Class / Schedule Status ──────────────────────────────
  const liveStatus = useMemo(() => {
    if (!scheduleBlocks || scheduleBlocks.length === 0) return null;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const timeToMins = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    // Find currently active block
    const current = scheduleBlocks.find((b) => {
      const start = timeToMins(b.startTime);
      const end = timeToMins(b.endTime);
      return currentMins >= start && currentMins < end;
    });

    if (current) {
      const end = timeToMins(current.endTime);
      const remainingMins = end - currentMins;
      const hoursLeft = Math.floor(remainingMins / 60);
      const minsLeft = remainingMins % 60;
      const timeRemainingStr = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft} min`;
      return { type: "active", block: current, timeRemainingStr };
    }

    // Find next upcoming block today
    const upcoming = scheduleBlocks
      .filter((b) => timeToMins(b.startTime) > currentMins)
      .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))[0];

    if (upcoming) {
      const start = timeToMins(upcoming.startTime);
      const diffMins = start - currentMins;
      const hoursLeft = Math.floor(diffMins / 60);
      const minsLeft = diffMins % 60;
      const startsInStr = hoursLeft > 0 ? `en ${hoursLeft}h ${minsLeft}m` : `en ${minsLeft} min`;
      return { type: "upcoming", block: upcoming, startsInStr };
    }

    return null;
  }, [scheduleBlocks]);

  // ── Greeting ──────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Live Class / Activity Status Banner ── */}
      {liveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
            liveStatus.type === "active"
              ? "bg-gradient-to-r from-accent-rose/15 via-card-dark to-card-dark border-accent-rose/40"
              : "bg-gradient-to-r from-primary/15 via-card-dark to-card-dark border-primary/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                liveStatus.type === "active"
                  ? "bg-accent-rose/20 text-accent-rose"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {liveStatus.type === "active" ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <CalendarClock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    liveStatus.type === "active"
                      ? "bg-accent-rose/20 text-accent-rose animate-pulse"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  {liveStatus.type === "active"
                    ? `En Curso · Restan ${liveStatus.timeRemainingStr}`
                    : `Siguiente · Comienza ${liveStatus.startsInStr}`}
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {liveStatus.block.startTime} – {liveStatus.block.endTime}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-0.5">
                {liveStatus.block.title}
                {liveStatus.block.location && (
                  <span className="font-normal text-text-muted text-xs ml-2">
                    📍 {liveStatus.block.location}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setActiveSection("schedule")}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-card-hover border border-border-dark/60 hover:border-primary/40 text-foreground transition cursor-pointer flex items-center gap-1.5"
            >
              Ver Horario
              <ExternalLink className="w-3 h-3 text-text-muted" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Gamer HUD (RPG Progression & Level Bar) ── */}
      <GamerHud stats={gamerStats} loading={loading} />

      {/* ── Floating XP Particle Notification ── */}
      <AnimatePresence>
        {floatingXp && (
          <motion.div
            key={floatingXp.id}
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-6 right-6 z-50 px-4 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-2 font-mono text-xs font-bold pointer-events-none"
            style={{
              backgroundColor: "#13131aee",
              borderColor: floatingXp.color,
              color: floatingXp.color,
              boxShadow: `0 8px 24px ${floatingXp.color}33`,
            }}
          >
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{floatingXp.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{greeting}</h1>
            <button
              onClick={() => setIsICalModalOpen(true)}
              title="Suite de Comandos Siri, Geofencing TEC, Atajos y Calendario para tu iPhone 15"
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-card-dark/80 hover:bg-card-dark border border-primary/30 hover:border-primary/60 text-primary transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Suite iPhone 15 & Siri</span>
            </button>
          </div>
          <p className="text-sm text-text-muted capitalize">{dateFormatted}</p>
        </div>
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

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-16 text-center text-text-muted text-xs font-mono">
            Cargando sincronización...
          </motion.div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ════════ TASKS ════════ */}
            {activeSection === "tasks" && (
              <div className="space-y-6">
                <p className="text-sm text-text-muted">
                  {pendingTasks} pendiente{pendingTasks !== 1 ? "s" : ""} · {completedTasks} completada{completedTasks !== 1 ? "s" : ""}
                </p>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text" value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                      placeholder="¿Qué necesitas hacer?"
                      aria-label="Escribe una nueva tarea"
                      className="flex-1 bg-card-dark border border-border-dark/50 rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary/30 focus:outline-none transition placeholder:text-text-muted/60"
                    />
                    <button onClick={handleAddTask} aria-label="Agregar tarea"
                      className="px-4 py-3 bg-card-dark border border-border-dark/50 text-text-muted hover:text-foreground rounded-xl hover:bg-card-hover transition-all cursor-pointer">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <button key={p} onClick={() => setNewTaskPriority(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          newTaskPriority === p
                            ? "bg-card-dark border border-border-dark/50 text-foreground/80"
                            : "text-text-muted hover:text-foreground/50"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                        {PRIORITY_CONFIG[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sortedTasks.length > 0 ? sortedTasks.map((task) => (
                      <motion.div key={task.id} layout
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                          task.completed ? "opacity-40 bg-card-dark/20" : "bg-card-dark/50 hover:bg-card-dark"
                        }`}>
                        {editingTaskId === task.id ? (
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") handleCancelEdit(); }}
                                autoFocus className="flex-1 bg-card-hover border border-border-dark rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none transition" />
                              <button onClick={handleSaveEdit} className="p-2 text-accent-green hover:bg-accent-green/10 rounded-lg transition cursor-pointer">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={handleCancelEdit} className="p-2 text-accent-rose hover:bg-accent-rose/10 rounded-lg transition cursor-pointer">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              {(["high", "medium", "low"] as const).map((p) => (
                                <button key={p} onClick={() => setEditPriority(p)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                                    editPriority === p ? "bg-card-dark border border-border-dark/60 text-foreground/80" : "text-text-muted/60 hover:text-text-muted"
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                                  {PRIORITY_CONFIG[p].label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => handleToggleTask(task.id)}
                              className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                                task.completed ? "bg-primary/20 border-primary/30 text-primary" : "border-border-dark hover:border-primary/30"
                              }`}>
                              {task.completed && <span className="text-[9px]">✓</span>}
                            </button>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[task.priority].dot}`} />
                            <span className={`flex-1 text-[13px] ${task.completed ? "line-through text-text-muted" : "text-foreground/90"}`}>
                              {task.text}
                            </span>
                            {task.date !== todayStr && !task.completed && (
                              <span className="text-[9px] text-text-muted/50 bg-card-dark px-1.5 py-0.5 rounded">
                                {new Date(task.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                              </span>
                            )}
                            <button onClick={() => handleStartEdit(task)}
                              className="opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-text-muted hover:text-primary transition-all cursor-pointer">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)}
                              className="opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition-all cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </motion.div>
                    )) : (
                      <div className="py-16 text-center text-text-muted text-sm">
                        Sin tareas pendientes. ¡Buen trabajo! 🎉
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ════════ HABITS ════════ */}
            {activeSection === "habits" && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* ── Top Progress & 3-Tier Summary Strip ── */}
                <div className="space-y-3 bg-card-dark/40 border border-border-dark/40 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Progreso de Hábitos</h2>
                      <p className="text-xs text-text-muted mt-0.5">
                        {completedHabitsCount} de {activeHabitsToday.length} completados hoy ({progressPercent}%)
                      </p>
                    </div>
                    <div className="w-24 bg-border-dark/50 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-accent-green h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* 3 Categories Mini Cards */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-dark/30">
                    <button
                      onClick={() => setHabitCategoryFilter(habitCategoryFilter === "fundamental" ? "all" : "fundamental")}
                      className={`text-left rounded-xl p-2.5 space-y-1.5 transition cursor-pointer border ${
                        habitCategoryFilter === "fundamental"
                          ? "bg-accent-rose/15 border-accent-rose/40"
                          : "bg-card-dark/60 border-border-dark/40 hover:border-accent-rose/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-accent-rose flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span className="truncate">Fundamentales</span>
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-text-muted">
                          {fundamentalCompleted}/{fundamentalHabits.length}
                        </span>
                      </div>
                      <div className="w-full bg-border-dark/40 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-accent-rose h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${fundamentalHabits.length > 0 ? (fundamentalCompleted / fundamentalHabits.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </button>

                    <button
                      onClick={() => setHabitCategoryFilter(habitCategoryFilter === "maintenance" ? "all" : "maintenance")}
                      className={`text-left rounded-xl p-2.5 space-y-1.5 transition cursor-pointer border ${
                        habitCategoryFilter === "maintenance"
                          ? "bg-amber-400/15 border-amber-400/40"
                          : "bg-card-dark/60 border-border-dark/40 hover:border-amber-400/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="truncate">Mantenimiento</span>
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-text-muted">
                          {maintenanceCompleted}/{maintenanceHabits.length}
                        </span>
                      </div>
                      <div className="w-full bg-border-dark/40 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${maintenanceHabits.length > 0 ? (maintenanceCompleted / maintenanceHabits.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </button>

                    <button
                      onClick={() => setHabitCategoryFilter(habitCategoryFilter === "growth" ? "all" : "growth")}
                      className={`text-left rounded-xl p-2.5 space-y-1.5 transition cursor-pointer border ${
                        habitCategoryFilter === "growth"
                          ? "bg-accent-green/15 border-accent-green/40"
                          : "bg-card-dark/60 border-border-dark/40 hover:border-accent-green/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-accent-green flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="truncate">Crecimiento</span>
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-text-muted">
                          {growthCompleted}/{growthHabits.length}
                        </span>
                      </div>
                      <div className="w-full bg-border-dark/40 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-accent-green h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${growthHabits.length > 0 ? (growthCompleted / growthHabits.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </button>
                  </div>
                </div>

                {/* ── Category Filter Tabs ── */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setHabitCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
                      habitCategoryFilter === "all"
                        ? "bg-primary/20 text-foreground border border-primary/30"
                        : "text-text-muted hover:text-foreground bg-card-dark/40 border border-border-dark/30"
                    }`}
                  >
                    Todos ({activeHabitsToday.length})
                  </button>
                  <button
                    onClick={() => setHabitCategoryFilter("fundamental")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                      habitCategoryFilter === "fundamental"
                        ? "bg-accent-rose/20 text-accent-rose border border-accent-rose/40"
                        : "text-text-muted hover:text-accent-rose bg-card-dark/40 border border-border-dark/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-rose" />
                    Fundamentales ({fundamentalHabits.length})
                  </button>
                  <button
                    onClick={() => setHabitCategoryFilter("maintenance")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                      habitCategoryFilter === "maintenance"
                        ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                        : "text-text-muted hover:text-amber-400 bg-card-dark/40 border border-border-dark/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Mantenimiento ({maintenanceHabits.length})
                  </button>
                  <button
                    onClick={() => setHabitCategoryFilter("growth")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                      habitCategoryFilter === "growth"
                        ? "bg-accent-green/20 text-accent-green border border-accent-green/40"
                        : "text-text-muted hover:text-accent-green bg-card-dark/40 border border-border-dark/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                    Crecimiento ({growthHabits.length})
                  </button>
                </div>

                {/* ── 1. 🔴 HÁBITOS FUNDAMENTALES ── */}
                {(habitCategoryFilter === "all" || habitCategoryFilter === "fundamental") && fundamentalHabits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-accent-rose" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-rose">
                          Hábitos Fundamentales
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-accent-rose/80 font-bold bg-accent-rose/10 px-2 py-0.5 rounded-md">
                        {fundamentalCompleted} / {fundamentalHabits.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {fundamentalHabits.map((habit) => {
                        const completed = isCompletedToday(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            layout
                            role="button"
                            tabIndex={0}
                            onClick={() => handleToggleHabit(habit.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleToggleHabit(habit.id)}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all border border-l-4 border-l-accent-rose ${
                              completed
                                ? "bg-card-dark/25 border-border-dark/20 opacity-50"
                                : "bg-card-dark/70 hover:bg-card-dark border-border-dark/40 hover:border-accent-rose/40 shadow-sm"
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: completed ? "rgba(30,30,36,0.3)" : `${habit.color}20`,
                                color: completed ? "#56565f" : habit.color,
                              }}
                            >
                              <IconMapper name={habit.icon} className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-sm font-semibold tracking-tight ${
                                    completed ? "line-through text-text-muted" : "text-foreground"
                                  }`}
                                >
                                  {habit.name}
                                </h4>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-rose/15 text-accent-rose">
                                  Fundamental
                                </span>
                              </div>
                              {habit.description && (
                                <p className="text-xs text-text-muted truncate mt-0.5">{habit.description}</p>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                completed
                                  ? "bg-accent-green/20 border-accent-green/40 text-accent-green font-bold text-xs"
                                  : "border-border-dark hover:border-text-muted"
                              }`}
                            >
                              {completed && <span>✓</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 2. 🟡 HÁBITOS DE MANTENIMIENTO ── */}
                {(habitCategoryFilter === "all" || habitCategoryFilter === "maintenance") && maintenanceHabits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          Hábitos de Mantenimiento
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md">
                        {maintenanceCompleted} / {maintenanceHabits.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {maintenanceHabits.map((habit) => {
                        const completed = isCompletedToday(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            layout
                            role="button"
                            tabIndex={0}
                            onClick={() => handleToggleHabit(habit.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleToggleHabit(habit.id)}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all border border-l-4 border-l-amber-500 ${
                              completed
                                ? "bg-card-dark/25 border-border-dark/20 opacity-50"
                                : "bg-card-dark/70 hover:bg-card-dark border-border-dark/40 hover:border-amber-400/40 shadow-sm"
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: completed ? "rgba(30,30,36,0.3)" : `${habit.color}20`,
                                color: completed ? "#56565f" : habit.color,
                              }}
                            >
                              <IconMapper name={habit.icon} className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-sm font-semibold tracking-tight ${
                                    completed ? "line-through text-text-muted" : "text-foreground"
                                  }`}
                                >
                                  {habit.name}
                                </h4>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400">
                                  Mantenimiento
                                </span>
                              </div>
                              {habit.description && (
                                <p className="text-xs text-text-muted truncate mt-0.5">{habit.description}</p>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                completed
                                  ? "bg-accent-green/20 border-accent-green/40 text-accent-green font-bold text-xs"
                                  : "border-border-dark hover:border-text-muted"
                              }`}
                            >
                              {completed && <span>✓</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 3. 🟢 HÁBITOS DE CRECIMIENTO ── */}
                {(habitCategoryFilter === "all" || habitCategoryFilter === "growth") && growthHabits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent-green" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
                          Hábitos de Crecimiento
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-accent-green font-bold bg-accent-green/10 px-2 py-0.5 rounded-md">
                        {growthCompleted} / {growthHabits.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {growthHabits.map((habit) => {
                        const completed = isCompletedToday(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            layout
                            role="button"
                            tabIndex={0}
                            onClick={() => handleToggleHabit(habit.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleToggleHabit(habit.id)}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all border border-l-4 border-l-accent-green ${
                              completed
                                ? "bg-card-dark/25 border-border-dark/20 opacity-50"
                                : "bg-card-dark/70 hover:bg-card-dark border-border-dark/40 hover:border-accent-green/40 shadow-sm"
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: completed ? "rgba(30,30,36,0.3)" : `${habit.color}20`,
                                color: completed ? "#56565f" : habit.color,
                              }}
                            >
                              <IconMapper name={habit.icon} className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-sm font-semibold tracking-tight ${
                                    completed ? "line-through text-text-muted" : "text-foreground"
                                  }`}
                                >
                                  {habit.name}
                                </h4>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-green/15 text-accent-green">
                                  Crecimiento
                                </span>
                              </div>
                              {habit.description && (
                                <p className="text-xs text-text-muted truncate mt-0.5">{habit.description}</p>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                completed
                                  ? "bg-accent-green/20 border-accent-green/40 text-accent-green font-bold text-xs"
                                  : "border-border-dark hover:border-text-muted"
                              }`}
                            >
                              {completed && <span>✓</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 4. 🛡️ HÁBITOS A EVITAR (SI HAY) ── */}
                {badHabits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-text-muted" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        Hábitos a Evitar
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {badHabits.map((habit) => {
                        const completed = isCompletedToday(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            layout
                            role="button"
                            tabIndex={0}
                            onClick={() => handleToggleHabit(habit.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleToggleHabit(habit.id)}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                              completed
                                ? "bg-accent-green/5 border-accent-green/20"
                                : "bg-card-dark/60 hover:bg-card-dark border-border-dark/40"
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: completed ? "rgba(126,200,155,0.08)" : `${habit.color}15`,
                                color: completed ? "#7EC89B" : habit.color,
                              }}
                            >
                              <IconMapper name={habit.icon} className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-semibold tracking-tight ${
                                  completed ? "text-accent-green/80" : "text-foreground"
                                }`}
                              >
                                {habit.name}
                              </h4>
                              <p className="text-xs text-text-muted truncate mt-0.5">
                                {completed ? "Éxito — lo evitaste hoy" : habit.description}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                completed
                                  ? "bg-accent-green/20 border-accent-green/40 text-accent-green font-bold text-xs"
                                  : "border-accent-rose/30"
                              }`}
                            >
                              {completed && <span>✓</span>}
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

            {/* ════════ SCHEDULE ════════ */}
            {activeSection === "schedule" && (
              <div className="w-full"><DailyTimelineWidget /></div>
            )}

            {/* ════════ CALENDAR ════════ */}
            {activeSection === "calendar" && (
              <div className="max-w-md mx-auto"><CalendarWidget /></div>
            )}

            {/* ════════ SOBRIETY ════════ */}
            {activeSection === "sobriety" && (
              <div className="max-w-md mx-auto"><SobrietyTrackerWidget /></div>
            )}

            {/* ════════ FOCUS & BOSS BATTLES ════════ */}
            {activeSection === "focus" && (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Pomodoro Timer 2.0 */}
                  <div className="lg:col-span-5 bg-card-dark/60 border border-border-dark/60 rounded-3xl p-6 shadow-xl">
                    <PomodoroTimer
                      onSessionComplete={(subject, mins) => {
                        triggerXp(`+20 XP · Sesión de ${mins}m (${subject})`, "#8B5CF6");
                        fetchData();
                      }}
                    />
                  </div>

                  {/* Right: Boss Battles & Exams Hub */}
                  <div className="lg:col-span-7 bg-card-dark/60 border border-border-dark/60 rounded-3xl p-6 shadow-xl">
                    <BossBattlesWidget
                      onVictory={(bossTitle) => {
                        triggerXp(`🏆 +100 XP · ¡Victoria sobre ${bossTitle}!`, "#F43F5E");
                        fetchData();
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ════════ NOTES ════════ */}
            {activeSection === "notes" && (
              <div className="max-w-md mx-auto"><StickyNotes /></div>
            )}

            {/* ════════ LOG ════════ */}
            {activeSection === "log" && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => navigateLogDate(-1)}
                    className="p-2 text-text-muted hover:text-foreground hover:bg-card-dark rounded-lg transition cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-center min-w-[200px]">
                    <p className="text-sm font-medium text-foreground capitalize">{formatDateSpanish(logDate)}</p>
                    {logDate === todayStr && <p className="text-[11px] text-accent-green mt-0.5">Hoy</p>}
                  </div>
                  <button onClick={() => navigateLogDate(1)} disabled={logDate >= todayStr}
                    className={`p-2 rounded-lg transition cursor-pointer ${
                      logDate >= todayStr ? "text-text-muted/30 cursor-not-allowed" : "text-text-muted hover:text-foreground hover:bg-card-dark"
                    }`}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {logLoading ? (
                  <div className="py-12 text-center text-text-muted text-xs font-mono">Cargando registro...</div>
                ) : logTasks.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2">
                      <Check className="h-4 w-4 text-accent-green" />
                      <p className="text-sm text-text-muted">
                        <strong className="text-foreground">{logTasks.length}</strong> tarea{logTasks.length !== 1 ? "s" : ""} completada{logTasks.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <AnimatePresence>
                      {logTasks.map((task, i) => (
                        <motion.div key={task.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 px-4 py-3 bg-card-dark/50 rounded-xl">
                          <div className="mt-0.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_CONFIG[task.priority].dot}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-foreground/90">{task.text}</p>
                            {task.completedAt && (
                              <p className="text-[11px] text-text-muted mt-1">
                                Completada a las {new Date(task.completedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-accent-green/70 font-medium bg-accent-green/5 px-2 py-0.5 rounded-full">✓ Hecho</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <ClipboardList className="h-8 w-8 text-text-muted/30 mx-auto" />
                    <p className="text-sm text-text-muted">
                      {logDate === todayStr ? "Aún no has completado tareas hoy." : "No se completaron tareas este día."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de Integración con iPhone 15 & Siri ── */}
      <IosIntegrationModal
        isOpen={isICalModalOpen}
        onClose={() => setIsICalModalOpen(false)}
      />
    </div>
  );
}
