"use client";

import React, { useState, useEffect } from "react";
import { Habit, HabitLog, getLocalDateString } from "@/lib/storage";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Sunrise,
  Dog,
  Brain,
  Target,
  School,
  Music,
  Moon,
  Award,
  Calendar,
  Check,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS = ["sunrise", "dog", "brain", "target", "school", "zap", "guitar", "moon", "chess"];
const COLORS = ["#8B9FCA", "#7EC89B", "#D4A574", "#C4787E", "#9B8EC4", "#E2E8F0"];
const DAYS = [
  { label: "Do", value: 0 },
  { label: "Lu", value: 1 },
  { label: "Ma", value: 2 },
  { label: "Mi", value: 3 },
  { label: "Ju", value: 4 },
  { label: "Vi", value: 5 },
  { label: "Sá", value: 6 },
];

const IconMapper = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    sunrise: Sunrise, dog: Dog, brain: Brain, target: Target,
    school: School, zap: Sunrise, guitar: Music, moon: Moon, chess: Award,
  };
  const IconComponent = icons[name] || Calendar;
  return <IconComponent className={className} />;
};

export default function HabitsPage() {
  const [mounted, setMounted] = useState(false);
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
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [habitType, setHabitType] = useState<"good" | "bad">("good");

  const loadData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  if (!mounted) return null;

  const openAddModal = () => {
    setEditingHabit(null);
    setName("");
    setDescription("");
    setIcon("brain");
    setColor(COLORS[0]);
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setHabitType("good");
    setIsModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description || "");
    setIcon(habit.icon);
    setColor(habit.color);
    setDaysOfWeek(habit.daysOfWeek);
    setHabitType(habit.type || "good");
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
        loadData();
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
          loadData();
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

    let temp = new Date(startDate);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tus Hábitos</h2>
          <p className="text-text-muted text-xs mt-1">Configura tus objetivos y sigue tu constancia.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 py-2 px-3 bg-card-dark border border-border-dark/60 text-text-muted hover:text-foreground text-xs rounded-xl hover:bg-card-hover transition"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo Hábito
        </button>
      </div>

      {/* Habits List */}
      {loading ? (
        <div className="py-16 text-center text-text-muted text-xs font-mono">Cargando hábitos...</div>
      ) : (
        <div className="space-y-6">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <div key={habit.id} className="glass-panel p-5 space-y-5 hover:border-border-dark/80 transition duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${habit.color}12`, color: habit.color }}
                    >
                      <IconMapper name={habit.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                        {habit.name}
                        {habit.type === "bad" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-rose/10 text-accent-rose">
                            Evitar
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-text-muted mt-0.5">{habit.description}</p>
                      {/* Active Days */}
                      <div className="flex gap-1 mt-2">
                        {DAYS.map((day) => {
                          const isActive = habit.daysOfWeek.includes(day.value);
                          return (
                            <span
                              key={day.value}
                              className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${
                                isActive
                                  ? "bg-primary/10 text-primary/80 border border-primary/20"
                                  : "bg-background-dark text-text-muted/60 border border-border-dark/40"
                              }`}
                            >
                              {day.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(habit)}
                      className="p-2 border border-transparent hover:border-border-dark/60 rounded-lg text-text-muted hover:text-foreground transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 border border-transparent hover:border-accent-rose/20 rounded-lg text-text-muted hover:text-accent-rose transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Grid Grid */}
                <div className="border-t border-border-dark/40 pt-4">
                  <h4 className="text-[10px] font-mono text-text-muted mb-3 uppercase tracking-wider">Historial de Constancia (70 días)</h4>
                  <div className="overflow-x-auto pb-1">
                    <div className="flex flex-col flex-wrap h-20 gap-1 select-none min-w-[320px]">
                      {gridDates.map((dateStr) => {
                        const completed = isLogCompleted(habit.id, dateStr);
                        const activeOnDay = habit.daysOfWeek.includes(
                          new Date(dateStr + "T00:00:00").getDay()
                        );

                        let bg = "bg-border-dark/30";
                        if (completed) {
                          bg = "";
                        } else if (!activeOnDay) {
                          bg = "bg-border-dark/10 opacity-20";
                        }

                        return (
                          <div
                            key={dateStr}
                            className={`w-2 h-2 rounded-sm relative group cursor-pointer ${bg}`}
                            style={{
                              backgroundColor: completed ? habit.color : undefined,
                              boxShadow: completed ? `0 0 6px ${habit.color}25` : undefined,
                            }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                              <div className="bg-card-dark border border-border-dark px-2 py-0.5 rounded text-[9px] font-mono text-foreground whitespace-nowrap shadow-xl">
                                <span className="font-bold">{dateStr}</span>: {completed ? "Completado" : activeOnDay ? "Pendiente" : "No programado"}
                              </div>
                              <div className="w-1 h-1 bg-card-dark border-r border-b border-border-dark rotate-45 -mt-0.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center border border-dashed border-border-dark/50 rounded-2xl text-text-muted text-sm">
              No tienes hábitos creados. Comienza haciendo clic en "Nuevo Hábito".
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background-dark/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="glass-panel w-full max-w-md bg-card-dark border border-border-dark/80 p-5 z-10 relative overflow-hidden"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-foreground rounded-lg"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="text-sm font-semibold text-foreground/90">
                {editingHabit ? "Editar Hábito" : "Nuevo Hábito"}
              </h3>

              <form onSubmit={handleSave} className="space-y-5 mt-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">Nombre del Hábito</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Tomar 2L de agua"
                    className="w-full bg-background-dark border border-border-dark/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary/30 focus:outline-none transition"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">Descripción / Meta</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Beber agua en la mañana y tarde"
                    className="w-full bg-background-dark border border-border-dark/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary/30 focus:outline-none transition"
                  />
                </div>

                {/* Habit Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">Tipo de Hábito</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHabitType("good")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition ${
                        habitType === "good"
                          ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
                          : "bg-background-dark border-border-dark/50 text-text-muted hover:border-border-dark"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Positivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setHabitType("bad")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition ${
                        habitType === "bad"
                          ? "bg-accent-rose/10 border-accent-rose/30 text-accent-rose"
                          : "bg-background-dark border-border-dark/50 text-text-muted hover:border-border-dark"
                      }`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      A Evitar
                    </button>
                  </div>
                </div>

                {/* Icon */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">Icono</label>
                  <div className="grid grid-cols-9 gap-1.5">
                    {ICONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`p-2 rounded-lg border flex items-center justify-center transition ${
                          icon === i
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-background-dark border-border-dark/50 text-text-muted hover:border-border-dark"
                        }`}
                      >
                        <IconMapper name={i} className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-5 h-5 rounded-full border border-border-dark/50 flex items-center justify-center transition hover:scale-105"
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="h-3 w-3 text-background-dark font-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frecuencia */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">Frecuencia</label>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((day) => {
                      const active = daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold font-mono border transition ${
                            active
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-background-dark border-border-dark/50 text-text-muted hover:border-border-dark"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary-hover transition mt-2"
                >
                  {editingHabit ? "Guardar Hábito" : "Crear Hábito"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
