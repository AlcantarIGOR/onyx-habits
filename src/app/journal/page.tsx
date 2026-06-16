"use client";

import React, { useState, useEffect } from "react";
import { 
  storage, 
  DailyReflection, 
  getLocalDateString 
} from "@/lib/storage";
import { 
  Flame, 
  Award, 
  BookOpen, 
  Save, 
  Calendar,
  Sparkles,
  TrendingUp,
  BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JournalPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  
  // Form fields
  const [flowRating, setFlowRating] = useState<number>(3);
  const [victory, setVictory] = useState("");
  const [lesson, setLesson] = useState("");
  const [notes, setNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = getLocalDateString();
    setSelectedDate(today);
    setReflections(storage.getReflections());
    loadReflectionForDate(today);
  }, []);

  const loadReflectionForDate = (dateStr: string) => {
    const existing = storage.getReflectionForDate(dateStr);
    if (existing) {
      setFlowRating(existing.flowRating);
      setVictory(existing.victory);
      setLesson(existing.lesson);
      setNotes(existing.notes);
    } else {
      // Defaults
      setFlowRating(3);
      setVictory("");
      setLesson("");
      setNotes("");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadReflectionForDate(newDate);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveReflection({
      date: selectedDate,
      flowRating,
      victory,
      lesson,
      notes,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    // Reload list
    setReflections(storage.getReflections());
  };

  if (!mounted) return null;

  // Sort reflections by date descending
  const sortedReflections = [...reflections].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Bitácora de Rendimiento</h2>
        <p className="text-text-muted text-sm mt-1">Registra tu estado de concentración, tus aprendizajes y tus victorias del día.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reflection Editor (Col-Span 2) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="glass-panel p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-dark pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base">Registro de Hoy / Histórico</h3>
              </div>
              
              {/* Date Input */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-muted" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="bg-background-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs font-mono focus:border-primary focus:outline-none transition text-foreground"
                />
              </div>
            </div>

            {/* Flow State Star Rating */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-primary" /> Nivel de Concentración (Estado de Flow)
                </label>
                <span className="text-xs font-mono text-primary font-bold">{flowRating} / 5</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const active = val <= flowRating;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFlowRating(val)}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                        active 
                          ? "bg-primary/5 border-primary text-primary shadow-[0_0_15px_rgba(163,230,53,0.1)]" 
                          : "bg-background-dark border-border-dark text-text-muted hover:border-border-dark/60"
                      }`}
                    >
                      <Flame className={`h-6 w-6 ${active ? "fill-primary" : ""}`} />
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-muted">
                1 = Muy distraído/Baja energía · 3 = Enfoque normal · 5 = Concentración absoluta (Estado de Flow).
              </p>
            </div>

            {/* Victory of the Day */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" /> Victoria del Día
              </label>
              <textarea
                value={victory}
                onChange={(e) => setVictory(e.target.value)}
                placeholder="¿Cuál fue tu mayor logro hoy? (Ej. Completé la refactorización de MoodleSync o paseé a Aika 1 hora)"
                rows={2}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition resize-none"
              />
            </div>

            {/* Lesson Learned */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-blue" /> Lección o Aprendizaje
              </label>
              <textarea
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="¿Qué aprendiste hoy? (Ej. Entendí mejor el polimorfismo de POO o aprendí una nueva táctica de ajedrez)"
                rows={2}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition resize-none"
              />
            </div>

            {/* General Notes / Hobby Progress */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pink-500" /> Notas Generales / Avances de Hobbies
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe sobre tu progreso en guitarra, ajedrez, ley de la atracción o reflexiones generales del día..."
                rows={4}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition"
              />
            </div>

            {/* Submit & Status */}
            <div className="flex items-center gap-4 border-t border-border-dark pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 py-3 px-6 bg-primary text-background-dark font-bold text-sm rounded-xl hover:bg-primary-hover transition-all duration-200"
              >
                <Save className="h-4 w-4" /> Guardar Registro
              </button>
              
              <AnimatePresence>
                {savedSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-mono text-primary font-bold"
                  >
                    ✓ ¡Guardado en el sistema correctamente!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>

        {/* Timeline of Past Reflections */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight">Historial de Enfoque</h3>
          
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {sortedReflections.length > 0 ? (
              sortedReflections.map((ref) => (
                <div key={ref.id} className="p-4 rounded-xl border border-border-dark bg-card-dark/40 space-y-3 hover:border-border-dark/80 transition">
                  {/* Meta */}
                  <div className="flex items-center justify-between border-b border-border-dark pb-2">
                    <span className="text-xs font-mono text-primary font-bold">{ref.date}</span>
                    <div className="flex gap-0.5 text-primary">
                      {Array.from({ length: ref.flowRating }).map((_, idx) => (
                        <Flame key={idx} className="h-3.5 w-3.5 fill-primary" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2 text-xs">
                    {ref.victory && (
                      <p className="text-text-muted">
                        <strong className="text-foreground text-[10px] font-mono uppercase tracking-wider block text-emerald-500">Victoria:</strong>
                        {ref.victory}
                      </p>
                    )}
                    {ref.lesson && (
                      <p className="text-text-muted">
                        <strong className="text-foreground text-[10px] font-mono uppercase tracking-wider block text-accent-blue">Lección:</strong>
                        {ref.lesson}
                      </p>
                    )}
                    {ref.notes && (
                      <p className="text-text-muted line-clamp-3">
                        <strong className="text-foreground text-[10px] font-mono uppercase tracking-wider block text-pink-500">Notas:</strong>
                        {ref.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border border-dashed border-border-dark rounded-xl text-text-muted text-xs">
                No hay registros anteriores grabados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
