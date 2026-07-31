import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : 90;

  try {
    if (date) {
      const logs = await db.habitLog.findMany({
        where: { date },
      });
      return NextResponse.json(logs);
    }

    // Default: return logs from the last 90 days for performance
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - days);
    const startDateStr = ninetyDaysAgo.toISOString().split("T")[0];

    const logs = await db.habitLog.findMany({
      where: {
        date: { gte: startDateStr },
      },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET Habit Logs error:", error);
    return NextResponse.json({ error: "Error al obtener logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { habitId, date } = body;

    if (!habitId || typeof habitId !== "string" || !date || typeof date !== "string") {
      return NextResponse.json({ error: "Faltan datos obligatorios o son inválidos" }, { status: 400 });
    }

    const existingLog = await db.habitLog.findUnique({
      where: {
        habitId_date: { habitId, date },
      },
    });

    if (existingLog) {
      const updatedLog = await db.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: !existingLog.completed },
      });
      return NextResponse.json(updatedLog);
    } else {
      const newLog = await db.habitLog.create({
        data: {
          habitId,
          date,
          completed: true,
        },
      });
      return NextResponse.json(newLog);
    }
  } catch (error) {
    console.error("POST Habit Logs error:", error);
    return NextResponse.json({ error: "Error al actualizar log" }, { status: 500 });
  }
}
