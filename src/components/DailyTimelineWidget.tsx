"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ScheduleBlock, getLocalDateString } from "@/lib/storage";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MapPin,
  GraduationCap,
  Coffee,
  Dumbbell,
  BookOpen,
  X,
  Clock,
  Zap,
  Calendar as CalendarIcon,
  Columns3,
  Sparkles,
  LayoutGrid,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────
const HOURS_START = 6;
const HOURS_END = 23;
const HOUR_HEIGHT_DAY = 76; // taller for comfortable reading in day view
const HOUR_HEIGHT_WEEK = 60; // compact for 7-day grid view
const TOTAL_HOURS = HOURS_END - HOURS_START;

const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const CATEGORY_CONFIG = {
  class:    { icon: GraduationCap, label: "Clase",    emoji: "🎓", bg: "rgba(124, 110, 246, 0.12)", text: "#7C6EF6" },
  routine:  { icon: Coffee,        label: "Rutina",   emoji: "☕", bg: "rgba(74, 222, 128, 0.12)",  text: "#4ADE80" },
  personal: { icon: Dumbbell,      label: "Personal", emoji: "⚡", bg: "rgba(34, 211, 238, 0.12)",  text: "#22D3EE" },
  study:    { icon: BookOpen,       label: "Estudio",  emoji: "📚", bg: "rgba(251, 146, 60, 0.12)",  text: "#FB923C" },
} as const;

