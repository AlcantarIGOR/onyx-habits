import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    if (date) {
      const reflection = await db.dailyReflection.findUnique({
        where: { date },
      });
      return NextResponse.json(reflection);
    }

    const reflections = await db.dailyReflection.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(reflections);
  } catch (error) {
    console.error("GET Reflections error:", error);
    return NextResponse.json({ error: "Error al obtener reflexiones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, flowRating, victory, lesson, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Falta la fecha" }, { status: 400 });
    }

    const reflection = await db.dailyReflection.upsert({
      where: { date },
      update: {
        flowRating: flowRating ?? 3,
        victory: victory || null,
        lesson: lesson || null,
        notes: notes || null,
      },
      create: {
        date,
        flowRating: flowRating ?? 3,
        victory: victory || null,
        lesson: lesson || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(reflection);
  } catch (error) {
    console.error("POST Reflections error:", error);
    return NextResponse.json({ error: "Error al guardar reflexión" }, { status: 500 });
  }
}
