import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notes = await db.stickyNote.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET Notes error:", error);
    return NextResponse.json({ error: "Error al obtener notas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, color } = body;

    if (!content || !color) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const note = await db.stickyNote.create({
      data: { content, color },
    });
    return NextResponse.json(note);
  } catch (error) {
    console.error("POST Notes error:", error);
    return NextResponse.json({ error: "Error al guardar nota" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    await db.stickyNote.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Notes error:", error);
    return NextResponse.json({ error: "Error al eliminar nota" }, { status: 500 });
  }
}
