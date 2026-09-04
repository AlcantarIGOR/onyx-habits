import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// Convert day index (0=Sun..6=Sat) to iCal RRULE BYDAY format
const BYDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function formatICalDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, "");
  const cleanTime = timeStr.replace(/:/g, "") + "00";
  return `${cleanDate}T${cleanTime}`;
}

export async function GET() {
  try {
    const blocks = await db.scheduleBlock.findMany({
      orderBy: { startTime: "asc" },
    });

    const now = new Date();
    const nowStr = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    // Find the Monday of current week as baseline for recurring events
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const baseMonday = new Date(now);
    baseMonday.setDate(now.getDate() + mondayOffset);

    const getBaseDateForDay = (targetDay: number) => {
      const d = new Date(baseMonday);
      const diff = targetDay === 0 ? 6 : targetDay - 1;
      d.setDate(baseMonday.getDate() + diff);
      return d.toISOString().split("T")[0];
    };

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mi Espacio//ONYX Personal OS//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Horario TEC & AWS — Mi Espacio",
      "X-WR-TIMEZONE:America/Mexico_City",
      "X-WR-CALDESC:Horario sincronizado de clases TEC, sesiones AWS y rutinas",
    ];

    for (const block of blocks) {
      const isRecurring = block.daysOfWeek && block.daysOfWeek.length > 0;

      if (isRecurring) {
        // Group by days or create weekly recurring event
        const firstDay = block.daysOfWeek[0];
        const baseDate = getBaseDateForDay(firstDay);
        const dtStart = formatICalDateTime(baseDate, block.startTime);
        const dtEnd = formatICalDateTime(baseDate, block.endTime);
        const byDays = block.daysOfWeek.map((d) => BYDAY_MAP[d]).join(",");

        icsContent.push(
          "BEGIN:VEVENT",
          `UID:schedule-${block.id}@miespacio.onyx`,
          `DTSTAMP:${nowStr}`,
          `DTSTART;TZID=America/Mexico_City:${dtStart}`,
          `DTEND;TZID=America/Mexico_City:${dtEnd}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${byDays}`,
          `SUMMARY:${block.title}`,
          block.location ? `LOCATION:${block.location}` : "LOCATION:TEC",
          `DESCRIPTION:Categoría: ${block.category}`,
          "STATUS:CONFIRMED",
          "END:VEVENT"
        );
      } else if (block.specificDate) {
        const dtStart = formatICalDateTime(block.specificDate, block.startTime);
        const dtEnd = formatICalDateTime(block.specificDate, block.endTime);

        icsContent.push(
          "BEGIN:VEVENT",
          `UID:schedule-${block.id}@miespacio.onyx`,
          `DTSTAMP:${nowStr}`,
          `DTSTART;TZID=America/Mexico_City:${dtStart}`,
          `DTEND;TZID=America/Mexico_City:${dtEnd}`,
          `SUMMARY:${block.title}`,
          block.location ? `LOCATION:${block.location}` : "LOCATION:TEC",
          `DESCRIPTION:Categoría: ${block.category}`,
          "STATUS:CONFIRMED",
          "END:VEVENT"
        );
      }
    }

    icsContent.push("END:VCALENDAR");

    const body = icsContent.join("\r\n");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="mi-espacio-horario.ics"',
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("iCal generation error:", error);
    return NextResponse.json(
      { error: "Error al generar calendario iCal" },
      { status: 500 }
    );
  }
}
