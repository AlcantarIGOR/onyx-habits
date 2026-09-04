import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trackers = await db.sobrietyTracker.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(trackers);
  } catch (error) {
    console.error("GET Sobriety error:", error);
    return NextResponse.json({ error: "Error al obtener contadores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, lastResetDate, targetDate } = body;

    if (!name || !lastResetDate || !targetDate) {
      return NextResponse.json(
        { error: "Nombre, fecha de inicio y fecha meta son requeridos" },
        { status: 400 }
      );
    }

    const tracker = await db.sobrietyTracker.create({
      data: {
        name,
        icon: icon || "🚭",
        lastResetDate,
        targetDate,
      },
    });
    return NextResponse.json(tracker);
  } catch (error) {
    console.error("POST Sobriety error:", error);
    return NextResponse.json({ error: "Error al crear contador" }, { status: 500 });
  }
}

// PUT — update lastResetDate (record a slip/reset) or update target
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, lastResetDate, targetDate, name, icon } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    const tracker = await db.sobrietyTracker.update({
      where: { id },
      data: {
        ...(lastResetDate !== undefined && { lastResetDate }),
        ...(targetDate !== undefined && { targetDate }),
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
      },
    });
    return NextResponse.json(tracker);
  } catch (error) {
    console.error("PUT Sobriety error:", error);
    return NextResponse.json({ error: "Error al actualizar contador" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

    await db.sobrietyTracker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Sobriety error:", error);
    return NextResponse.json({ error: "Error al eliminar contador" }, { status: 500 });
  }
}
