"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  storage, 
  Habit, 
  HabitLog, 
  getLocalDateString 
} from "@/lib/storage";
import { 
  Zap, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  Sunrise, 
  Dog, 
  Brain, 
  Target, 
  School, 
  Music, 
  Moon,
  Award,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic Icon Mapper
const IconMapper = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    sunrise: Sunrise,
    dog: Dog,
    brain: Brain,
    target: Target,
    school: School,
    zap: Zap,
    guitar: Music,
    moon: Moon,
    chess: Award,
  };
  const IconComponent = icons[name] || CheckCircle2;
  return <IconComponent className={className} />;
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [todayStr, setTodayStr] = useState("");
  const [stats, setStats] = useState({ streak: 0, completionRate: 0, totalHabits: 0 });
  const [activeRoutineBlock, setActiveRoutineBlock] = useState({ name: "", time: "", desc: "" });

  useEffect(() => {
    setMounted(true);
    const dateStr = getLocalDateString();
    setTodayStr(dateStr);
    setHabits(storage.getHabits());
    setLogs(storage.getLogs());
    setStats(storage.getStats());

    // Calculate current routine block based on local time and date
    const updateRoutineBlock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeVal = hours * 100 + minutes; // e.g. 15:30 -> 1530
      const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat

      // Transition week is before Monday June 22, 2026
      const transitionLimit = new Date("2026-06-22T00:00:00");
      const isTransitionWeek = now < transitionLimit;

      if (isTransitionWeek) {
        // --- TRANSITION WEEK ROUTINE ---
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Weekend during transition
          if (timeVal >= 730 && timeVal < 830) {
            setActiveRoutineBlock({ name: "Despertar & Paseo con Aika 🐶", time: "07:30 AM - 08:30 AM", desc: "Despertar relajado y paseo con Aika." });
          } else if (timeVal >= 830 && timeVal < 1000) {
            setActiveRoutineBlock({ name: "Desayuno Familiar", time: "08:30 AM - 10:00 AM", desc: "Desayuno y convivencia familiar." });
          } else if (timeVal >= 1000 && timeVal < 1300) {
            setActiveRoutineBlock({ name: "Bloque Libre / Ocio / Hogar", time: "10:00 AM - 01:00 PM", desc: "Limpieza del cuarto o proyectos personales divertidos." });
          } else if (timeVal >= 1300 && timeVal < 1600) {
            setActiveRoutineBlock({ name: "Tarde Social / Comida", time: "01:00 PM - 04:00 PM", desc: "Comida y convivencia." });
          } else if (timeVal >= 1600 && timeVal < 1900) {
            setActiveRoutineBlock({ name: "Bloque Creativo Opcional", time: "04:00 PM - 07:00 PM", desc: "Programar, tocar guitarra o ver anime sin presiones." });
          } else if (timeVal >= 1900 && timeVal < 2230) {
            setActiveRoutineBlock({ name: "Ocio Extendido & Videojuegos", time: "07:00 PM - 10:30 PM", desc: "Sesiones de Minecraft o GTA V con amigos." });
          } else if (timeVal >= 2230 && timeVal < 2300) {
            setActiveRoutineBlock({ name: "Desconexión Digital 📵", time: "10:30 PM - 11:00 PM", desc: "Apagar pantallas y prepararse para dormir." });
          } else {
            setActiveRoutineBlock({ name: "Tiempo Libre / Descanso", time: "Fuera de bloques", desc: "Descanso y mantenimiento del ciclo de sueño." });
          }
        } else {
          // Weekday during transition
          if (timeVal >= 730 && timeVal < 745) {
            setActiveRoutineBlock({ name: "Despertar & Activación", time: "07:30 AM - 07:45 AM", desc: "Despertar y tomar agua." });
          } else if (timeVal >= 745 && timeVal < 845) {
            setActiveRoutineBlock({ name: "Paseo con Aika 🐶", time: "07:45 AM - 08:45 AM", desc: "Paseo activo matutino." });
          } else if (timeVal >= 845 && timeVal < 915) {
            setActiveRoutineBlock({ name: "Desayuno & Ducha", time: "08:45 AM - 09:15 AM", desc: "Desayuno ligero y ducha." });
          } else if (timeVal >= 915 && timeVal < 930) {
            setActiveRoutineBlock({ name: "Meditación de Foco", time: "09:15 AM - 09:30 AM", desc: "Preparación mental para el estudio." });
          } else if (timeVal >= 930 && timeVal < 1100) {
            setActiveRoutineBlock({ name: "Bloque de Estudio Matutino", time: "09:30 AM - 11:00 AM", desc: "Estudio de POO sin celular." });
          } else if (timeVal >= 1100 && timeVal < 1330) {
            setActiveRoutineBlock({ name: "Tiempo Libre / Pendientes", time: "11:00 AM - 01:30 PM", desc: "Ayudar a tu papá o pendientes generales." });
          } else if (timeVal >= 1330 && timeVal < 1500) {
            setActiveRoutineBlock({ name: "Comida & Descanso", time: "01:30 PM - 03:00 PM", desc: "Comer y descansar escuchando música." });
          } else if (timeVal >= 1500 && timeVal < 1930) {
            setActiveRoutineBlock({ name: "Deep Work: MoodleSync & ONYX", time: "03:00 PM - 07:30 PM", desc: "Programación enfocada y estado de flow." });
          } else if (timeVal >= 1930 && timeVal < 2130) {
            setActiveRoutineBlock({ name: "Equilibrio Personal", time: "07:30 PM - 09:30 PM", desc: "Guitarra, ajedrez, lectura o meditación." });
          } else if (timeVal >= 2130 && timeVal < 2300) {
            setActiveRoutineBlock({ name: "Ocio & Videojuegos", time: "09:30 PM - 11:00 PM", desc: "Minecraft, GTA V o Free Fire." });
          } else if (timeVal >= 2300 && timeVal < 2330) {
            setActiveRoutineBlock({ name: "Desconexión Digital 📵", time: "11:00 PM - 11:30 PM", desc: "Apagar pantallas y relajación." });
          } else {
            setActiveRoutineBlock({ name: "Tiempo Libre / Descanso", time: "Fuera de bloques", desc: "Mantenimiento del ciclo de sueño." });
          }
        }
      } else {
        // --- REGULAR VACATION WEEK ROUTINE (WITH TEC) ---
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Weekend
          if (timeVal >= 730 && timeVal < 830) {
            setActiveRoutineBlock({ name: "Despertar & Paseo con Aika 🐶", time: "07:30 AM - 08:30 AM", desc: "Despertar relajado y paseo con Aika." });
          } else if (timeVal >= 830 && timeVal < 1000) {
            setActiveRoutineBlock({ name: "Desayuno Familiar", time: "08:30 AM - 10:00 AM", desc: "Desayuno y convivencia familiar." });
          } else if (timeVal >= 1000 && timeVal < 1300) {
            setActiveRoutineBlock({ name: "Bloque Libre / Ocio / Hogar", time: "10:00 AM - 01:00 PM", desc: "Limpieza del cuarto o proyectos personales divertidos." });
          } else if (timeVal >= 1300 && timeVal < 1600) {
            setActiveRoutineBlock({ name: "Tarde Social / Comida", time: "01:00 PM - 04:00 PM", desc: "Comida y convivencia." });
          } else if (timeVal >= 1600 && timeVal < 1900) {
            setActiveRoutineBlock({ name: "Bloque Creativo Opcional", time: "04:00 PM - 07:00 PM", desc: "Programar, tocar guitarra o ver anime sin presiones." });
          } else if (timeVal >= 1900 && timeVal < 2230) {
            setActiveRoutineBlock({ name: "Ocio Extendido & Videojuegos", time: "07:00 PM - 10:30 PM", desc: "Sesiones de Minecraft o GTA V con amigos." });
          } else if (timeVal >= 2230 && timeVal < 2300) {
            setActiveRoutineBlock({ name: "Desconexión Digital 📵", time: "10:30 PM - 11:00 PM", desc: "Apagar pantallas y prepararse para dormir." });
          } else {
            setActiveRoutineBlock({ name: "Tiempo Libre / Descanso", time: "Fuera de bloques", desc: "Descanso y mantenimiento del ciclo de sueño." });
          }
        } else {
          // Weekday
          if (timeVal >= 615 && timeVal < 630) {
            setActiveRoutineBlock({ name: "Despertar & Activación", time: "06:15 AM - 06:30 AM", desc: "Salir de la cama y tomar un vaso de agua." });
          } else if (timeVal >= 630 && timeVal < 730) {
            setActiveRoutineBlock({ name: "Paseo con Aika 🐶", time: "06:30 AM - 07:30 AM", desc: "Caminata activa matutina para recibir luz natural." });
          } else if (timeVal >= 730 && timeVal < 800) {
            setActiveRoutineBlock({ name: "Desayuno & Ducha", time: "07:30 AM - 08:00 AM", desc: "Baño rápido y alimento nutritivo." });
          } else if (timeVal >= 800 && timeVal < 815) {
            setActiveRoutineBlock({ name: "Meditación Matutina", time: "08:00 AM - 08:15 AM", desc: "Mindfulness para limpiar la mente." });
          } else if (timeVal >= 815 && timeVal < 930) {
            setActiveRoutineBlock({ name: "Bloque de Foco: Estudio", time: "08:15 AM - 09:30 AM", desc: "Estudio teórico de POO. Cero distractores." });
          } else if (timeVal >= 930 && timeVal < 1000) {
            setActiveRoutineBlock({ name: "Preparación & Salida", time: "09:30 AM - 10:00 AM", desc: "Alistar mochila y tomar el camión al TEC." });
          } else if (timeVal >= 1030 && timeVal < 1330) {
            setActiveRoutineBlock({ name: "Curso de POO en el TEC 🏫", time: "10:30 AM - 01:30 PM", desc: "Clase en el ITCG. Dominando clases y polimorfismo." });
          } else if (timeVal >= 1330 && timeVal < 1400) {
            setActiveRoutineBlock({ name: "Regreso a Casa", time: "01:30 PM - 02:00 PM", desc: "Traslado de regreso." });
          } else if (timeVal >= 1400 && timeVal < 1530) {
            setActiveRoutineBlock({ name: "Comer & Desconexión", time: "02:00 PM - 03:30 PM", desc: "Almuerzo familiar y descanso escuchando música." });
          } else if (timeVal >= 1530 && timeVal < 2000) {
            setActiveRoutineBlock({ name: "Deep Work (Flow State)", time: "03:30 PM - 08:00 PM", desc: "Desarrollo en MoodleSync / ONYX sin interrupciones." });
          } else if (timeVal >= 2000 && timeVal < 2200) {
            setActiveRoutineBlock({ name: "Equilibrio Personal", time: "08:00 PM - 10:00 PM", desc: "Guitarra, ajedrez, lectura o meditación." });
          } else if (timeVal >= 2200 && timeVal < 2230) {
            setActiveRoutineBlock({ name: "Ocio y Videojuegos", time: "10:00 PM - 10:30 PM", desc: "Minecraft, GTA V o Free Fire sin culpa." });
          } else if (timeVal >= 2230 && timeVal < 2300) {
            setActiveRoutineBlock({ name: "Desconexión Digital 📵", time: "10:30 PM - 11:00 PM", desc: "Apagar pantallas y prepararse para dormir." });
          } else {
            setActiveRoutineBlock({ name: "Tiempo Libre / Descanso", time: "Fuera de bloques", desc: "Mantenimiento del ciclo de sueño o tiempo libre." });
          }
        }
      }
    };

    updateRoutineBlock();
    const interval = setInterval(updateRoutineBlock, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  // Filter habits active today
  const todayDayOfWeek = new Date().getDay(); // 0-6
  const activeHabitsToday = habits.filter(h => h.daysOfWeek.includes(todayDayOfWeek));

  const isCompletedToday = (habitId: string) => {
    return logs.some(l => l.habitId === habitId && l.date === todayStr && l.completed);
  };

  const handleToggleHabit = (habitId: string) => {
    storage.toggleHabitLog(habitId, todayStr);
    const updatedLogs = storage.getLogs();
    setLogs(updatedLogs);
    setStats(storage.getStats());
  };

  const completedTodayCount = activeHabitsToday.filter(h => isCompletedToday(h.id)).length;
  const progressPercent = activeHabitsToday.length > 0 
    ? Math.round((completedTodayCount / activeHabitsToday.length) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            ¡Hola, Juan!
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Hoy es {new Date().toLocaleDateString("es-MX", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
        
        {/* Quick Date Display */}
        <div className="px-4 py-2 bg-card-dark border border-border-dark rounded-xl text-xs font-mono text-primary flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          SISTEMA ONYX ONLINE
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak Metric */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none transition-transform duration-300 group-hover:scale-110">
            <Flame className="h-24 w-24 text-primary" />
          </div>
          <div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Racha Actual</p>
            <h3 className="text-3xl font-black mt-2 text-primary flex items-baseline gap-1">
              {stats.streak} <span className="text-xs font-medium text-text-muted">días</span>
            </h3>
          </div>
          <div className="p-3 bg-primary/10 rounded-2xl text-primary glow-primary">
            <Flame className="h-6 w-6 fill-primary" />
          </div>
        </div>

        {/* Today Completion Metric */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-accent-blue/30 transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none transition-transform duration-300 group-hover:scale-110">
            <CheckCircle2 className="h-24 w-24 text-accent-blue" />
          </div>
          <div className="flex-1 mr-4">
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Progreso de Hoy</p>
            <h3 className="text-3xl font-black mt-2 text-foreground">
              {progressPercent}%
            </h3>
            {/* Progress Bar */}
            <div className="w-full bg-border-dark h-1.5 rounded-full mt-3 overflow-hidden">
              <motion.div 
                className="bg-accent-blue h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue glow-blue">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Month Completion Rate */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none transition-transform duration-300 group-hover:scale-110">
            <TrendingUp className="h-24 w-24 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Tasa Mensual (30d)</p>
            <h3 className="text-3xl font-black mt-2 text-emerald-500">
              {stats.completionRate}%
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Focus Area (Active Routine Block) */}
      {activeRoutineBlock.name && (
        <div className="p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden glow-primary">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold tracking-wider animate-pulse">
                Bloque Activo
              </span>
              <span className="text-xs text-text-muted font-mono">{activeRoutineBlock.time}</span>
            </div>
            <h4 className="text-xl font-bold text-foreground">
              {activeRoutineBlock.name}
            </h4>
            <p className="text-xs text-text-muted md:max-w-xl">
              {activeRoutineBlock.desc}
            </p>
          </div>
          
          {/* Action Trigger */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-card-dark border border-border-dark flex items-center justify-center text-primary">
              <Zap className="h-5 w-5 fill-primary/10 animate-bounce" />
            </div>
            <span className="text-xs font-mono text-text-muted">Estado: Concentración</span>
          </div>
        </div>
      )}

      {/* Habits & Daily Journal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Habits Checklist (Col-Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
              Hábitos de Hoy <span className="text-xs font-mono text-text-muted px-2 py-0.5 rounded-full bg-border-dark">{completedTodayCount}/{activeHabitsToday.length}</span>
            </h3>
            <span className="text-xs text-text-muted">Haz clic para marcar</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activeHabitsToday.length > 0 ? (
                activeHabitsToday.map((habit) => {
                  const completed = isCompletedToday(habit.id);
                  return (
                    <motion.div
                      key={habit.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                        completed 
                          ? "bg-card-dark/40 border-border-dark text-text-muted" 
                          : "bg-card-dark border-border-dark hover:border-primary/40 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon Wrapper */}
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{ 
                            backgroundColor: completed ? "rgba(28, 28, 33, 0.4)" : `${habit.color}15`, 
                            color: completed ? "#9898a6" : habit.color 
                          }}
                        >
                          <IconMapper name={habit.icon} className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <h4 className={`text-sm font-semibold transition-all ${completed ? "line-through text-text-muted" : "text-foreground"}`}>
                            {habit.name}
                          </h4>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                            {habit.description}
                          </p>
                        </div>
                      </div>

                      {/* Check Box */}
                      <div 
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          completed 
                            ? "bg-primary border-primary text-background-dark font-bold" 
                            : "border-border-dark group-hover:border-primary/40"
                        }`}
                      >
                        {completed && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs"
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center border border-dashed border-border-dark rounded-xl text-text-muted">
                  No hay hábitos configurados para hoy.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Journal Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight">Registro de Estado</h3>
          
          <div className="glass-panel p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Bitácora Rápida</h4>
              <p className="text-xs text-text-muted">Mantente al tanto de tu día y tu enfoque en tu diario personal.</p>
            </div>

            <div className="border-t border-border-dark pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                <span>Último Estado de Flow:</span>
                <span className="text-primary flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 fill-primary/10" /> 4/5
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                <span>Reflexión Registrada:</span>
                <span className="text-emerald-500">Completada</span>
              </div>
            </div>

            <Link 
              href="/journal"
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary-hover transition-all duration-200"
            >
              Registrar Día Hoy <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
