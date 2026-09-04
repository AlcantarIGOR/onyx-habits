export interface GamificationStats {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgress: number; // 0 - 100%
  rankTitle: string;
  rankTier: string;
  rankColor: string;
  comboMultiplier: number;
  comboLabel: string;
  streakDays: number;
  todayXp: number;
  todayCompletedCount: number;
  attributes: {
    vitality: { value: number; label: string; desc: string; color: string; max: number };
    intellect: { value: number; label: string; desc: string; color: string; max: number };
    resilience: { value: number; label: string; desc: string; color: string; max: number };
    agility: { value: number; label: string; desc: string; color: string; max: number };
  };
  ranksTimeline: {
    level: number;
    title: string;
    unlocked: boolean;
    tier: string;
  }[];
}

// XP rewards per action
export const XP_REWARDS = {
  HABIT_FUNDAMENTAL: 30,
  HABIT_GROWTH: 20,
  HABIT_MAINTENANCE: 15,
  TASK_HIGH: 25,
  TASK_MEDIUM: 15,
  TASK_LOW: 10,
  DAILY_REFLECTION: 35,
  POMODORO_SESSION: 20,
  BOSS_BATTLE_VICTORY: 100,
};

// Calculate level from total XP using a progressive curve
export function calculateLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  let level = 1;
  let xpForCurrent = 0;
  let xpForNext = 150; // XP required for level 2

  while (totalXp >= xpForNext) {
    level++;
    xpForCurrent = xpForNext;
    // Progressive difficulty: each level requires 20% more XP than previous
    const diff = Math.round(150 * Math.pow(level, 1.35));
    xpForNext = xpForCurrent + diff;
  }

  const currentLevelXp = Math.max(0, totalXp - xpForCurrent);
  const span = xpForNext - xpForCurrent;
  const progress = Math.min(100, Math.max(0, Math.round((currentLevelXp / span) * 100)));

  return {
    level,
    currentLevelXp,
    nextLevelXp: span,
    progress,
  };
}

// Determine Rank based on Level
export function getRankInfo(level: number): {
  title: string;
  tier: string;
  color: string;
} {
  if (level >= 20) {
    return { title: "Maestro ONYX", tier: "RANGO SUPREMO", color: "#F43F5E" };
  }
  if (level >= 15) {
    return { title: "Arquitecto de Alto Rendimiento", tier: "RANGO IV", color: "#A855F7" };
  }
  if (level >= 10) {
    return { title: "Especialista Cloud & Académico", tier: "RANGO III", color: "#3B82F6" };
  }
  if (level >= 5) {
    return { title: "Operador TEC Disciplinado", tier: "RANGO II", color: "#10B981" };
  }
  return { title: "Iniciado ONYX", tier: "RANGO I", color: "#F59E0B" };
}

// Calculate combo multiplier from streak days
export function getComboMultiplier(streakDays: number): {
  multiplier: number;
  label: string;
} {
  if (streakDays >= 14) {
    return { multiplier: 2.0, label: "x2.0 ULTRA COMBO" };
  }
  if (streakDays >= 7) {
    return { multiplier: 1.5, label: "x1.5 MEGA COMBO" };
  }
  if (streakDays >= 3) {
    return { multiplier: 1.2, label: "x1.2 COMBO" };
  }
  return { multiplier: 1.0, label: "x1.0 NORMAL" };
}
