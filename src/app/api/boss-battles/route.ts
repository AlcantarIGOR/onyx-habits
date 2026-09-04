import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const battles = await db.bossBattle.findMany({
      orderBy: [{ completed: "asc" }, { deadlineDate: "asc" }, { deadlineTime: "asc" }],
    });
    return NextResponse.json(battles);
  } catch (error) {
    console.error("GET Boss Battles error:", error);
    return NextResponse.json({ error: "Error al obtener Boss Battles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subject, deadlineDate, deadlineTime, type, notes } = body;

    if (!title || !deadlineDate) {
      return NextResponse.json({ error: "Título y fecha límite requeridos" }, { status: 400 });
    }

    const battle = await db.bossBattle.create({
      data: {
        title: title.trim(),
        subject: (subject || "General").trim(),
        deadlineDate,
        deadlineTime: deadlineTime || null,
        type: type || "exam",
        notes: notes || null,
        completed: false,
      },
    });

    return NextResponse.json(battle);
  } catch (error) {
    console.error("POST Boss Battle error:", error);
    return NextResponse.json({ error: "Error al crear Boss Battle" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const battle = await db.bossBattle.update({
      where: { id },
      data: {
        completed: Boolean(completed),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      battle,
      xpEarned: completed ? 100 : 0,
    });
  } catch (error) {
    console.error("PATCH Boss Battle error:", error);
    return NextResponse.json({ error: "Error al actualizar Boss Battle" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.bossBattle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Boss Battle error:", error);
    return NextResponse.json({ error: "Error al eliminar Boss Battle" }, { status: 500 });
  }
}
