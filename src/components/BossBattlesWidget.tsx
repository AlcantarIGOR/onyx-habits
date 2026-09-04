"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Award,
  Calendar,
  Sparkles,
  X,
} from "lucide-react";

export interface BossBattle {
  id: string;
  title: string;
  subject: string;
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime?: string | null; // HH:mm
  type: "exam" | "project" | "certification" | "delivery";
  completed: boolean;
  notes?: string | null;
}

interface BossBattlesWidgetProps {
  onVictory?: (title: string) => void;
}

const TYPE_CONFIG = {
  exam: { label: "Examen Parcial", color: "#F43F5E", bg: "bg-accent-rose/15", border: "border-accent-rose/40" },
  project: { label: "Reto / Proyecto TEC", color: "#A855F7", bg: "bg-accent-violet/15", border: "border-accent-violet/40" },
  certification: { label: "Certificación AWS", color: "#F59E0B", bg: "bg-accent-amber/15", border: "border-accent-amber/40" },
  delivery: { label: "Entrega Final", color: "#3B82F6", bg: "bg-primary/15", border: "border-primary/40" },
};

export default function BossBattlesWidget({ onVictory }: BossBattlesWidgetProps) {
  const [battles, setBattles] = useState<BossBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Álgebra Lineal");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("12:00");
  const [type, setType] = useState<BossBattle["type"]>("exam");
  const [notes, setNotes] = useState("");

  // Live countdown clock state (ticks every second)
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBattles = useCallback(async () => {
    try {
      const res = await fetch("/api/boss-battles");
      if (res.ok) {
        setBattles(await res.json());
      }
    } catch (e) {
      console.error("Error fetching boss battles:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  const handleToggleVictory = async (battle: BossBattle) => {
    const nextState = !battle.completed;
    setBattles((prev) =>
      prev.map((b) => (b.id === battle.id ? { ...b, completed: nextState } : b))
    );

    try {
      const res = await fetch("/api/boss-battles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: battle.id, completed: nextState }),
      });

      if (res.ok && nextState && onVictory) {
        onVictory(battle.title);
      }
    } catch (err) {
      console.error("Error updating boss battle:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBattles((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`/api/boss-battles?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) return;

    try {
      const res = await fetch("/api/boss-battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          deadlineDate,
          deadlineTime: deadlineTime || null,
          type,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTitle("");
        setNotes("");
        fetchBattles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCountdown = (dateStr: string, timeStr?: string | null) => {
    const target = new Date(`${dateStr}T${timeStr || "23:59"}:00`);
    const diff = target.getTime() - now;

    if (diff <= 0) {
      return { text: "¡Fecha límite vencida!", urgent: true, days: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const urgent = days < 2;
    const text =
      days > 0
        ? `${days}d ${hours}h ${mins}m ${secs}s`
        : `${hours}h ${mins}m ${secs}s`;

    return { text, urgent, days };
  };

  const activeBattles = battles.filter((b) => !b.completed);
  const defeatedBattles = battles.filter((b) => b.completed);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-rose/15 text-accent-rose border border-accent-rose/30 shadow-md">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Boss Battles & Exámenes TEC
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-accent-rose/15 text-accent-rose border border-accent-rose/30">
                +100 XP
              </span>
            </h3>
            <p className="text-xs text-text-muted">
              Cuenta regresiva de parciales, entregas clave y certificaciones
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-card-dark hover:bg-card-hover border border-border-dark/70 text-foreground text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Nuevo Desafío</span>
        </button>
      </div>

      {/* Battles List */}
      {loading ? (
        <div className="py-8 text-center text-text-muted text-xs font-mono">
          Cargando desafíos...
        </div>
      ) : battles.length === 0 ? (
        <div className="p-6 rounded-2xl bg-card-dark/40 border border-border-dark/50 text-center space-y-2">
          <Award className="w-7 h-7 text-text-muted/60 mx-auto" />
          <p className="text-xs text-text-muted font-medium">
            No tienes exámenes o entregas registradas actualmente.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            + Agregar tu primer examen o entrega
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <AnimatePresence>
            {activeBattles.map((battle) => {
              const countdown = formatCountdown(battle.deadlineDate, battle.deadlineTime);
              const config = TYPE_CONFIG[battle.type] || TYPE_CONFIG.exam;

              return (
                <motion.div
                  key={battle.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden bg-card-dark/90 ${
                    countdown.urgent
                      ? "border-accent-rose/70 shadow-lg shadow-accent-rose/10"
                      : "border-border-dark/70 hover:border-primary/40"
                  }`}
                >
                  {/* Urgency glow */}
                  {countdown.urgent && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-rose/10 blur-2xl pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bg} ${config.border}`}
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </span>
                        <span className="text-xs font-semibold text-text-muted font-mono">
                          {battle.subject}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug">
                        {battle.title}
                      </h4>

                      {battle.notes && (
                        <p className="text-xs text-text-muted line-clamp-1">{battle.notes}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(battle.id, e)}
                        className="p-1.5 text-text-muted hover:text-accent-rose rounded-lg transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleVictory(battle)}
                        title="¡Derrotar Boss! (+100 XP)"
                        className="p-2 rounded-xl bg-card-hover border border-border-dark/60 hover:border-accent-green/60 hover:text-accent-green text-text-muted transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Live Countdown Footer */}
                  <div className="mt-3 pt-3 border-t border-border-dark/50 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{battle.deadlineDate} {battle.deadlineTime || ""}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 font-bold ${
                        countdown.urgent
                          ? "text-accent-rose animate-pulse"
                          : "text-primary"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>⏳ {countdown.text}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Victories Collapsible */}
      {defeatedBattles.length > 0 && (
        <div className="pt-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
            🏆 Desafíos Superados ({defeatedBattles.length})
          </p>
          <div className="space-y-1.5">
            {defeatedBattles.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-card-dark/40 border border-border-dark/40 text-xs text-text-muted line-through"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                  <span>{b.title} ({b.subject})</span>
                </div>
                <button
                  onClick={() => handleToggleVictory(b)}
                  className="text-[10px] text-text-muted hover:text-foreground underline cursor-pointer"
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Boss Battle Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-dark border border-border-dark/80 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-foreground rounded-lg bg-card-hover/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-accent-rose" />
                <h3 className="text-base font-bold text-foreground">
                  Registrar Boss Battle / Examen
                </h3>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    Título del Desafío
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Primer Examen Parcial de Álgebra Lineal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                      Materia / Proyecto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Álgebra, AWS, TEC"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/60"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                      Tipo de Desafío
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as BossBattle["type"])}
                      className="w-full bg-background-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/60 cursor-pointer"
                    >
                      <option value="exam">Examen Parcial</option>
                      <option value="project">Reto / Proyecto TEC</option>
                      <option value="certification">Certificación AWS</option>
                      <option value="delivery">Entrega Final</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                      Fecha Límite
                    </label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/60 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/60 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    Notas / Temario Clave (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Temas: Matrices, determinantes y sistemas de ecuaciones lineales..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-background-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/60"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-text-muted hover:text-foreground text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    Guardar Desafío
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
