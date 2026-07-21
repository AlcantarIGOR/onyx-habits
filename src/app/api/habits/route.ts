import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const habits = await db.habit.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(habits);
  } catch (error) {
    console.error("GET Habits error:", error);
    return NextResponse.json({ error: "Error al obtener hábitos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, icon, color, type, daysOfWeek } = body;

    if (id) {
      const habit = await db.habit.update({
        where: { id },
        data: { name, description, icon, color, type, daysOfWeek },
      });
      return NextResponse.json(habit);
    } else {
      const habit = await db.habit.create({
        data: { name, description, icon, color, type: type || "good", daysOfWeek },
      });
      return NextResponse.json(habit);
    }
  } catch (error) {
    console.error("POST Habits error:", error);
    return NextResponse.json({ error: "Error al guardar hábito" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    await db.habit.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Habits error:", error);
    return NextResponse.json({ error: "Error al eliminar hábito" }, { status: 500 });
  }
}