const BLOCK_COLORS = [
  { value: "#7C6EF6", label: "Violeta" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#4ADE80", label: "Verde" },
  { value: "#10B981", label: "Esmeralda" },
  { value: "#F59E0B", label: "Ámbar" },
  { value: "#FB923C", label: "Naranja" },
  { value: "#F97316", label: "Naranja fuerte" },
  { value: "#F43F5E", label: "Rosa" },
  { value: "#E879F9", label: "Fucsia" },
  { value: "#A78BFA", label: "Lavanda" },
  { value: "#22D3EE", label: "Cyan claro" },
];

const CATEGORY_OPTIONS: { value: ScheduleBlock["category"]; label: string }[] = [
  { value: "class",    label: "🎓 Clase TEC" },
  { value: "study",    label: "📚 Estudio / Tareas" },
  { value: "routine",  label: "☕ Rutina / Comida" },
  { value: "personal", label: "⚡ Personal / Gym" },
];

const DAY_OPTIONS = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "X" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function minutesToDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Main Component ──────────────────────────────────────────
export default function DailyTimelineWidget() {
  const todayStr = getLocalDateString();
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dayBlocks, setDayBlocks] = useState<ScheduleBlock[]>([]);
  const [allBlocks, setAllBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  const timelineRef = useRef<HTMLDivElement>(null);
  const weekTimelineRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:30");
  const [formColor, setFormColor] = useState("#7C6EF6");
  const [formCategory, setFormCategory] = useState<ScheduleBlock["category"]>("class");
  const [formDays, setFormDays] = useState<number[]>([]);
  const [formIsRecurring, setFormIsRecurring] = useState(true);

  // Real-time clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch blocks for single day & all week
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [dayRes, allRes] = await Promise.all([
        fetch(`/api/schedule?date=${selectedDate}`),
        fetch("/api/schedule?all=true"),
      ]);
      if (dayRes.ok) setDayBlocks(await dayRes.json());
      if (allRes.ok) setAllBlocks(await allRes.json());
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-scroll timeline to current time
  useEffect(() => {
    if (selectedDate === todayStr && !loading) {
      const nowOffset = ((currentTimeMinutes / 60) - HOURS_START) * (viewMode === "day" ? HOUR_HEIGHT_DAY : HOUR_HEIGHT_WEEK);
      const targetRef = viewMode === "day" ? timelineRef.current : weekTimelineRef.current;
      if (targetRef) {
        targetRef.scrollTo({ top: Math.max(0, nowOffset - 150), behavior: "smooth" });
      }
    }
  }, [loading, selectedDate, todayStr, currentTimeMinutes, viewMode]);

  // ── Week navigation helpers ──
  const weekDays = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7)); // Move to Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(day);
      days.push({
        dateStr,
        dayNum: day.getDate(),
        dayName: DAYS_SHORT[day.getDay()],
        dayFullName: DAYS_ES[day.getDay()],
        dayOfWeek: day.getDay(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [selectedDate, todayStr]);

  const navigateWeek = (dir: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(getLocalDateString(d));
  };

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(getLocalDateString(d));
  };

  // ── Stats calculation ──
  const stats = useMemo(() => {
    let classMinutes = 0;
    let studyMinutes = 0;
    let routineMinutes = 0;
    let personalMinutes = 0;

    dayBlocks.forEach((b) => {
      const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
      if (b.category === "class") classMinutes += dur;
      else if (b.category === "study") studyMinutes += dur;
      else if (b.category === "routine") routineMinutes += dur;
      else personalMinutes += dur;
    });

    const totalMinutes = classMinutes + studyMinutes + routineMinutes + personalMinutes;

    return {
      classMinutes,
      studyMinutes,
      routineMinutes,
      personalMinutes,
      totalMinutes,
      totalBlocks: dayBlocks.length,
    };
  }, [dayBlocks]);

  // ── Current and Next Block ──
  const { currentBlock, nextBlock } = useMemo(() => {
    if (selectedDate !== todayStr) return { currentBlock: null, nextBlock: null };
    const sorted = [...dayBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let current: ScheduleBlock | null = null;
    let next: ScheduleBlock | null = null;

    for (const b of sorted) {
      const start = timeToMinutes(b.startTime);
      const end = timeToMinutes(b.endTime);
      if (currentTimeMinutes >= start && currentTimeMinutes < end) current = b;
      if (currentTimeMinutes < start && !next) next = b;
    }
    return { currentBlock: current, nextBlock: next };
  }, [dayBlocks, currentTimeMinutes, selectedDate, todayStr]);

  // ── Day Progress ──
  const dayProgress = useMemo(() => {
    if (selectedDate !== todayStr || dayBlocks.length === 0) return 0;
    const firstStart = Math.min(...dayBlocks.map((b) => timeToMinutes(b.startTime)));
    const lastEnd = Math.max(...dayBlocks.map((b) => timeToMinutes(b.endTime)));
    const total = lastEnd - firstStart;
    if (total <= 0) return 0;
    const elapsed = currentTimeMinutes - firstStart;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }, [dayBlocks, currentTimeMinutes, selectedDate, todayStr]);

  // ── Filter blocks by day for week view ──
  const getBlocksForDay = useCallback((dayOfWeek: number, dateStr: string) => {
    return allBlocks.filter((b) => {
      if (b.specificDate) return b.specificDate === dateStr;
      return b.daysOfWeek.includes(dayOfWeek);
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allBlocks]);

  // ── Edit & Form handlers ──
  const handleStartEdit = (block: ScheduleBlock, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingBlockId(block.id);
    setFormTitle(block.title);
    setFormLocation(block.location || "");
    setFormStartTime(block.startTime);
    setFormEndTime(block.endTime);
    setFormColor(block.color);
    setFormCategory(block.category);
    const isRec = block.daysOfWeek && block.daysOfWeek.length > 0;
    setFormIsRecurring(isRec);
    setFormDays(block.daysOfWeek || []);
    setShowForm(true);
  };

  const handleOpenNewForm = () => {
    setEditingBlockId(null);
    setFormTitle("");
    setFormLocation("");
    setFormStartTime("09:00");
    setFormEndTime("10:30");
    setFormColor("#7C6EF6");
    setFormCategory("class");
    setFormDays([]);
    setFormIsRecurring(true);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBlockId(null);
    setFormTitle("");
    setFormLocation("");
  };

  const handleSaveBlock = async () => {
    if (!formTitle.trim()) return;

    if (editingBlockId) {
      // ── Update existing block ──
      const updatedData = {
        id: editingBlockId,
        title: formTitle.trim(),
        location: formLocation || undefined,
        startTime: formStartTime,
        endTime: formEndTime,
        color: formColor,
        category: formCategory,
        daysOfWeek: formIsRecurring ? formDays : [],
        specificDate: formIsRecurring ? undefined : selectedDate,
      };

      setDayBlocks((prev) =>
        prev
          .map((b) => (b.id === editingBlockId ? { ...b, ...updatedData } : b))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
      );
      setAllBlocks((prev) =>
        prev.map((b) => (b.id === editingBlockId ? { ...b, ...updatedData } : b))
      );

      handleCloseForm();

      try {
        const res = await fetch("/api/schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBlockId,
            title: updatedData.title,
            location: updatedData.location || null,
            startTime: formStartTime,
            endTime: formEndTime,
            color: formColor,
            category: formCategory,
            daysOfWeek: formIsRecurring ? formDays : [],
            specificDate: formIsRecurring ? null : selectedDate,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          setDayBlocks((prev) => prev.map((b) => (b.id === editingBlockId ? saved : b)));
          setAllBlocks((prev) => prev.map((b) => (b.id === editingBlockId ? saved : b)));
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // ── Create new block ──
      const newBlock: ScheduleBlock = {
        id: "temp-" + Date.now(),
        title: formTitle.trim(),
        location: formLocation || undefined,
        startTime: formStartTime,
        endTime: formEndTime,
        color: formColor,
        category: formCategory,
        daysOfWeek: formIsRecurring ? formDays : [],
        specificDate: formIsRecurring ? undefined : selectedDate,
        createdAt: new Date().toISOString(),
      };

      setDayBlocks((prev) => [...prev, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setAllBlocks((prev) => [...prev, newBlock]);
      handleCloseForm();

      try {
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newBlock.title,
            location: newBlock.location || null,
            startTime: formStartTime,
            endTime: formEndTime,
            color: formColor,
            category: formCategory,
            daysOfWeek: formIsRecurring ? formDays : [],
            specificDate: formIsRecurring ? null : selectedDate,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          setDayBlocks((prev) => prev.map((b) => (b.id === newBlock.id ? saved : b)));
          setAllBlocks((prev) => prev.map((b) => (b.id === newBlock.id ? saved : b)));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteBlock = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDayBlocks((prev) => prev.filter((b) => b.id !== id));
    setAllBlocks((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = (day: number) => {
    setFormDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const isToday = selectedDate === todayStr;
  const currentHourInRange = currentTimeMinutes / 60 >= HOURS_START && currentTimeMinutes / 60 <= HOURS_END;
  const nowLineTopDay = ((currentTimeMinutes / 60) - HOURS_START) * HOUR_HEIGHT_DAY;
  const nowLineTopWeek = ((currentTimeMinutes / 60) - HOURS_START) * HOUR_HEIGHT_WEEK;

  const selectedDayName = DAYS_ES[new Date(selectedDate + "T12:00:00").getDay()];
  const selectedDateFormatted = new Date(selectedDate + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5 w-full">
      {/* ── Top Bar: Title & View Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-dark/40 border border-border-dark/40 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {viewMode === "day" ? (
                <span className="capitalize">{selectedDayName}, {selectedDateFormatted}</span>
              ) : (
                <span>Horario Semanal TEC</span>
              )}
            </h2>
            <p className="text-xs text-text-muted">
              {viewMode === "day"
                ? `${dayBlocks.length} actividades programadas`
                : "Vista completa de Lunes a Domingo"}
            </p>
          </div>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Switcher */}
          <div className="flex items-center bg-card-dark border border-border-dark/60 rounded-xl p-1">
            <button
              onClick={() => setViewMode("day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === "day"
                  ? "bg-primary/20 text-foreground shadow-sm"
                  : "text-text-muted hover:text-foreground/80"
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Día</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === "week"
                  ? "bg-primary/20 text-foreground shadow-sm"
                  : "text-text-muted hover:text-foreground/80"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
          </div>

          {/* Add Block Button */}
          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Bloque</span>
          </button>
        </div>
      </div>

      {/* ── Add/Edit Block Modal / Inline Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card-dark rounded-2xl p-5 space-y-4 border border-border-dark/60 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingBlockId ? (
                    <Pencil className="w-4 h-4 text-primary" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingBlockId ? "Editar bloque de horario" : "Crear nuevo bloque de horario"}
                  </h3>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-1.5 text-text-muted hover:text-foreground rounded-lg transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nombre de la materia o actividad..."
                  className="bg-card-hover border border-border-dark/60 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none transition placeholder:text-text-muted/50"
                  autoFocus
                />
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ubicación o salón (ej: Salón A3-201, Edif B)"
                  className="bg-card-hover border border-border-dark/60 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none transition placeholder:text-text-muted/50"
                />
              </div>

              {/* Time Pickers & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-muted">Hora de Inicio</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-card-hover border border-border-dark/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-muted">Hora de Fin</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-card-hover border border-border-dark/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-muted">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ScheduleBlock["category"])}
                    className="w-full bg-card-hover border border-border-dark/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-card-dark">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring vs Single Date */}
              <div className="space-y-2 pt-1 border-t border-border-dark/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted">Frecuencia:</span>
                  <button
                    onClick={() => setFormIsRecurring(true)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      formIsRecurring ? "bg-primary/20 text-foreground" : "text-text-muted hover:text-foreground/70"
                    }`}
                  >
                    🔄 Semanal recurrente
                  </button>
                  <button
                    onClick={() => setFormIsRecurring(false)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      !formIsRecurring ? "bg-primary/20 text-foreground" : "text-text-muted hover:text-foreground/70"
                    }`}
                  >
                    📌 Solo este día ({selectedDate})
                  </button>
                </div>

                {formIsRecurring && (
                  <div className="flex gap-2 items-center flex-wrap pt-1">
                    <span className="text-xs text-text-muted/70 mr-1">Días:</span>
                    {DAY_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => toggleDay(d.value)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                          formDays.includes(d.value)
                            ? "bg-primary/25 text-foreground border border-primary/40"
                            : "text-text-muted bg-card-hover hover:bg-border-dark/60"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-text-muted mr-1">Color:</span>
                {BLOCK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFormColor(c.value)}
                    className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                      formColor === c.value
                        ? "ring-2 ring-offset-2 ring-offset-card-dark scale-110"
                        : "opacity-40 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-text-muted hover:text-foreground text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBlock}
                  className="px-5 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {editingBlockId ? "Guardar cambios" : "Guardar bloque"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          VISTA 1: DÍA (EXPANDIDA CON 2 COLUMNAS EN DESKTOP)
         ══════════════════════════════════════════════════════════ */}
      {viewMode === "day" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* ── LEFT COLUMN: MAIN TIMELINE (8 cols) ── */}
          <div className="lg:col-span-8 space-y-4">
            {/* Week day pills bar */}
            <div className="flex items-center gap-1.5 bg-card-dark/40 border border-border-dark/40 rounded-2xl p-2">
              <button
                onClick={() => navigateDay(-1)}
                className="p-2 text-text-muted hover:text-foreground rounded-xl transition cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex-1 grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const isSelected = day.dateStr === selectedDate;
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`flex flex-col items-center py-2.5 rounded-xl text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/20 text-foreground ring-1 ring-primary/30 shadow-sm"
                          : day.isToday
                            ? "bg-card-dark text-foreground border border-border-dark/50"
                            : "text-text-muted hover:bg-card-dark/60"
                      }`}
                    >
                      <span className="text-[11px] font-medium opacity-60 uppercase">{day.dayName}</span>
                      <span className={`text-sm font-bold mt-0.5 ${day.isToday && !isSelected ? "text-primary" : ""}`}>
                        {day.dayNum}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => navigateDay(1)}
                className="p-2 text-text-muted hover:text-foreground rounded-xl transition cursor-pointer flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Timeline Stream */}
            {loading ? (
              <div className="py-24 text-center text-text-muted text-xs font-mono">Cargando cronograma...</div>
            ) : (
              <div
                ref={timelineRef}
                className="relative overflow-y-auto rounded-2xl bg-card-dark/30 border border-border-dark/40 p-2 sm:p-4 shadow-inner"
                style={{ height: "min(680px, 75vh)" }}
              >
                <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT_DAY }}>
                  {/* Grid Lines */}
                  {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                    const hour = HOURS_START + i;
                    return (
                      <React.Fragment key={hour}>
                        {/* Hour marker */}
                        <div
                          className="absolute left-0 right-0 flex items-start"
                          style={{ top: i * HOUR_HEIGHT_DAY }}
                        >
                          <span className="w-12 sm:w-14 text-[11px] font-mono text-text-muted/50 text-right pr-3 -mt-2 flex-shrink-0 select-none font-semibold">
                            {hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`}
                          </span>
                          <div className="flex-1 border-t border-border-dark/30" />
                        </div>
                        {/* Half hour dotted */}
                        {i < TOTAL_HOURS && (
                          <div
                            className="absolute left-12 sm:left-14 right-0"
                            style={{ top: i * HOUR_HEIGHT_DAY + HOUR_HEIGHT_DAY / 2 }}
                          >
                            <div className="border-t border-dotted border-border-dark/15" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Laser NOW indicator */}
                  {isToday && currentHourInRange && (
                    <div
                      className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                      style={{ top: nowLineTopDay }}
                    >
                      <div className="w-12 sm:w-14 flex justify-end pr-1.5">
                        <span className="text-[9px] font-bold text-accent-rose bg-accent-rose/15 border border-accent-rose/30 px-1.5 py-0.5 rounded font-mono shadow-sm">
                          {String(Math.floor(currentTimeMinutes / 60)).padStart(2, "0")}:{String(currentTimeMinutes % 60).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <div className="w-3 h-3 rounded-full bg-accent-rose -ml-1.5 shadow-lg shadow-accent-rose/50 relative z-10" />
                        <div className="absolute top-1/2 left-1 right-0 h-[2px] bg-gradient-to-r from-accent-rose via-accent-rose/70 to-transparent -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {/* Blocks */}
                  {dayBlocks.map((block) => {
                    const startMin = timeToMinutes(block.startTime);
                    const endMin = timeToMinutes(block.endTime);
                    const durationMin = endMin - startMin;
                    const topPx = ((startMin / 60) - HOURS_START) * HOUR_HEIGHT_DAY;
                    const heightPx = Math.max(32, (durationMin / 60) * HOUR_HEIGHT_DAY);
                    const isActive = isToday && currentTimeMinutes >= startMin && currentTimeMinutes < endMin;
                    const isPast = isToday && currentTimeMinutes >= endMin;
                    const isCompact = heightPx < 52;
                    const CategoryIcon = CATEGORY_CONFIG[block.category]?.icon || GraduationCap;

                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: isPast ? 0.45 : 1, x: 0 }}
                        className={`absolute left-14 sm:left-16 right-2 sm:right-4 z-10 group rounded-xl overflow-hidden transition-all duration-200 ${
                          isActive
                            ? "shadow-2xl ring-1 ring-offset-1 ring-offset-background-dark z-20"
                            : "hover:shadow-md"
                        }`}
                        style={{
                          top: topPx + 1,
                          height: heightPx - 2,
                          background: isActive
                            ? `linear-gradient(135deg, ${block.color}25, ${block.color}10)`
                            : `linear-gradient(135deg, ${block.color}15, ${block.color}08)`,
                          borderLeft: `4px solid ${block.color}`,
                          borderColor: isActive ? block.color : undefined,
                        }}
                      >
                        {isCompact ? (
                          /* Compact view for ≤ 30min blocks */
                          <div className="flex items-center justify-between px-3 h-full gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isActive && (
                                <span
                                  className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                                  style={{ backgroundColor: block.color }}
                                />
                              )}
                              <span
                                className="text-xs font-bold truncate"
                                style={{ color: `${block.color}${isPast ? "99" : "ff"}` }}
                              >
                                {block.title}
                              </span>
                              <span className="text-[10px] text-text-muted/60 font-mono">
                                {formatTime12h(block.startTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded mr-0.5"
                                style={{ backgroundColor: `${block.color}20`, color: block.color }}
                              >
                                {minutesToDuration(durationMin)}
                              </span>
                              <button
                                onClick={(e) => handleStartEdit(block, e)}
                                title="Editar bloque"
                                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-primary transition cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteBlock(block.id, e)}
                                title="Eliminar bloque"
                                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Expanded rich view for > 30min blocks */
                          <div className="flex flex-col justify-between h-full p-3 sm:p-3.5">
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isActive && (
                                    <span
                                      className="w-2 h-2 rounded-full animate-pulse flex-shrink-0 shadow-lg"
                                      style={{ backgroundColor: block.color }}
                                    />
                                  )}
                                  <h4
                                    className="text-sm font-bold truncate tracking-tight"
                                    style={{ color: `${block.color}${isPast ? "aa" : "ff"}` }}
                                  >
                                    {block.title}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => handleStartEdit(block, e)}
                                    title="Editar bloque"
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-primary transition cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteBlock(block.id, e)}
                                    title="Eliminar bloque"
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-text-muted/80 font-mono font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 opacity-60" />
                                  {formatTime12h(block.startTime)} — {formatTime12h(block.endTime)}
                                </span>
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${block.color}20`, color: block.color }}
                                >
                                  {minutesToDuration(durationMin)}
                                </span>
                              </div>
                            </div>

                            {block.location && heightPx > 70 && (
                              <p className="text-[11px] text-text-muted/60 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 opacity-70" />
                                <span>{block.location}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Empty state */}
                  {dayBlocks.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2 p-8 bg-card-dark/40 rounded-2xl border border-border-dark/40">
                        <p className="text-4xl">📅</p>
                        <p className="text-sm font-medium text-foreground">
                          Sin actividades para {selectedDayName.toLowerCase()}
                        </p>
                        <p className="text-xs text-text-muted">
                          Toca &quot;Nuevo Bloque&quot; arriba para planificar este día.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: DAY COMMAND CENTER / STATS (4 cols) ── */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live Active Card */}
            {isToday && (currentBlock || nextBlock) && (
              <div
                className="rounded-2xl border p-4 space-y-3 relative overflow-hidden backdrop-blur-sm shadow-xl"
                style={{
                  backgroundColor: currentBlock ? `${currentBlock.color}0D` : `${nextBlock!.color}0A`,
                  borderColor: currentBlock ? `${currentBlock.color}35` : `${nextBlock!.color}25`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: (currentBlock || nextBlock)!.color }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ backgroundColor: (currentBlock || nextBlock)!.color }}
                      />
                    </span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: (currentBlock || nextBlock)!.color }}
                    >
                      {currentBlock ? "Actividad en Curso" : "Siguiente Actividad"}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-text-muted">
                    {currentBlock
                      ? `${minutesToDuration(timeToMinutes(currentBlock.endTime) - currentTimeMinutes)} rest.`
                      : `en ${minutesToDuration(timeToMinutes(nextBlock!.startTime) - currentTimeMinutes)}`}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {(currentBlock || nextBlock)!.title}
                  </h3>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    {formatTime12h((currentBlock || nextBlock)!.startTime)} — {formatTime12h((currentBlock || nextBlock)!.endTime)}
                  </p>
                </div>

                {currentBlock && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-text-muted font-mono">
                      <span>Progreso</span>
                      <span>
                        {Math.round(
                          ((currentTimeMinutes - timeToMinutes(currentBlock.startTime)) /
                            (timeToMinutes(currentBlock.endTime) - timeToMinutes(currentBlock.startTime))) *
                            100
                        )}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-border-dark/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: currentBlock.color }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.round(
                            ((currentTimeMinutes - timeToMinutes(currentBlock.startTime)) /
                              (timeToMinutes(currentBlock.endTime) - timeToMinutes(currentBlock.startTime))) *
                              100
                          )}%`,
                        }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Time Distribution Summary */}
            <div className="bg-card-dark/40 border border-border-dark/40 rounded-2xl p-4 space-y-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Desglose del Día
                </h3>
                <span className="text-xs font-mono text-foreground font-semibold">
                  {minutesToDuration(stats.totalMinutes)} total
                </span>
              </div>

              {/* Progress items */}
              <div className="space-y-2.5">
                {[
                  { label: "Clases TEC", mins: stats.classMinutes, color: "#7C6EF6", emoji: "🎓" },
                  { label: "Estudio & Tareas", mins: stats.studyMinutes, color: "#FB923C", emoji: "📚" },
                  { label: "Rutina & Comidas", mins: stats.routineMinutes, color: "#4ADE80", emoji: "☕" },
                  { label: "Personal & Gym", mins: stats.personalMinutes, color: "#22D3EE", emoji: "⚡" },
                ].map((item) => {
                  const pct = stats.totalMinutes > 0 ? Math.round((item.mins / stats.totalMinutes) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-foreground/80 font-medium">
                          <span>{item.emoji}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="font-mono text-text-muted">{minutesToDuration(item.mins)} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-card-dark rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Classes quick list for today */}
            <div className="bg-card-dark/40 border border-border-dark/40 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>Materias de Hoy</span>
                </h3>
                <span className="text-[11px] text-text-muted">
                  {dayBlocks.filter((b) => b.category === "class").length} clases
                </span>
              </div>

              <div className="space-y-2">
                {dayBlocks.filter((b) => b.category === "class").length > 0 ? (
                  dayBlocks
                    .filter((b) => b.category === "class")
                    .map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => handleStartEdit(cls)}
                        className="group flex items-center justify-between p-2.5 rounded-xl border border-border-dark/30 hover:border-primary/40 transition cursor-pointer"
                        style={{ backgroundColor: `${cls.color}08` }}
                        title="Clic para editar esta clase"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                          <span className="text-xs font-semibold text-foreground/90 truncate">{cls.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-[10px] text-text-muted font-mono font-medium">
                            {cls.startTime} - {cls.endTime}
                          </span>
                          <Pencil className="w-3 h-3 text-text-muted/40 group-hover:text-primary transition" />
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-text-muted/60 py-2 text-center">No hay clases programadas hoy.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VISTA 2: SEMANAL (7 COLUMNAS PARALELAS ESTILO HORARIO TEC)
         ══════════════════════════════════════════════════════════ */}
      {viewMode === "week" && (
        <div className="space-y-3 w-full">
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between bg-card-dark/40 border border-border-dark/40 rounded-2xl px-4 py-2.5">
            <button
              onClick={() => navigateWeek(-1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-foreground rounded-xl transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Semana Anterior</span>
            </button>
            <span className="text-xs font-semibold text-foreground">
              {weekDays[0].dayFullName} {weekDays[0].dayNum} — {weekDays[6].dayFullName} {weekDays[6].dayNum}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-foreground rounded-xl transition cursor-pointer"
            >
              <span>Semana Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 7-Day Grid Container with Horizontal Scroll on mobile */}
          <div className="overflow-x-auto rounded-2xl border border-border-dark/40 bg-card-dark/30 shadow-inner">
            <div
              ref={weekTimelineRef}
              className="min-w-[760px] overflow-y-auto"
              style={{ height: "min(680px, 75vh)" }}
            >
              {/* Day Headers (Sticky) */}
              <div className="sticky top-0 z-30 grid grid-cols-8 border-b border-border-dark/60 bg-background-dark/95 backdrop-blur-md">
                <div className="py-3 text-center text-[11px] font-bold text-text-muted/50 border-r border-border-dark/40">
                  Hora
                </div>
                {weekDays.map((day) => {
                  const isDaySelected = day.dateStr === selectedDate;
                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setViewMode("day");
                      }}
                      className={`py-2.5 text-center cursor-pointer transition border-r border-border-dark/40 last:border-r-0 ${
                        day.isToday ? "bg-primary/10 text-primary font-bold" : "hover:bg-card-hover"
                      }`}
                    >
                      <p className="text-[10px] uppercase font-semibold text-text-muted">{day.dayName}</p>
                      <p className={`text-sm font-bold ${day.isToday ? "text-primary" : "text-foreground"}`}>
                        {day.dayNum}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time grid body */}
              <div className="relative grid grid-cols-8" style={{ height: TOTAL_HOURS * HOUR_HEIGHT_WEEK }}>
                {/* Time Axis (Col 1) */}
                <div className="border-r border-border-dark/40 relative">
                  {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                    const hour = HOURS_START + i;
                    return (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 text-right pr-2 text-[10px] font-mono text-text-muted/50 -mt-2 select-none"
                        style={{ top: i * HOUR_HEIGHT_WEEK }}
                      >
                        {hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`}
                      </div>
                    );
                  })}
                </div>

                {/* 7 Days Columns (Cols 2-8) */}
                {weekDays.map((day, colIdx) => {
                  const dayBlocksList = getBlocksForDay(day.dayOfWeek, day.dateStr);
                  const isCurrentDay = day.isToday;

                  return (
                    <div
                      key={day.dateStr}
                      className={`relative border-r border-border-dark/30 last:border-r-0 ${
                        isCurrentDay ? "bg-primary/[0.02]" : ""
                      }`}
                    >
                      {/* Hour grid lines */}
                      {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-t border-border-dark/15 pointer-events-none"
                          style={{ top: i * HOUR_HEIGHT_WEEK }}
                        />
                      ))}

                      {/* NOW line on today's column */}
                      {isCurrentDay && currentHourInRange && (
                        <div
                          className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                          style={{ top: nowLineTopWeek }}
                        >
                          <div className="w-2 h-2 rounded-full bg-accent-rose -ml-1 shadow-md shadow-accent-rose" />
                          <div className="flex-1 h-[2px] bg-accent-rose" />
                        </div>
                      )}

                      {/* Blocks for this day */}
                      {dayBlocksList.map((block) => {
                        const startMin = timeToMinutes(block.startTime);
                        const endMin = timeToMinutes(block.endTime);
                        const topPx = ((startMin / 60) - HOURS_START) * HOUR_HEIGHT_WEEK;
                        const heightPx = Math.max(22, ((endMin - startMin) / 60) * HOUR_HEIGHT_WEEK);
                        const isBlockActive = isCurrentDay && currentTimeMinutes >= startMin && currentTimeMinutes < endMin;

                        return (
                          <div
                            key={block.id}
                            onClick={() => handleStartEdit(block)}
                            className={`absolute left-1 right-1 z-10 rounded-lg p-1.5 cursor-pointer transition-all overflow-hidden border-l-2 ${
                              isBlockActive ? "ring-1 shadow-lg" : "hover:brightness-125 hover:z-20"
                            }`}
                            style={{
                              top: topPx + 1,
                              height: heightPx - 2,
                              backgroundColor: `${block.color}22`,
                              borderLeftColor: block.color,
                              borderColor: isBlockActive ? block.color : undefined,
                            }}
                            title={`${block.title} (${block.startTime} - ${block.endTime}) — Clic para editar`}
                          >
                            <p
                              className="text-[10px] font-bold leading-tight truncate"
                              style={{ color: block.color }}
                            >
                              {block.title}
                            </p>
                            {heightPx >= 40 && (
                              <p className="text-[9px] text-text-muted/80 font-mono mt-0.5 truncate">
                                {block.startTime}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
