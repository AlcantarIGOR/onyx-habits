import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD — returns blocks for that day of week + one-offs
  const all = searchParams.get("all");   // if "true", return all blocks

  try {
    if (all === "true") {
      const blocks = await db.scheduleBlock.findMany({
        orderBy: [{ startTime: "asc" }],
      });
      return NextResponse.json(blocks);
    }

    if (date) {
      const dayOfWeek = new Date(date + "T12:00:00").getDay();

      // Get recurring blocks for this day of week + one-offs for this specific date
      const blocks = await db.scheduleBlock.findMany({
        where: {
          OR: [
            { daysOfWeek: { has: dayOfWeek } },
            { specificDate: date },
          ],
        },
        orderBy: { startTime: "asc" },
      });
      return NextResponse.json(blocks);
    }

    // Default: return all
    const blocks = await db.scheduleBlock.findMany({
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("GET Schedule error:", error);
    return NextResponse.json({ error: "Error al obtener horario" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, location, startTime, endTime, color, category, daysOfWeek, specificDate } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Título, hora inicio y hora fin son requeridos" }, { status: 400 });
    }

    const block = await db.scheduleBlock.create({
      data: {
        title,
        location: location || null,
        startTime,
        endTime,
        color: color || "#8B9FCA",
        category: category || "class",
        daysOfWeek: daysOfWeek || [],
        specificDate: specificDate || null,
      },
    });
    return NextResponse.json(block);
  } catch (error) {
    console.error("POST Schedule error:", error);
    return NextResponse.json({ error: "Error al crear bloque" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, location, startTime, endTime, color, category, daysOfWeek, specificDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    const block = await db.scheduleBlock.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(location !== undefined && { location }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(color !== undefined && { color }),
        ...(category !== undefined && { category }),
        ...(daysOfWeek !== undefined && { daysOfWeek }),
        ...(specificDate !== undefined && { specificDate }),
      },
    });
    return NextResponse.json(block);
  } catch (error) {
    console.error("PUT Schedule error:", error);
    return NextResponse.json({ error: "Error al actualizar bloque" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    await db.scheduleBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Schedule error:", error);
    return NextResponse.json({ error: "Error al eliminar bloque" }, { status: 500 });
  }
}
