"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CalendarEvent, SobrietyCounter, getLocalDateString } from "@/lib/storage";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_COLORS = [
  { value: "#8B9FCA", label: "Azul" },
  { value: "#4ADE80", label: "Verde" },
  { value: "#FB923C", label: "Naranja" },
  { value: "#F43F5E", label: "Rosa" },
  { value: "#A78BFA", label: "Violeta" },
  { value: "#38BDF8", label: "Cyan" },
];

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T12:00:00");
  const d2 = new Date(dateStr2 + "T12:00:00");
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CalendarWidget() {
  const todayStr = getLocalDateString();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [trackers, setTrackers] = useState<SobrietyCounter[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formColor, setFormColor] = useState("#8B9FCA");
  const [formDescription, setFormDescription] = useState("");

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, sobrietyRes] = await Promise.all([
        fetch(`/api/events?month=${monthKey}`),
        fetch("/api/sobriety"),
      ]);
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (sobrietyRes.ok) setTrackers(await sobrietyRes.json());
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
  };

  const handleAddEvent = async () => {
    if (!formTitle.trim() || !selectedDate) return;
    const newEvent: CalendarEvent = {
      id: "temp-" + Date.now(),
      title: formTitle.trim(),
      description: formDescription || undefined,
      date: selectedDate,
      time: formTime || undefined,
      color: formColor,
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    setFormTitle(""); setFormTime(""); setFormDescription(""); setShowForm(false);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newEvent.title, description: newEvent.description, date: selectedDate, time: newEvent.time, color: formColor }),
      });
      if (res.ok) {
        const saved = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? saved : e)));
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try { await fetch(`/api/events?id=${id}`, { method: "DELETE" }); }
    catch (err) { console.error(err); }
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getDayDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Check if day has events
  const dayHasEvents = (day: number) => events.some((e) => e.date === getDayDateStr(day));

  // Check if day is a sobriety reset date
  const getDaySobrietyMarkers = (day: number) => {
    const dateStr = getDayDateStr(day);
    return trackers.filter((t) => t.lastResetDate === dateStr);
  };

  // Events + sobriety info for selected date
  const selectedEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];
  const selectedSobrietyInfo = selectedDate
    ? trackers.map((t) => {
        const daysClean = daysBetween(t.lastResetDate, selectedDate);
        return { ...t, daysClean: Math.max(0, daysClean) };
      }).filter((t) => t.daysClean >= 0 && selectedDate >= t.lastResetDate)
    : [];

  // Sobriety banner — summary of active trackers
  const sobrietyBanner = trackers.length > 0
    ? trackers.map((t) => {
        const daysClean = daysBetween(t.lastResetDate, todayStr);
        const totalDays = daysBetween(t.lastResetDate, t.targetDate);
        const pct = totalDays > 0 ? Math.min(100, Math.round((daysClean / totalDays) * 100)) : 0;
        return { ...t, daysClean, pct };
      })
    : [];

  return (
    <div className="space-y-5">
      {/* Sobriety Banner */}
      {sobrietyBanner.length > 0 && (
        <div className="bg-card-dark/50 rounded-xl p-3 space-y-2 border border-border-dark/30">
          <div className="flex items-center gap-2 text-[11px] font-medium text-text-muted">
            <Shield className="h-3.5 w-3.5 text-accent-green" />
            <span>Contadores de sobriedad</span>
          </div>
          {sobrietyBanner.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className="text-sm">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/80 font-medium truncate">{t.name}</span>
                  <span className="text-accent-green font-semibold">{t.daysClean}d</span>
                </div>
                <div className="w-full h-1 bg-border-dark rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${t.pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-text-muted/50">{t.pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)}
          className="p-2 text-text-muted hover:text-foreground hover:bg-card-dark rounded-lg transition cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium text-foreground">
          {MONTHS_ES[currentMonth]} {currentYear}
        </h2>
        <button onClick={() => navigateMonth(1)}
          className="p-2 text-text-muted hover:text-foreground hover:bg-card-dark rounded-lg transition cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card-dark/50 rounded-xl p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_ES.map((day) => (
            <div key={day} className="text-center text-[10px] font-medium text-text-muted/60 py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
            const dateStr = getDayDateStr(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasEvents = dayHasEvents(day);
            const sobrietyMarkers = getDaySobrietyMarkers(day);

            return (
              <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-primary/20 text-foreground border border-primary/30"
                    : isToday
                      ? "bg-primary/10 text-foreground font-semibold"
                      : "text-foreground/70 hover:bg-card-hover"
                }`}>
                {day}
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {hasEvents && <span className="w-1 h-1 rounded-full bg-accent-amber" />}
                  {sobrietyMarkers.length > 0 && <span className="w-1 h-1 rounded-full bg-accent-rose" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div key={selectedDate}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-foreground/80 capitalize">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <button onClick={() => setShowForm(!showForm)}
                className="p-1.5 text-text-muted hover:text-foreground hover:bg-card-dark rounded-lg transition cursor-pointer">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Sobriety status for selected day */}
            {selectedSobrietyInfo.length > 0 && (
              <div className="space-y-1.5">
                {selectedSobrietyInfo.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-accent-green/5 rounded-lg border border-accent-green/10">
                    <span className="text-sm">{t.icon}</span>
                    <span className="text-[12px] text-accent-green/80 font-medium">{t.name}</span>
                    <span className="text-[11px] text-text-muted ml-auto">
                      {t.daysClean} día{t.daysClean !== 1 ? "s" : ""} limpio
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Event Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="bg-card-dark rounded-xl p-4 space-y-3 border border-border-dark/50">
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                      placeholder="Título del evento..." autoFocus
                      className="w-full bg-transparent border border-border-dark/50 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/30 focus:outline-none transition placeholder:text-text-muted/50" />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)}
                          className="flex-1 bg-transparent border border-border-dark/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-primary/30 focus:outline-none transition" />
                      </div>
                    </div>
                    <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Descripción (opcional)"
                      className="w-full bg-transparent border border-border-dark/50 rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary/30 focus:outline-none transition placeholder:text-text-muted/50" />
                    <div className="flex items-center gap-2">
                      {EVENT_COLORS.map((c) => (
                        <button key={c.value} onClick={() => setFormColor(c.value)}
                          className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                            formColor === c.value ? "ring-2 ring-offset-1 ring-offset-card-dark scale-110" : "opacity-60 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c.value, ...(formColor === c.value ? { ringColor: c.value } : {}) }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddEvent}
                        className="flex-1 py-2 bg-primary/15 text-primary text-xs font-medium rounded-lg hover:bg-primary/25 transition cursor-pointer">
                        Agregar
                      </button>
                      <button onClick={() => setShowForm(false)}
                        className="px-3 py-2 text-text-muted text-xs rounded-lg hover:bg-card-hover transition cursor-pointer">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Events List */}
            {loading ? (
              <p className="text-xs text-text-muted text-center py-4">Cargando...</p>
            ) : selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.map((event) => (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="group flex items-start gap-3 px-3 py-2.5 bg-card-dark/50 rounded-xl hover:bg-card-dark transition">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground/90 font-medium">{event.title}</p>
                      {event.description && <p className="text-[11px] text-text-muted mt-0.5 truncate">{event.description}</p>}
                      {event.time && (
                        <p className="text-[11px] text-text-muted/70 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {event.time}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : !showForm && selectedSobrietyInfo.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Sin eventos. Toca <strong>+</strong> para agregar.
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
