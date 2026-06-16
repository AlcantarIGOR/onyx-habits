"use client";

import React, { useState, useEffect } from "react";
import { 
  storage, 
  Habit, 
  HabitLog, 
  getLocalDateString 
} from "@/lib/storage";
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
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICONS = ["sunrise", "dog", "brain", "target", "school", "zap", "guitar", "moon", "chess"];
const COLORS = ["#A3E635", "#38BDF8", "#A78BFA", "#F43F5E", "#F59E0B", "#2563EB", "#10B981", "#EC4899", "#E2E8F0"];
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
    sunrise: Sunrise,
    dog: Dog,
    brain: Brain,
    target: Target,
    school: School,
    zap: Sunrise, // fallback or direct icon
    guitar: Music,
    moon: Moon,
    chess: Award,
  };
  const IconComponent = icons[name] || Calendar;
  return <IconComponent className={className} />;
};

export default function HabitsPage() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("brain");
  const [color, setColor] = useState("#A3E635");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    setMounted(true);
    setHabits(storage.getHabits());
    setLogs(storage.getLogs());
  }, []);

  if (!mounted) return null;

  const openAddModal = () => {
    setEditingHabit(null);
    setName("");
    setDescription("");
    setIcon("brain");
    setColor("#A3E635");
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setIsModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description);
    setIcon(habit.icon);
    setColor(habit.color);
    setDaysOfWeek(habit.daysOfWeek);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    storage.saveHabit({
      id: editingHabit?.id,
      name,
      description,
      icon,
      color,
      daysOfWeek,
    });

    setHabits(storage.getHabits());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este hábito? Se borrará todo su historial.")) {
      storage.deleteHabit(id);
      setHabits(storage.getHabits());
      setLogs(storage.getLogs());
    }
  };

  const toggleDay = (dayVal: number) => {
    if (daysOfWeek.includes(dayVal)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== dayVal));
    } else {
      setDaysOfWeek([...daysOfWeek, dayVal].sort());
    }
  };

  // Generate date grid for the last 70 days (10 weeks)
  const getGridDates = () => {
    const grid = [];
    const today = new Date();
    // Start from Sunday 10 weeks ago
    const startOffset = today.getDay(); // days since Sunday
    const totalDays = 70 + startOffset; // 10 full weeks + current partial week
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDays);

    // Adjust to starting Sunday
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
    return logs.some(l => l.habitId === habitId && l.date === dateStr && l.completed);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tus Hábitos</h2>
          <p className="text-text-muted text-sm mt-1">Configura tus objetivos diarios, activa tu rutina y sigue tu constancia.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 py-2.5 px-4 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary-hover transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Nuevo Hábito
        </button>
      </div>

      {/* Habits List & Contribution Grids */}
      <div className="space-y-6">
        {habits.length > 0 ? (
          habits.map((habit) => (
            <div key={habit.id} className="glass-panel p-6 space-y-6 hover:border-border-dark transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                  >
                    <IconMapper name={habit.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{habit.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{habit.description}</p>
                    {/* Active Days */}
                    <div className="flex gap-1 mt-2">
                      {DAYS.map((day) => {
                        const isActive = habit.daysOfWeek.includes(day.value);
                        return (
                          <span 
                            key={day.value}
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              isActive 
                                ? "bg-primary/10 text-primary border border-primary/20" 
                                : "bg-background-dark text-text-muted border border-border-dark"
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
                    className="p-2 hover:bg-border-dark/40 border border-transparent hover:border-border-dark rounded-lg text-text-muted hover:text-foreground transition-all"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-text-muted hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contribution Grid (GitHub Style) */}
              <div className="border-t border-border-dark pt-6">
                <h4 className="text-xs font-mono text-text-muted mb-3 uppercase tracking-wider">Historial de Constancia (Últimos 70 días)</h4>
                
                <div className="overflow-x-auto pb-2">
                  <div className="flex flex-col flex-wrap h-24 gap-1 select-none min-w-[320px]">
                    {gridDates.map((dateStr) => {
                      const completed = isLogCompleted(habit.id, dateStr);
                      const activeOnDay = habit.daysOfWeek.includes(new Date(dateStr + "T00:00:00").getDay());
                      
                      let bg = "bg-border-dark/40";
                      if (completed) {
                        bg = "";
                      } else if (!activeOnDay) {
                        bg = "bg-border-dark/10 opacity-30";
                      }

                      return (
                        <div 
                          key={dateStr}
                          className={`w-2.5 h-2.5 rounded-sm relative group cursor-pointer ${bg}`}
                          style={{ 
                            backgroundColor: completed ? habit.color : undefined,
                            boxShadow: completed ? `0 0 8px ${habit.color}30` : undefined
                          }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                            <div className="bg-card-dark border border-border-dark px-2.5 py-1 rounded-md text-[10px] font-mono text-foreground whitespace-nowrap shadow-xl">
                              <span className="font-bold">{dateStr}</span>: {completed ? "Completado" : activeOnDay ? "Pendiente" : "No programado"}
                            </div>
                            <div className="w-1.5 h-1.5 bg-card-dark border-r border-b border-border-dark rotate-45 -mt-1" />
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
          <div className="p-12 text-center border border-dashed border-border-dark rounded-2xl text-text-muted">
            No tienes hábitos creados. Comienza haciendo clic en "Nuevo Hábito" para estructurar tu día.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-lg bg-card-dark border border-border-dark p-6 z-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-foreground rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold">
                {editingHabit ? "Editar Hábito" : "Nuevo Hábito"}
              </h3>
              <p className="text-xs text-text-muted mt-1">Estructura un hábito regular para tu bitácora diaria.</p>

              <form onSubmit={handleSave} className="space-y-6 mt-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Nombre del Hábito</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Practicar Guitarra"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Descripción / Meta</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Tocar acordes básicos durante 20 minutos"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition"
                  />
                </div>

                {/* Icon Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Icono</label>
                  <div className="grid grid-cols-9 gap-2">
                    {ICONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                          icon === i 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background-dark border-border-dark text-text-muted hover:border-border-dark/60"
                        }`}
                      >
                        <IconMapper name={i} className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Color Temático</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-6 h-6 rounded-full border border-border-dark flex items-center justify-center transition hover:scale-110"
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <Check className="h-3.5 w-3.5 text-background-dark font-black" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Days */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Frecuencia Semanal</label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                      const active = daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`py-2 rounded-xl text-xs font-bold font-mono border transition ${
                            active 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-background-dark border-border-dark text-text-muted hover:border-border-dark/60"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-background-dark font-bold text-sm rounded-xl hover:bg-primary-hover transition-all duration-200 mt-4"
                >
                  {editingHabit ? "Guardar Cambios" : "Crear Hábito"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
