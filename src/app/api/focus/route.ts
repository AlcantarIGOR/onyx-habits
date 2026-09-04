import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getLocalDateString } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || getLocalDateString();

    const todaySessions = await db.focusSession.findMany({
      where: { date },
      orderBy: { createdAt: "desc" },
    });

    const allSessions = await db.focusSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalTodayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    // Subject breakdown today
    const subjectBreakdown: Record<string, number> = {};
    todaySessions.forEach((s) => {
      subjectBreakdown[s.subject] = (subjectBreakdown[s.subject] || 0) + s.durationMinutes;
    });

    return NextResponse.json({
      todaySessions,
      allSessions,
      totalTodayMinutes,
      subjectBreakdown,
    });
  } catch (error) {
    console.error("GET focus sessions error:", error);
    return NextResponse.json({ error: "Error al obtener sesiones de enfoque" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, durationMinutes } = body;
    const date = body.date || getLocalDateString();

    if (!subject || !durationMinutes) {
      return NextResponse.json({ error: "Materia y duración son obligatorios" }, { status: 400 });
    }

    const session = await db.focusSession.create({
      data: {
        subject: subject.trim(),
        durationMinutes: Number(durationMinutes),
        date,
      },
    });

    return NextResponse.json({
      success: true,
      session,
      xpEarned: 20,
    });
  } catch (error) {
    console.error("POST focus session error:", error);
    return NextResponse.json({ error: "Error al guardar sesión de enfoque" }, { status: 500 });
  }
}
