import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const date = searchParams.get("date");   // YYYY-MM-DD

  try {
    if (date) {
      const events = await db.calendarEvent.findMany({
        where: { date },
        orderBy: { time: "asc" },
      });
      return NextResponse.json(events);
    }

    if (month) {
      // Fetch all events for a given month
      const events = await db.calendarEvent.findMany({
        where: {
          date: {
            startsWith: month,
          },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      });
      return NextResponse.json(events);
    }

    // Default: return all events
    const events = await db.calendarEvent.findMany({
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("GET Events error:", error);
    return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, date, time, color } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "Título y fecha son requeridos" }, { status: 400 });
    }

    const event = await db.calendarEvent.create({
      data: {
        title,
        description: description || null,
        date,
        time: time || null,
        color: color || "#8B9FCA",
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error("POST Events error:", error);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    await db.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Events error:", error);
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 });
  }
}
