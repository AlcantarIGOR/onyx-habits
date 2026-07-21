import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    const tasks = await db.task.findMany({
      where: date ? { date } : {},
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET Tasks error:", error);
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, text, completed, priority, date } = body;

    if (id) {
      const task = await db.task.update({
        where: { id },
        data: { text, completed, priority },
      });
      return NextResponse.json(task);
    } else {
      const task = await db.task.create({
        data: { text, completed: completed || false, priority, date },
      });
      return NextResponse.json(task);
    }
  } catch (error) {
    console.error("POST Tasks error:", error);
    return NextResponse.json({ error: "Error al guardar tarea" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    await db.task.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Tasks error:", error);
    return NextResponse.json({ error: "Error al eliminar tarea" }, { status: 500 });
  }
}
