"use client";

import React, { useState, useEffect } from "react";
import { Habit, HabitLog, getLocalDateString } from "@/lib/storage";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  ShieldCheck,
  ShieldAlert,
  Flame,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IconMapper from "@/components/IconMapper";

const ICONS = [
  "moon",
  "sunrise",
  "cloud",
  "dog",
  "school",
  "smartphone",
  "brain",
  "droplet",
  "sparkles",
  "book",
  "code",
  "target",
  "wallet",
  "edit",
  "flame",
  "heart",
  "coffee",
  "dumbbell",
];

const COLORS = [
  "#F43F5E", // Rosa / Rojo
  "#F59E0B", // Ámbar
  "#3B82F6", // Azul
  "#22D3EE", // Cyan
  "#7C6EF6", // Violeta
  "#E879F9", // Fucsia
  "#4ADE80", // Verde
  "#10B981", // Esmeralda
  "#D4A574", // Arena
  "#8B9FCA", // Periwinkle
];

const DAYS = [
  { label: "Do", value: 0 },
  { label: "Lu", value: 1 },
  { label: "Ma", value: 2 },
  { label: "Mi", value: 3 },
  { label: "Ju", value: 4 },
  { label: "Vi", value: 5 },
  { label: "Sá", value: 6 },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("brain");
  const [color, setColor] = useState(COLORS[0]);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [habitType, setHabitType] = useState<Habit["type"]>("fundamental");

  const refetchData = async () => {
    try {
      const [habitsRes, logsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch("/api/habits/logs"),
      ]);
      if (habitsRes.ok && logsRes.ok) {
        setHabits(await habitsRes.json());
        setLogs(await logsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        const [habitsRes, logsRes] = await Promise.all([
          fetch("/api/habits"),
          fetch("/api/habits/logs"),
        ]);
        if (!ignore && habitsRes.ok && logsRes.ok) {
          setHabits(await habitsRes.json());
          setLogs(await logsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();

    const handleFocus = () => fetchData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }, 2500);

    return () => {
      ignore = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const openAddModal = () => {
    setEditingHabit(null);
    setName("");
    setDescription("");
    setIcon("brain");
    setColor(COLORS[0]);
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setHabitType("fundamental");
    setIsModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description || "");
    setIcon(habit.icon);
    setColor(habit.color);
    setDaysOfWeek(habit.daysOfWeek);
    setHabitType(habit.type || "fundamental");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      id: editingHabit?.id || undefined,
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      type: habitType,
      daysOfWeek,
    };

    setIsModalOpen(false);

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        refetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este hábito? Se borrará todo su historial.")) {
      try {
        const res = await fetch(`/api/habits?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          refetchData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleDay = (dayVal: number) => {
    if (daysOfWeek.includes(dayVal)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayVal));
    } else {
      setDaysOfWeek([...daysOfWeek, dayVal].sort());
    }
  };

  // Generate date grid for the last 70 days (10 weeks)
  const getGridDates = () => {
    const grid = [];
    const today = new Date();
    const startOffset = today.getDay();
    const totalDays = 70 + startOffset;

    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDays);

    const daysToSunday = startDate.getDay();
    startDate.setDate(startDate.getDate() - daysToSunday);

    const temp = new Date(startDate);
    while (temp <= today) {
      grid.push(getLocalDateString(new Date(temp)));
      temp.setDate(temp.getDate() + 1);
    }
    return grid;
  };

  const gridDates = getGridDates();

  const isLogCompleted = (habitId: string, dateStr: string) => {
    return logs.some((l) => l.habitId === habitId && l.date === dateStr && l.completed);
  };

  const fundamentalHabits = habits.filter((h) => h.type === "fundamental");
  const maintenanceHabits = habits.filter((h) => h.type === "maintenance" || h.type === "good");
  const growthHabits = habits.filter((h) => h.type === "growth");
  const badHabits = habits.filter((h) => h.type === "bad");

  const renderHabitCard = (habit: Habit) => (
    <div key={habit.id} className="glass-panel p-5 space-y-4 hover:border-border-dark/80 transition duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
          >
            <IconMapper name={habit.icon} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
              {habit.name}
              {habit.type === "fundamental" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-rose/15 text-accent-rose font-medium">
                  Fundamental
                </span>
              )}
              {habit.type === "maintenance" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 font-medium">
                  Mantenimiento
                </span>
              )}
              {habit.type === "growth" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green font-medium">
                  Crecimiento
                </span>
              )}
            </h3>
            {habit.description && <p className="text-xs text-text-muted mt-0.5">{habit.description}</p>}
            {/* Active Days */}
            <div className="flex gap-1 mt-2">
              {DAYS.map((day) => {
                const isActive = habit.daysOfWeek.includes(day.value);
                return (
                  <span
                    key={day.value}
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/25"
                        : "bg-background-dark text-text-muted/40 border border-border-dark/30"
                    }`}
                  >
                    {day.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => openEditModal(habit)}
            aria-label={`Editar ${habit.name}`}
            className="p-1.5 text-text-muted hover:text-foreground hover:bg-card-dark rounded-lg transition cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(habit.id)}
            aria-label={`Eliminar ${habit.name}`}
            className="p-1.5 text-text-muted hover:text-accent-rose hover:bg-card-dark rounded-lg transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* GitHub-style Heatmap Grid */}
      <div className="space-y-1.5 pt-2 border-t border-border-dark/40">
        <div className="flex justify-between items-center text-[10px] font-mono text-text-muted">
          <span>Historial reciente</span>
          <span>Últimas 10 semanas</span>
        </div>
        <div className="flex gap-1 overflow-x-auto py-1">
          {Array.from({ length: Math.ceil(gridDates.length / 7) }).map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, rowIdx) => {
                const dateIndex = colIdx * 7 + rowIdx;
                if (dateIndex >= gridDates.length) return null;
                const dateStr = gridDates[dateIndex];
                const completed = isLogCompleted(habit.id, dateStr);

                return (
                  <div
                    key={dateStr}
                    title={`${dateStr}: ${completed ? "Completado" : "Pendiente"}`}
                    className={`w-2.5 h-2.5 rounded-sm transition-colors ${
                      completed
                        ? habit.type === "bad"
                          ? "bg-accent-rose shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                          : "bg-accent-green shadow-[0_0_8px_rgba(74,222,128,0.4)]"
                        : "bg-border-dark/40"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Gestión de Hábitos</h1>
          <p className="text-text-muted text-xs mt-1">Configura tus 17 hábitos en sus 3 categorías.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-medium rounded-xl transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nuevo Hábito
        </button>
      </div>

      {/* Habits List Grouped by 3 Tiers */}
      {loading ? (
        <div className="py-16 text-center text-text-muted text-xs font-mono">Cargando hábitos...</div>
      ) : (
        <div className="space-y-8">
          {/* 1. 🔴 Fundamentales */}
          {fundamentalHabits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-rose" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-accent-rose">
                  Hábitos Fundamentales ({fundamentalHabits.length})
                </h2>
              </div>
              <div className="space-y-3">{fundamentalHabits.map(renderHabitCard)}</div>
            </div>
          )}

          {/* 2. 🟡 Mantenimiento */}
          {maintenanceHabits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Hábitos de Mantenimiento ({maintenanceHabits.length})
                </h2>
              </div>
              <div className="space-y-3">{maintenanceHabits.map(renderHabitCard)}</div>
            </div>
          )}

          {/* 3. 🟢 Crecimiento */}
          {growthHabits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-green" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-accent-green">
                  Hábitos de Crecimiento ({growthHabits.length})
                </h2>
              </div>
              <div className="space-y-3">{growthHabits.map(renderHabitCard)}</div>
            </div>
          )}

          {/* 4. 🛡️ A Evitar */}
          {badHabits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-text-muted" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                  Hábitos a Evitar ({badHabits.length})
                </h2>
              </div>
              <div className="space-y-3">{badHabits.map(renderHabitCard)}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Agregar / Editar Hábito ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-dark border border-border-dark/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h2 className="text-base font-bold text-foreground">
                {editingHabit ? "Editar Hábito" : "Nuevo Hábito"}
              </h2>

              <form onSubmit={handleSave} className="space-y-4 mt-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted">Nombre del Hábito</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Dormir a las 22:15"
                    className="w-full bg-card-hover border border-border-dark/60 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none transition"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted">Descripción / Detalle</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. 21:45 desconexión · 22:15 dormido"
                    className="w-full bg-card-hover border border-border-dark/60 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none transition"
                  />
                </div>

                {/* Habit Type (3 Tiers) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-text-muted block">Categoría de Hábito</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setHabitType("fundamental")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        habitType === "fundamental"
                          ? "bg-accent-rose/15 border-accent-rose/40 text-accent-rose shadow-sm"
                          : "bg-card-hover border-border-dark/40 text-text-muted hover:text-foreground"
                      }`}
                    >
                      <Flame className="h-4 w-4 mb-1" />
                      <span>Fundamental</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHabitType("maintenance")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        habitType === "maintenance"
                          ? "bg-amber-400/15 border-amber-400/40 text-amber-400 shadow-sm"
                          : "bg-card-hover border-border-dark/40 text-text-muted hover:text-foreground"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 mb-1" />
                      <span>Mantenimiento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHabitType("growth")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        habitType === "growth"
                          ? "bg-accent-green/15 border-accent-green/40 text-accent-green shadow-sm"
                          : "bg-card-hover border-border-dark/40 text-text-muted hover:text-foreground"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mb-1" />
                      <span>Crecimiento</span>
                    </button>
                  </div>
                </div>

                {/* Icon Grid */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-text-muted block">Icono</span>
                  <div className="grid grid-cols-9 gap-1.5">
                    {ICONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`p-2 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          icon === i
                            ? "bg-primary/20 border-primary/40 text-primary scale-105"
                            : "bg-card-hover border-border-dark/40 text-text-muted hover:text-foreground"
                        }`}
                      >
                        <IconMapper name={i} className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-text-muted block">Color</span>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border border-border-dark/50 flex items-center justify-center transition cursor-pointer ${
                          color === c ? "ring-2 ring-offset-2 ring-offset-card-dark scale-110" : "opacity-50 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="h-3 w-3 text-background-dark font-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency Days */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-text-muted block">Días Activo</span>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((day) => {
                      const active = daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`py-2 rounded-xl text-xs font-bold font-mono border transition cursor-pointer ${
                            active
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-card-hover border-border-dark/40 text-text-muted"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border-dark/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-text-muted hover:text-foreground text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    {editingHabit ? "Guardar Cambios" : "Crear Hábito"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
