"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SobrietyCounter, getLocalDateString } from "@/lib/storage";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Target,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_ICONS = ["🚭", "🍃", "🍺", "🎰", "📱", "🍔", "☕", "💊"];

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T12:00:00");
  const d2 = new Date(dateStr2 + "T12:00:00");
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SobrietyTrackerWidget() {
  const todayStr = getLocalDateString();
  const [trackers, setTrackers] = useState<SobrietyCounter[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("🚭");
  const [formLastDate, setFormLastDate] = useState(todayStr);
  const [formTargetDate, setFormTargetDate] = useState("2026-12-31");

  // Reset confirmation state
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [resetDate, setResetDate] = useState(todayStr);

  useEffect(() => {
    let ignore = false;
    async function fetchTrackers() {
      try {
        const res = await fetch("/api/sobriety");
        if (!ignore && res.ok) {
          setTrackers(await res.json());
        }
      } catch (err) {
        console.error("Error fetching sobriety trackers:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchTrackers();
    return () => { ignore = true; };
  }, []);

  const handleAddTracker = async () => {
    if (!formName.trim()) return;

    const temp: SobrietyCounter = {
      id: "temp-" + Date.now(),
      name: formName.trim(),
      icon: formIcon,
      lastResetDate: formLastDate,
      targetDate: formTargetDate,
      createdAt: new Date().toISOString(),
    };

    setTrackers((prev) => [...prev, temp]);
    setShowForm(false);
    setFormName("");

    try {
      const res = await fetch("/api/sobriety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: temp.name,
          icon: temp.icon,
          lastResetDate: temp.lastResetDate,
          targetDate: temp.targetDate,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setTrackers((prev) => prev.map((t) => (t.id === temp.id ? saved : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async (id: string) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, lastResetDate: resetDate } : t))
    );
    setConfirmResetId(null);

    try {
      await fetch("/api/sobriety", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lastResetDate: resetDate }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    setTrackers((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/sobriety?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted text-xs font-mono">
        Cargando contadores...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tracker Cards */}
      <AnimatePresence mode="popLayout">
        {trackers.map((tracker) => {
          const daysClean = daysBetween(tracker.lastResetDate, todayStr);
          const totalDays = daysBetween(tracker.lastResetDate, tracker.targetDate);
          const progressPercent = totalDays > 0 ? Math.min(100, Math.round((daysClean / totalDays) * 100)) : 0;
          const daysRemaining = daysBetween(todayStr, tracker.targetDate);
          const targetReached = daysRemaining <= 0;

          return (
            <motion.div
              key={tracker.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card-dark/50 rounded-2xl p-5 space-y-4 border border-border-dark/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tracker.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{tracker.name}</h3>
                    <p className="text-[11px] text-text-muted">
                      Desde el{" "}
                      {new Date(tracker.lastResetDate + "T12:00:00").toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(tracker.id)}
                  className="p-1.5 text-text-muted/40 hover:text-accent-rose transition cursor-pointer"
                  aria-label="Eliminar contador"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Big counter */}
              <div className="text-center py-3">
                <motion.p
                  key={daysClean}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold text-foreground tracking-tight"
                >
                  {daysClean}
                </motion.p>
                <p className="text-xs text-text-muted mt-1">
                  {daysClean === 1 ? "día limpio" : "días limpio"}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Meta: {new Date(tracker.targetDate + "T12:00:00").toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span>
                    {targetReached ? (
                      <span className="text-accent-green flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> ¡Meta alcanzada!
                      </span>
                    ) : (
                      `${daysRemaining} días restantes`
                    )}
                  </span>
                </div>
                <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: targetReached
                        ? "linear-gradient(90deg, #4ADE80, #22D3EE)"
                        : `linear-gradient(90deg, #8B9FCA, #4ADE80)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-center text-[11px] text-text-muted/70">
                  {progressPercent}% completado
                </p>
              </div>

              {/* Reset Button / Confirmation */}
              {confirmResetId === tracker.id ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3 space-y-3"
                >
                  <div className="flex items-center gap-2 text-accent-rose text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>¿Registrar recaída?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-text-muted">Fecha:</label>
                    <input
                      type="date"
                      value={resetDate}
                      onChange={(e) => setResetDate(e.target.value)}
                      max={todayStr}
                      className="flex-1 bg-transparent border border-border-dark/50 rounded-lg px-2 py-1 text-xs text-foreground focus:border-accent-rose/30 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReset(tracker.id)}
                      className="flex-1 py-1.5 bg-accent-rose/15 text-accent-rose text-xs font-medium rounded-lg hover:bg-accent-rose/25 transition cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmResetId(null)}
                      className="px-3 py-1.5 text-text-muted text-xs rounded-lg hover:bg-card-hover transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => {
                    setConfirmResetId(tracker.id);
                    setResetDate(todayStr);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-text-muted/60 hover:text-accent-rose hover:bg-accent-rose/5 rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Registrar recaída
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {trackers.length === 0 && !showForm && (
        <div className="py-12 text-center space-y-3">
          <p className="text-4xl">💪</p>
          <p className="text-sm text-text-muted">
            Agrega un contador para rastrear tus días de sobriedad.
          </p>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card-dark rounded-2xl p-4 space-y-4 border border-border-dark/50">
              <h3 className="text-sm font-medium text-foreground">Nuevo contador</h3>

              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Libre de Marihuana"
                className="w-full bg-transparent border border-border-dark/50 rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-primary/30 focus:outline-none transition placeholder:text-text-muted/50"
                autoFocus
              />

              {/* Icon picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-text-muted">Ícono</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormIcon(icon)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition cursor-pointer ${
                        formIcon === icon
                          ? "bg-primary/15 ring-1 ring-primary/30"
                          : "bg-card-hover hover:bg-border-dark"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-text-muted">Último día (inicio)</label>
                  <input
                    type="date"
                    value={formLastDate}
                    onChange={(e) => setFormLastDate(e.target.value)}
                    max={todayStr}
                    className="w-full bg-transparent border border-border-dark/50 rounded-lg px-2 py-2 text-xs text-foreground focus:border-primary/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-text-muted">Fecha meta</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    min={todayStr}
                    className="w-full bg-transparent border border-border-dark/50 rounded-lg px-2 py-2 text-xs text-foreground focus:border-primary/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddTracker}
                  className="flex-1 py-2.5 bg-primary/15 text-primary text-sm font-medium rounded-xl hover:bg-primary/25 transition cursor-pointer"
                >
                  Crear contador
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-text-muted text-sm rounded-xl hover:bg-card-hover transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-card-dark/50 border border-border-dark/30 text-text-muted hover:text-foreground hover:bg-card-dark rounded-xl transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Agregar contador</span>
        </button>
      )}
    </div>
  );
}
