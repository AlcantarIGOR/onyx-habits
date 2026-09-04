import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const completedDate = searchParams.get("completedDate");
  const pending = searchParams.get("pending");

  try {
    // Fetch tasks completed on a specific date (for daily log)
    if (completedDate) {
      const startOfDay = new Date(`${completedDate}T00:00:00`);
      const endOfDay = new Date(`${completedDate}T23:59:59.999`);

      const tasks = await db.task.findMany({
        where: {
          completedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          completed: true,
        },
        orderBy: { completedAt: "desc" },
      });
      return NextResponse.json(tasks);
    }

    // Fetch all pending tasks + completed tasks from today
    // This ensures pending tasks NEVER disappear when a new day starts
    if (pending === "true" && date) {
      const tasks = await db.task.findMany({
        where: {
          OR: [
            { completed: false },              // ALL pending tasks regardless of date
            { completed: true, date },          // Completed tasks from today only
          ],
        },
        orderBy: [
          { completed: "asc" },   // Pending first
          { createdAt: "asc" },
        ],
      });
      return NextResponse.json(tasks);
    }

    // Fetch tasks by date (legacy/fallback)
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
      // Fetch current state to determine if we're toggling completion
      const existingTask = await db.task.findUnique({ where: { id } });
      
      const completedAt = completed && !existingTask?.completed
        ? new Date()
        : completed
          ? existingTask?.completedAt
          : null;

      const task = await db.task.update({
        where: { id },
        data: { text, completed, priority, completedAt },
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

// PUT — Edit task text/priority without changing completion
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, text, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(priority !== undefined && { priority }),
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("PUT Tasks error:", error);
    return NextResponse.json({ error: "Error al editar tarea" }, { status: 500 });
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
