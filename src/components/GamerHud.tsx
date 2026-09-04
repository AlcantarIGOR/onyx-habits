"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GamificationStats } from "@/lib/gamification";
import CharacterSheetModal from "@/components/CharacterSheetModal";
import {
  Flame,
  Zap,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Gamepad2,
} from "lucide-react";

interface GamerHudProps {
  stats: GamificationStats | null;
  loading?: boolean;
}

export default function GamerHud({ stats, loading }: GamerHudProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (loading || !stats) {
    return (
      <div className="w-full h-16 bg-card-dark/40 border border-border-dark/40 rounded-2xl animate-pulse" />
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-card-dark via-card-dark to-card-hover/80 border border-border-dark/70 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 relative overflow-hidden"
      >
        {/* Subtle background glow effect based on rank color */}
        <div
          className="absolute -top-12 -left-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: stats.rankColor }}
        />

        {/* Left: Level Badge & Rank Title */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-black border shadow-md flex-shrink-0"
            style={{
              backgroundColor: `${stats.rankColor}18`,
              borderColor: `${stats.rankColor}60`,
              color: stats.rankColor,
              boxShadow: `0 0 12px ${stats.rankColor}33`,
            }}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-80">LVL</span>
            <span className="text-base leading-none font-black">{stats.level}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${stats.rankColor}15`,
                  borderColor: `${stats.rankColor}40`,
                  color: stats.rankColor,
                }}
              >
                {stats.rankTier}
              </span>
              <span className="text-[11px] font-mono text-text-muted">
                {stats.totalXp.toLocaleString()} XP
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              {stats.rankTitle}
            </h3>
          </div>
        </div>

        {/* Center: XP Progress Bar */}
        <div className="flex-1 max-w-md space-y-1.5 relative z-10">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-text-muted">
              Nivel {stats.level} ➔ {stats.level + 1}
            </span>
            <span className="text-foreground font-semibold">
              {stats.currentLevelXp} / {stats.nextLevelXp} XP ({stats.levelProgress}%)
            </span>
          </div>
          <div className="h-2 bg-background-dark/80 rounded-full overflow-hidden p-0.5 border border-border-dark/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.levelProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${stats.rankColor}aa, ${stats.rankColor})`,
                boxShadow: `0 0 8px ${stats.rankColor}88`,
              }}
            />
          </div>
        </div>

        {/* Right: Combo multiplier & Ficha RPG button */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 relative z-10 pt-1 md:pt-0 border-t md:border-t-0 border-border-dark/40">
          {/* Combo pill & Today XP */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background-dark/70 border border-border-dark/60 text-accent-amber text-xs font-bold shadow-inner">
              <Flame className="w-3.5 h-3.5 animate-pulse text-accent-amber" />
              <span className="font-mono text-[11px]">{stats.comboMultiplier > 1 ? `x${stats.comboMultiplier}` : "x1.0"}</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-semibold">
              <Zap className="w-3 h-3" />
              <span>+{stats.todayXp} XP hoy</span>
            </div>
          </div>

          {/* Character sheet button */}
          <button
            onClick={() => setIsSheetOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-card-hover border border-border-dark/70 hover:border-primary/50 text-foreground text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer hover:bg-card-hover/90 shadow-sm active:scale-95"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-primary" />
            <span>Ficha RPG</span>
            <ChevronRight className="w-3 h-3 text-text-muted" />
          </button>
        </div>
      </motion.div>

      {/* Character Sheet Modal */}
      <CharacterSheetModal
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        stats={stats}
      />
    </>
  );
}
