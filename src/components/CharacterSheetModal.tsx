"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GamificationStats } from "@/lib/gamification";
import {
  X,
  Shield,
  Zap,
  Flame,
  Brain,
  Heart,
  Activity,
  Award,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GamificationStats | null;
}

export default function CharacterSheetModal({
  isOpen,
  onClose,
  stats,
}: CharacterSheetModalProps) {
  if (!isOpen || !stats) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-card-dark border border-border-dark/80 rounded-3xl p-6 sm:p-7 w-full max-w-2xl shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-text-muted hover:text-foreground rounded-xl bg-card-hover/50 hover:bg-card-hover transition cursor-pointer"
            aria-label="Cerrar Ficha de Personaje"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header Identity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-dark/60">
            <div className="flex items-center gap-3.5">
              <div
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black border shadow-lg"
                style={{
                  backgroundColor: `${stats.rankColor}15`,
                  borderColor: `${stats.rankColor}50`,
                  color: stats.rankColor,
                }}
              >
                <span className="text-[10px] uppercase tracking-widest text-text-muted">LVL</span>
                <span className="text-xl leading-none font-extrabold">{stats.level}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${stats.rankColor}15`,
                      borderColor: `${stats.rankColor}40`,
                      color: stats.rankColor,
                    }}
                  >
                    {stats.rankTier}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {stats.totalXp.toLocaleString()} XP Totales
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-0.5">
                  {stats.rankTitle}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-background-dark/70 border border-border-dark/50 px-3.5 py-2 rounded-2xl self-start sm:self-auto">
              <Flame className="w-5 h-5 text-accent-amber animate-pulse" />
              <div>
                <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Multiplicador</div>
                <div className="text-xs font-bold text-accent-amber">{stats.comboLabel}</div>
              </div>
            </div>
          </div>

          {/* Level Progress Bar Detail */}
          <div className="space-y-2 bg-background-dark/50 p-4 rounded-2xl border border-border-dark/40">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Progreso al Nivel {stats.level + 1}</span>
              <span className="font-mono font-bold text-foreground">
                {stats.currentLevelXp} / {stats.nextLevelXp} XP ({stats.levelProgress}%)
              </span>
            </div>
            <div className="h-2.5 bg-card-dark rounded-full overflow-hidden p-0.5 border border-border-dark/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.levelProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${stats.rankColor}99, ${stats.rankColor})`,
                  boxShadow: `0 0 10px ${stats.rankColor}66`,
                }}
              />
            </div>
          </div>

          {/* 4 Core RPG Attributes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Atributos de Disciplina (Stats)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Vitalidad */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-rose/15 text-accent-rose">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{stats.attributes.vitality.label}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-accent-rose">
                    {stats.attributes.vitality.value}/100
                  </span>
                </div>
                <div className="h-1.5 bg-background-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-rose"
                    style={{ width: `${stats.attributes.vitality.value}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted leading-tight">{stats.attributes.vitality.desc}</p>
              </div>

              {/* Intelecto */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-violet/15 text-accent-violet">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{stats.attributes.intellect.label}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-accent-violet">
                    {stats.attributes.intellect.value}/100
                  </span>
                </div>
                <div className="h-1.5 bg-background-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-violet"
                    style={{ width: `${stats.attributes.intellect.value}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted leading-tight">{stats.attributes.intellect.desc}</p>
              </div>

              {/* Resistencia */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{stats.attributes.resilience.label}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-primary">
                    {stats.attributes.resilience.value}/100
                  </span>
                </div>
                <div className="h-1.5 bg-background-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${stats.attributes.resilience.value}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted leading-tight">{stats.attributes.resilience.desc}</p>
              </div>

              {/* Destreza */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-green/15 text-accent-green">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{stats.attributes.agility.label}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-accent-green">
                    {stats.attributes.agility.value}/100
                  </span>
                </div>
                <div className="h-1.5 bg-background-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-green"
                    style={{ width: `${stats.attributes.agility.value}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted leading-tight">{stats.attributes.agility.desc}</p>
              </div>
            </div>
          </div>

          {/* Ranks Progression Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Award className="w-4 h-4 text-accent-amber" />
              Árbol de Rangos ONYX
            </h3>

            <div className="space-y-2">
              {stats.ranksTimeline.map((r) => (
                <div
                  key={r.level}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    r.unlocked
                      ? "bg-card-hover/80 border-border-dark/80 text-foreground"
                      : "bg-background-dark/40 border-border-dark/30 text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-text-muted/60 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold">{r.title}</div>
                      <div className="text-[10px] text-text-muted">{r.tier}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-card-dark border border-border-dark/50">
                    Nv. {r.level}+
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer close */}
          <div className="flex justify-end pt-3 border-t border-border-dark/40">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary/90 transition cursor-pointer shadow-lg shadow-primary/20"
            >
              Cerrar Ficha
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
