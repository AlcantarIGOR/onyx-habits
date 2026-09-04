"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";

interface PomodoroTimerProps {
  onSessionComplete?: (subject: string, minutes: number) => void;
}

const DEFAULT_SUBJECTS = [
  "📐 Álgebra Lineal",
  "💻 Modelación Computacional",
  "☁️ Certificación AWS",
  "🧠 Desarrollo ONYX",
  "📖 Lectura Profunda",
  "📝 Tareas & Entregas",
];

const PRESETS = [
  { label: "25 min", work: 25 * 60, break: 5 * 60, tag: "Pomodoro" },
  { label: "50 min", work: 50 * 60, break: 10 * 60, tag: "Deep Work" },
  { label: "90 min", work: 90 * 60, break: 15 * 60, tag: "Ultradian Flow" },
];

export default function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const currentPreset = PRESETS[selectedPresetIndex];

  const [timeLeft, setTimeLeft] = useState(currentPreset.work);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [isFlashing, setIsFlashing] = useState(false);

  // Subject Selection
  const [selectedSubject, setSelectedSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState("");

  // Daily focus stats
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);

  // Transition state: countdown before auto-starting next mode
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(0);
  const transitionRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSubjectName = isCustomSubject ? (customSubjectText.trim() || "Estudio Libre") : selectedSubject;

  // Load today's focus stats
  const loadFocusStats = useCallback(async () => {
    try {
      const res = await fetch("/api/focus");
      if (res.ok) {
        const data = await res.json();
        setTodayMinutes(data.totalTodayMinutes || 0);
        setTodaySessionsCount(data.todaySessions?.length || 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadFocusStats();
  }, [loadFocusStats]);

  const playChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Ascending victory chime)
      const durations = [0.2, 0.2, 0.25, 0.5];
      const delays = [0, 0.15, 0.3, 0.45];

      frequencies.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delays[i]);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delays[i]);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + delays[i] + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delays[i] + durations[i]);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(audioCtx.currentTime + delays[i]);
        oscillator.stop(audioCtx.currentTime + delays[i] + durations[i]);
      });
    } catch (err) {
      console.error("Audio API error:", err);
    }
  }, []);

  const saveFocusSession = useCallback(
    async (mins: number) => {
      try {
        await fetch("/api/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: activeSubjectName,
            durationMinutes: mins,
          }),
        });
        loadFocusStats();
        if (onSessionComplete) {
          onSessionComplete(activeSubjectName, mins);
        }
      } catch (err) {
        console.error("Error saving focus session:", err);
      }
    },
    [activeSubjectName, loadFocusStats, onSessionComplete]
  );

  const startTransition = useCallback(
    (nextMode: "work" | "break") => {
      setIsActive(false);
      setIsTransitioning(true);
      setTransitionCountdown(5);

      let count = 5;
      transitionRef.current = setInterval(() => {
        count--;
        setTransitionCountdown(count);
        if (count <= 0) {
          if (transitionRef.current) clearInterval(transitionRef.current);
          transitionRef.current = null;
          setIsTransitioning(false);

          setMode(nextMode);
          setTimeLeft(nextMode === "work" ? currentPreset.work : currentPreset.break);
          setIsActive(true);
        }
      }, 1000);
    },
    [currentPreset]
  );

  useEffect(() => {
    return () => {
      if (transitionRef.current) clearInterval(transitionRef.current);
    };
  }, []);

  const handleTimerComplete = useCallback(() => {
    playChime();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 1500);

    if (mode === "work") {
      const minutesWorked = Math.round(currentPreset.work / 60);
      saveFocusSession(minutesWorked);
      startTransition("break");
    } else {
      startTransition("work");
    }
  }, [mode, currentPreset, playChime, saveFocusSession, startTransition]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            handleTimerComplete();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, handleTimerComplete]);

  const toggleTimer = () => {
    if (isTransitioning) return;
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (transitionRef.current) {
      clearInterval(transitionRef.current);
      transitionRef.current = null;
    }
    setIsTransitioning(false);
    setIsActive(false);
    setMode("work");
    setTimeLeft(currentPreset.work);
  };

  const changePreset = (index: number) => {
    if (isActive || isTransitioning) return;
    setSelectedPresetIndex(index);
    setTimeLeft(PRESETS[index].work);
    setMode("work");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const totalTime = mode === "work" ? currentPreset.work : currentPreset.break;
  const progress = 1 - timeLeft / totalTime;
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * progress;

  const isWork = mode === "work";
  const strokeColor = isWork ? "#8B5CF6" : "#10B981"; // Violet for work, Emerald for break

  return (
    <div className="flex flex-col items-center py-4 space-y-6 w-full max-w-sm mx-auto">
      {/* ── Subject Picker ── */}
      <div className="w-full space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 justify-center">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          Materia / Proyecto de Enfoque
        </label>

        {!isCustomSubject ? (
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomSubject(true);
                } else {
                  setSelectedSubject(e.target.value);
                }
              }}
              disabled={isActive}
              className="w-full bg-card-dark border border-border-dark/70 text-foreground font-semibold text-xs rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:border-primary/60 transition cursor-pointer disabled:opacity-60 text-center shadow-sm"
            >
              {DEFAULT_SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-card-dark text-foreground py-1">
                  {s}
                </option>
              ))}
              <option value="__custom__" className="bg-card-dark text-primary font-bold">
                ✏️ Escribir otra materia / proyecto...
              </option>
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-3 pointer-events-none" />
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. Álgebra, AWS, Tarea..."
              value={customSubjectText}
              onChange={(e) => setCustomSubjectText(e.target.value)}
              disabled={isActive}
              className="flex-1 bg-card-dark border border-border-dark/70 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-primary/60"
            />
            <button
              onClick={() => setIsCustomSubject(false)}
              className="px-2.5 py-1.5 bg-card-hover text-text-muted hover:text-foreground text-xs rounded-xl border border-border-dark/60 cursor-pointer"
            >
              Lista
            </button>
          </div>
        )}
      </div>

      {/* ── Preset Duration Selector ── */}
      <div className="flex items-center gap-1.5 bg-background-dark/70 p-1 rounded-2xl border border-border-dark/60 shadow-inner">
        {PRESETS.map((p, idx) => (
          <button
            key={p.label}
            onClick={() => changePreset(idx)}
            disabled={isActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedPresetIndex === idx
                ? "bg-card-dark text-primary border border-primary/30 shadow-md scale-105"
                : "text-text-muted hover:text-foreground disabled:opacity-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Ring and Timer ── */}
      <div className="relative w-[184px] h-[184px] flex items-center justify-center">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="92"
            cy="92"
            r={radius}
            stroke="#1c1c24"
            strokeWidth="5"
            fill="transparent"
          />
          <motion.circle
            cx="92"
            cy="92"
            r={radius}
            stroke={strokeColor}
            strokeWidth="5"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{
              strokeDashoffset: isTransitioning ? 0 : strokeDashoffset,
              filter: isFlashing
                ? `drop-shadow(0 0 16px ${strokeColor})`
                : "drop-shadow(0 0 0px rgba(0,0,0,0))",
            }}
            transition={{
              strokeDashoffset: { duration: isActive ? 1 : 0.2, ease: "linear" },
              filter: { duration: 0.3 },
            }}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center space-y-1">
          <span className="text-4xl font-light font-mono text-foreground tabular-nums tracking-tight">
            {isTransitioning ? "--:--" : formatTime(timeLeft)}
          </span>
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${strokeColor}15`,
              borderColor: `${strokeColor}40`,
              color: strokeColor,
            }}
          >
            {isTransitioning
              ? `Descanso en ${transitionCountdown}s`
              : isWork
              ? "Enfoque (+20 XP)"
              : "Descanso"}
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          disabled={isTransitioning}
          className={`flex items-center justify-center w-13 h-13 rounded-2xl bg-primary text-background-dark font-black hover:bg-primary/90 transition shadow-lg shadow-primary/20 cursor-pointer ${
            isTransitioning ? "opacity-40 cursor-not-allowed" : ""
          }`}
          aria-label={isActive ? "Pausar" : "Iniciar"}
        >
          {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-0.5" fill="currentColor" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetTimer}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-card-dark border border-border-dark/60 text-text-muted hover:text-foreground transition cursor-pointer"
          aria-label="Reiniciar"
        >
          <RotateCcw size={16} />
        </motion.button>
      </div>

      {/* ── Today Focus Summary ── */}
      <div className="w-full bg-background-dark/50 p-3 rounded-2xl border border-border-dark/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Hoy acumulado:</span>
        </div>
        <span className="font-mono font-bold text-foreground">
          {todayMinutes} min ({todaySessionsCount} {todaySessionsCount === 1 ? "sesión" : "sesiones"})
        </span>
      </div>
    </div>
  );
}
