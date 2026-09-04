import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getLocalDateString, getLocalDayOfWeek } from "@/lib/storage";
import {
  calculateLevel,
  getRankInfo,
  getComboMultiplier,
  XP_REWARDS,
  GamificationStats,
} from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || getLocalDateString();
    const dayOfWeek = getLocalDayOfWeek();

    // Run queries in parallel within a single DB instance
    const [
      tasks,
      habits,
      logs,
      scheduleBlocks,
      reflections,
      focusSessions,
      defeatedBosses,
    ] = await Promise.all([
      db.task.findMany({
        where: {
          OR: [{ completed: false }, { completed: true, date }],
        },
        orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
      }),
      db.habit.findMany({
        orderBy: [{ type: "asc" }, { createdAt: "asc" }],
      }),
      db.habitLog.findMany({
        where: { date },
      }),
      db.scheduleBlock.findMany({
        where: {
          OR: [{ daysOfWeek: { has: dayOfWeek } }, { specificDate: date }],
        },
        orderBy: { startTime: "asc" },
      }),
      db.dailyReflection.findMany(),
      db.focusSession.findMany(),
      db.bossBattle.findMany({ where: { completed: true } }),
    ]);

    // Compute gamification stats ultra-fast
    const allCompletedLogs = await db.habitLog.findMany({
      where: { completed: true },
      include: { habit: true },
    });

    const allCompletedTasks = await db.task.findMany({
      where: { completed: true },
    });

    let totalXp = 0;
    let todayXp = 0;
    let todayCompletedCount = 0;
    let vitalityPoints = 0;
    let intellectPoints = 0;
    let resiliencePoints = 0;
    let agilityPoints = 0;

    for (const log of allCompletedLogs) {
      const type = log.habit?.type;
      let xp = XP_REWARDS.HABIT_MAINTENANCE;

      if (type === "fundamental") {
        xp = XP_REWARDS.HABIT_FUNDAMENTAL;
        vitalityPoints += 3;
      } else if (type === "growth") {
        xp = XP_REWARDS.HABIT_GROWTH;
        intellectPoints += 3;
      } else {
        resiliencePoints += 2;
      }

      totalXp += xp;
      if (log.date === date) {
        todayXp += xp;
        todayCompletedCount++;
      }
    }

    for (const task of allCompletedTasks) {
      let xp = XP_REWARDS.TASK_MEDIUM;
      if (task.priority === "high") xp = XP_REWARDS.TASK_HIGH;
      else if (task.priority === "low") xp = XP_REWARDS.TASK_LOW;

      totalXp += xp;
      agilityPoints += 2;

      if (task.date === date) {
        todayXp += xp;
        todayCompletedCount++;
      }
    }

    for (const ref of reflections) {
      totalXp += XP_REWARDS.DAILY_REFLECTION;
      intellectPoints += 4;
      if (ref.date === date) {
        todayXp += XP_REWARDS.DAILY_REFLECTION;
      }
    }

    for (const session of focusSessions) {
      totalXp += XP_REWARDS.POMODORO_SESSION;
      intellectPoints += 3;
      if (session.date === date) {
        todayXp += XP_REWARDS.POMODORO_SESSION;
        todayCompletedCount++;
      }
    }

    for (const boss of defeatedBosses) {
      totalXp += XP_REWARDS.BOSS_BATTLE_VICTORY;
      intellectPoints += 8;
      agilityPoints += 8;
      if (boss.deadlineDate === date) {
        todayXp += XP_REWARDS.BOSS_BATTLE_VICTORY;
      }
    }

    const datesWithActivity = new Set<string>();
    allCompletedLogs.forEach((l) => datesWithActivity.add(l.date));
    allCompletedTasks.forEach((t) => datesWithActivity.add(t.date));

    let streakDays = 0;
    const checkDate = new Date();
    for (let i = 0; i < 60; i++) {
      const dStr = getLocalDateString(checkDate);
      if (datesWithActivity.has(dStr)) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const { multiplier, label: comboLabel } = getComboMultiplier(streakDays);
    const levelInfo = calculateLevel(totalXp);
    const rankInfo = getRankInfo(levelInfo.level);

    const gamification: GamificationStats = {
      totalXp,
      level: levelInfo.level,
      currentLevelXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      levelProgress: levelInfo.progress,
      rankTitle: rankInfo.title,
      rankTier: rankInfo.tier,
      rankColor: rankInfo.color,
      comboMultiplier: multiplier,
      comboLabel,
      streakDays,
      todayXp: Math.round(todayXp * multiplier),
      todayCompletedCount,
      attributes: {
        vitality: {
          value: Math.min(100, Math.max(10, vitalityPoints + 15)),
          label: "Vitalidad",
          desc: "Basada en tus hábitos fundamentales (sueño 22:15, despertar 06:00, ejercicio).",
          color: "#F43F5E",
          max: 100,
        },
        intellect: {
          value: Math.min(100, Math.max(10, intellectPoints + 15)),
          label: "Intelecto",
          desc: "Basada en hábitos de crecimiento, proyectos personales y reflexión.",
          color: "#A855F7",
          max: 100,
        },
        resilience: {
          value: Math.min(100, Math.max(10, Math.round(streakDays * 8 + resiliencePoints + 15))),
          label: "Resistencia",
          desc: "Impulsada por tu racha ininterrumpida y mantenimiento.",
          color: "#3B82F6",
          max: 100,
        },
        agility: {
          value: Math.min(100, Math.max(10, agilityPoints + 15)),
          label: "Destreza",
          desc: "Impulsada por tus tareas cumplidas.",
          color: "#10B981",
          max: 100,
        },
      },
      ranksTimeline: [
        { level: 1, title: "Iniciado ONYX", unlocked: levelInfo.level >= 1, tier: "Rango I" },
        { level: 5, title: "Operador TEC Disciplinado", unlocked: levelInfo.level >= 5, tier: "Rango II" },
        { level: 10, title: "Especialista Cloud & IA", unlocked: levelInfo.level >= 10, tier: "Rango III" },
        { level: 15, title: "Arquitecto de Alto Rendimiento", unlocked: levelInfo.level >= 15, tier: "Rango IV" },
        { level: 20, title: "Maestro de Disciplina ONYX", unlocked: levelInfo.level >= 20, tier: "Rango Supremo" },
      ],
    };

    return NextResponse.json({
      tasks,
      habits,
      logs,
      scheduleBlocks,
      gamification,
    });
  } catch (error) {
    console.error("GET Dashboard feed error:", error);
    return NextResponse.json({ error: "Error al sincronizar dashboard" }, { status: 500 });
  }
}
