"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const playBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (err) {
      console.error("Audio API error:", err);
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    playBeep();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 1200);

    if (mode === 'work') {
      setMode('break');
      setTimeLeft(BREAK_TIME);
      setSessionsCompleted((prev) => prev + 1);
    } else {
      setMode('work');
      setTimeLeft(WORK_TIME);
    }
  }, [mode, playBeep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('work');
    setTimeLeft(WORK_TIME);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalTime = mode === 'work' ? WORK_TIME : BREAK_TIME;
  const progress = 1 - timeLeft / totalTime;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * progress;

  const isWork = mode === 'work';
  const strokeColor = isWork ? '#8B9FCA' : '#7EC89B';

  return (
    <div className="flex flex-col items-center py-6 space-y-8">
      {/* Mode label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="text-[13px] font-medium"
          style={{ color: `${strokeColor}aa` }}
        >
          {isWork ? 'Enfoque' : 'Descanso'}
        </motion.div>
      </AnimatePresence>

      {/* Ring */}
      <div className="relative w-[180px] h-[180px] flex items-center justify-center">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="90" cy="90" r={radius}
            stroke="#1e1e24"
            strokeWidth="4"
            fill="transparent"
          />
          <motion.circle
            cx="90" cy="90" r={radius}
            stroke={strokeColor}
            strokeWidth="4"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{
              strokeDashoffset,
              filter: isFlashing
                ? `drop-shadow(0 0 10px ${strokeColor})`
                : 'drop-shadow(0 0 0px rgba(0,0,0,0))'
            }}
            transition={{
              strokeDashoffset: { duration: isActive ? 1 : 0.2, ease: "linear" },
              filter: { duration: 0.3 }
            }}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center">
          <span className="text-4xl font-light text-foreground/90 tabular-nums tracking-tight">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={toggleTimer}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-card-dark border border-border-dark/50 text-foreground/80 hover:bg-card-hover transition-colors"
          aria-label={isActive ? "Pausar" : "Iniciar"}
        >
          {isActive
            ? <Pause size={18} fill="currentColor" />
            : <Play size={18} className="ml-0.5" fill="currentColor" />
          }
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={resetTimer}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-border-dark/50 text-text-muted hover:text-foreground/60 transition-colors"
          aria-label="Reiniciar"
        >
          <RotateCcw size={14} />
        </motion.button>
      </div>

      {/* Session count */}
      <p className="text-[11px] text-text-muted">
        {sessionsCompleted} {sessionsCompleted === 1 ? 'sesión' : 'sesiones'} hoy
      </p>
    </div>
  );
}
