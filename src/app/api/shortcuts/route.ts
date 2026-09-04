import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getLocalDateString, getLocalDayOfWeek } from "@/lib/storage";

export const dynamic = "force-dynamic";

function checkAuth(request: Request, url: URL): boolean {
  const expectedPIN = process.env.ACCESS_PIN || "3340";
  const pinParam = url.searchParams.get("pin") || url.searchParams.get("token");
  const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");
  return pinParam === expectedPIN || authHeader === expectedPIN;
}

// Universal emoji remover using Unicode Extended_Pictographic property to ensure Siri NEVER pronounces emojis
function stripEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[·•—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Clean string by removing accents and symbols for habit fuzzy search
function cleanString(str: string): string {
  if (!str) return "";
  const noEmoji = stripEmojis(str);
  return noEmoji
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Universal habit finder that searches by name or partial text across all database habits
async function findHabitByAnyText(queryText: string) {
  const allHabits = await db.habit.findMany();
  const cleaned = cleanString(queryText);
  if (!cleaned) return null;

  let match = allHabits.find((h) => cleanString(h.name) === cleaned);
  if (match) return match;

  match = allHabits.find((h) => {
    const hCleaned = cleanString(h.name);
    return hCleaned.includes(cleaned) || cleaned.includes(hCleaned);
  });
  if (match) return match;

  match = allHabits.find((h) => {
    const descCleaned = cleanString(h.description || "");
    return descCleaned.includes(cleaned);
  });
  return match || null;
}

// Extract full sentence from GET query or raw request URL
function extractFullTaskText(requestUrl: string, searchParams: URLSearchParams): string {
  let text = searchParams.get("text") || searchParams.get("q") || searchParams.get("tarea") || "";

  try {
    const rawUrl = requestUrl;
    const textIdx = rawUrl.indexOf("text=");
    if (textIdx !== -1) {
      let rawText = rawUrl.substring(textIdx + 5);
      const nextAmp = rawText.search(/&(?:pin|token|action|date)=/i);
      if (nextAmp !== -1) {
        rawText = rawText.substring(0, nextAmp);
      }
      try {
        const decoded = decodeURIComponent(rawText.replace(/\+/g, " "));
        if (decoded.length > text.length) {
          text = decoded;
        }
      } catch {
        const cleaned = rawText.replace(/\+/g, " ");
        if (cleaned.length > text.length) {
          text = cleaned;
        }
      }
    }
  } catch (e) {
    console.error("Error extracting task text:", e);
  }

  return text.trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!checkAuth(request, url)) {
    return NextResponse.json({ error: "PIN no autorizado", success: false }, { status: 401 });
  }

  const action = url.searchParams.get("action") || "menu";
  const dayParam = url.searchParams.get("day") || "";
  const isTomorrow = dayParam === "tomorrow" || dayParam === "manana" || action === "tomorrow" || action === "tomorrow-classes";

  const now = new Date();
  const targetDate = isTomorrow ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
  const targetDateStr = url.searchParams.get("date") || getLocalDateString(targetDate);
  const targetDayOfWeek = getLocalDayOfWeek(targetDate);

  try {
    // ── 1. Acción: Menú de Hábitos (para Atajos / Centro de Control) ──
    if (action === "menu" || action === "habits" || action === "list") {
      const showAll = url.searchParams.get("all") === "true";

      const habits = await db.habit.findMany({
        where: { daysOfWeek: { has: targetDayOfWeek } },
        orderBy: [{ type: "asc" }, { createdAt: "asc" }],
      });

      const logs = await db.habitLog.findMany({
        where: { date: targetDateStr, completed: true },
      });

      const completedIds = new Set(logs.map((l) => l.habitId));

      const items = habits.map((h) => {
        const isDone = completedIds.has(h.id);
        const prefix =
          h.type === "fundamental" ? "🔴 " : h.type === "growth" ? "🟢 " : "🟡 ";
        return {
          id: h.id,
          name: h.name,
          displayName: `${prefix}${h.name}${isDone ? " ✓" : ""}`,
          type: h.type,
          completed: isDone,
        };
      });

      const pendingItems = items.filter((i) => !i.completed);
      const targetItems = showAll ? items : (pendingItems.length > 0 ? pendingItems : items);

      if (targetItems.length === 0) {
        return NextResponse.json(["Completaste todos tus hábitos de hoy"]);
      }

      return NextResponse.json(targetItems.map((i) => i.displayName));
    }

    // ── 2. Acción: Marcar Hábito ──────────────────────────────
    if (action === "log" || action === "toggle" || url.searchParams.has("name") || url.searchParams.has("habit")) {
      const habitId = url.searchParams.get("habitId");
      let rawName =
        url.searchParams.get("name") ||
        url.searchParams.get("habit") ||
        url.searchParams.get("item") ||
        url.searchParams.get("q") ||
        "";

      if (!rawName && !habitId) {
        for (const [key, value] of url.searchParams.entries()) {
          if (key !== "action" && key !== "pin" && key !== "token" && key !== "date" && key !== "day") {
            rawName = value || key;
            break;
          }
        }
      }

      let targetHabit = null;
      if (habitId) {
        targetHabit = await db.habit.findUnique({ where: { id: habitId } });
      } else if (rawName) {
        targetHabit = await findHabitByAnyText(rawName);
      }

      if (!targetHabit) {
        const cleanRaw = stripEmojis(rawName);
        return new NextResponse(`Hábito ${cleanRaw} no encontrado en tu lista.`, {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const existingLog = await db.habitLog.findUnique({
        where: { habitId_date: { habitId: targetHabit.id, date: targetDateStr } },
      });

      if (existingLog) {
        await db.habitLog.update({
          where: { id: existingLog.id },
          data: { completed: true },
        });
      } else {
        await db.habitLog.create({
          data: {
            habitId: targetHabit.id,
            date: targetDateStr,
            completed: true,
          },
        });
      }

      const todayLogs = await db.habitLog.count({
        where: { date: targetDateStr, completed: true },
      });

      const todayActiveTotal = await db.habit.count({
        where: { daysOfWeek: { has: targetDayOfWeek } },
      });

      const cleanHabitName = stripEmojis(targetHabit.name);
      const celebrationMsg = `Listo. ${cleanHabitName} registrado. Llevas ${todayLogs} de ${todayActiveTotal} hábitos hoy.`;

      return new NextResponse(celebrationMsg, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── 3. Acción: Próxima Clase Hoy o Clases de Mañana (Siri Spoken) ──
    if (action === "next-class" || action === "class" || action === "status" || isTomorrow) {
      const blocks = await db.scheduleBlock.findMany({
        where: {
          OR: [
            { daysOfWeek: { has: targetDayOfWeek } },
            { specificDate: targetDateStr },
          ],
        },
        orderBy: { startTime: "asc" },
      });

      // ── Subcaso A: Consulta para Mañana ──
      if (isTomorrow) {
        if (blocks.length === 0) {
          return new NextResponse("Mañana no tienes clases programadas en tu horario. Día libre.", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        // Prioritize classes if available, otherwise show all blocks
        const classBlocks = blocks.filter((b) => b.category === "class" || Boolean(b.location));
        const targetBlocks = classBlocks.length > 0 ? classBlocks : blocks;

        const classListText = targetBlocks
          .map((b) => {
            const cleanTitle = stripEmojis(b.title);
            const cleanLoc = stripEmojis(b.location || "");
            return `${cleanTitle} a las ${b.startTime}${cleanLoc ? ` en ${cleanLoc}` : ""}`;
          })
          .join(", ");

        const msg = `Mañana tienes ${targetBlocks.length} ${targetBlocks.length === 1 ? "clase" : "clases"}: ${classListText}.`;
        return new NextResponse(msg, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      // ── Subcaso B: Consulta para Hoy ──
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Mexico_City",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const parts = timeFormatter.formatToParts(now);
      const hPart = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
      const mPart = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
      const currentMins = hPart * 60 + mPart;

      const timeToMins = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      const current = blocks.find((b) => {
        const start = timeToMins(b.startTime);
        const end = timeToMins(b.endTime);
        return currentMins >= start && currentMins < end;
      });

      if (current) {
        const remaining = timeToMins(current.endTime) - currentMins;
        const cleanTitle = stripEmojis(current.title);
        const cleanLoc = stripEmojis(current.location || "");
        const msg = `Estás en ${cleanTitle}${cleanLoc ? ` en ${cleanLoc}` : ""}. Restan ${remaining} minutos de clase.`;
        return new NextResponse(msg, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const upcoming = blocks.find((b) => timeToMins(b.startTime) > currentMins);

      if (upcoming) {
        const diff = timeToMins(upcoming.startTime) - currentMins;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        const timeStr = hours > 0 ? `${hours} horas y ${mins} minutos` : `${mins} minutos`;
        const cleanTitle = stripEmojis(upcoming.title);
        const cleanLoc = stripEmojis(upcoming.location || "");
        const msg = `Tu siguiente actividad es ${cleanTitle} a las ${upcoming.startTime}${cleanLoc ? ` en ${cleanLoc}` : ""}, comienza en ${timeStr}.`;
        return new NextResponse(msg, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return new NextResponse("Has terminado todas tus clases y actividades programadas por hoy.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── 4. Acción: Morning / Daily Spoken Briefing para Siri ───
    if (action === "briefing" || action === "morning" || action === "resumen") {
      const activeHabits = await db.habit.findMany({
        where: { daysOfWeek: { has: targetDayOfWeek } },
      });
      const logs = await db.habitLog.findMany({
        where: { date: targetDateStr, completed: true },
      });
      const completedIds = new Set(logs.map((l) => l.habitId));
      const pendingHabits = activeHabits.filter((h) => !completedIds.has(h.id));
      const fundamentalPending = pendingHabits.filter((h) => h.type === "fundamental");

      const pendingTasks = await db.task.findMany({
        where: { completed: false },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      });
      const highPriorityCount = pendingTasks.filter((t) => t.priority === "high").length;

      const blocks = await db.scheduleBlock.findMany({
        where: {
          OR: [{ daysOfWeek: { has: targetDayOfWeek } }, { specificDate: targetDateStr }],
        },
        orderBy: { startTime: "asc" },
      });

      const nextClass = blocks[0];

      let briefing = `Hola Juan. `;
      if (nextClass) {
        const cleanTitle = stripEmojis(nextClass.title);
        const cleanLoc = stripEmojis(nextClass.location || "");
        briefing += `Hoy tu primer bloque es ${cleanTitle} a las ${nextClass.startTime}${cleanLoc ? ` en ${cleanLoc}` : ""}. `;
      } else {
        briefing += `Hoy no tienes clases programadas en tu horario. `;
      }

      if (fundamentalPending.length > 0) {
        briefing += `Tienes ${fundamentalPending.length} hábitos fundamentales pendientes. `;
      } else {
        briefing += `Vas excelente con tus hábitos de hoy. `;
      }

      if (highPriorityCount > 0) {
        briefing += `Tienes ${highPriorityCount} tareas de alta prioridad. `;
      }

      briefing += `A dar el máximo hoy.`;

      return new NextResponse(briefing, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── 5. Acción: Despertador 06:00 AM Automatizado ──────────
    if (action === "alarm-wakeup" || action === "wakeup") {
      const wakeupHabit = await findHabitByAnyText("Despertar a las 06:00");
      if (wakeupHabit) {
        await db.habitLog.upsert({
          where: { habitId_date: { habitId: wakeupHabit.id, date: targetDateStr } },
          create: { habitId: wakeupHabit.id, date: targetDateStr, completed: true },
          update: { completed: true },
        });
      }

      const msg = `Buenos días Juan. Despertar a las 06:00 registrado con éxito, más 30 puntos de experiencia. A conquistar el día.`;
      return new NextResponse(msg, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── 6. Acción: Añadir Tarea Rápida por Siri (GET Robusto) ──
    if (action === "task" || action === "add-task") {
      const fullText = extractFullTaskText(request.url, url.searchParams);

      if (!fullText) {
        return new NextResponse("No se especificó el texto de la tarea.", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const lower = fullText.toLowerCase();
      let priority = "medium";
      if (lower.includes("urgente") || lower.includes("alta") || lower.includes("examen") || lower.includes("importante")) {
        priority = "high";
      } else if (lower.includes("baja") || lower.includes("despues") || lower.includes("opcional")) {
        priority = "low";
      }

      const cleanText = fullText
        .replace(/\burgente\b/gi, "")
        .replace(/\bprioridad alta\b/gi, "")
        .replace(/\bprioridad baja\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      const taskContent = cleanText || fullText;

      const created = await db.task.create({
        data: {
          text: taskContent,
          completed: false,
          priority,
          date: targetDateStr,
        },
      });

      const priorityLabel = priority === "high" ? "Alta" : priority === "low" ? "Baja" : "Media";
      const spokenMsg = `Listo. Tarea guardada: ${created.text}, con prioridad ${priorityLabel}.`;

      return new NextResponse(spokenMsg, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Shortcuts GET error:", error);
    return new NextResponse("Error al procesar en Mi Espacio", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  try {
    let body: Record<string, unknown> = {};
    const textBody = await request.text().catch(() => "");

    try {
      body = JSON.parse(textBody);
    } catch {
      body = { raw: textBody };
    }

    const expectedPIN = process.env.ACCESS_PIN || "3340";
    const pinParam =
      url.searchParams.get("pin") ||
      url.searchParams.get("token") ||
      (body.pin as string) ||
      (body.token as string);
    const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");

    if (pinParam !== expectedPIN && authHeader !== expectedPIN) {
      return NextResponse.json({ error: "PIN no autorizado", success: false }, { status: 401 });
    }

    const action = (body.action as string) || url.searchParams.get("action") || "log";
    const todayStr = (body.date as string) || url.searchParams.get("date") || getLocalDateString();
    const dayOfWeek = getLocalDayOfWeek();

    // ── 1. Acción: Guardar Tarea Dictada por Voz (POST) ────────
    if (action === "task" || body.taskText || body.text) {
      const text = ((body.text as string) || (body.taskText as string) || (body.raw as string) || "").trim();
      if (!text) {
        return new NextResponse("Texto de tarea vacío.", { status: 400 });
      }

      const lower = text.toLowerCase();
      let priority = (body.priority as string) || "medium";
      if (lower.includes("urgente") || lower.includes("alta") || lower.includes("examen")) {
        priority = "high";
      }

      const cleanText = text
        .replace(/\burgente\b/gi, "")
        .replace(/\bprioridad alta\b/gi, "")
        .replace(/\bprioridad baja\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      const task = await db.task.create({
        data: {
          text: cleanText || text,
          completed: false,
          priority,
          date: todayStr,
        },
      });

      const priorityLabel = priority === "high" ? "Alta" : "Media";
      return new NextResponse(`Listo. Tarea guardada: ${task.text}, con prioridad ${priorityLabel}.`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── 2. Acción: Guardar Reflexión Rápida por Voz ───────────
    if (action === "reflection") {
      const victory = (body.victory as string) || (body.raw as string) || "";
      const lesson = (body.lesson as string) || "";

      await db.dailyReflection.upsert({
        where: { date: todayStr },
        create: {
          date: todayStr,
          flowRating: 5,
          victory: victory || null,
          lesson: lesson || null,
        },
        update: {
          ...(victory && { victory }),
          ...(lesson && { lesson }),
        },
      });

      return new NextResponse("Reflexión diaria registrada, más 35 puntos de experiencia en Intelecto.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── 3. Acción: Marcar Hábito ──────────────────────────────
    if (action === "log" || action === "toggle" || body.name || body.habit || body.raw) {
      const habitId = (body.habitId as string) || url.searchParams.get("habitId");
      const name =
        (body.name as string) ||
        (body.habit as string) ||
        (body.item as string) ||
        (body.raw as string) ||
        url.searchParams.get("name") ||
        "";

      let targetHabit = null;
      if (habitId) {
        targetHabit = await db.habit.findUnique({ where: { id: habitId } });
      } else if (name) {
        targetHabit = await findHabitByAnyText(name);
      }

      if (!targetHabit) {
        const cleanRaw = stripEmojis(name);
        return new NextResponse(`Hábito ${cleanRaw} no encontrado en tu lista.`, {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const existingLog = await db.habitLog.findUnique({
        where: { habitId_date: { habitId: targetHabit.id, date: todayStr } },
      });

      if (existingLog) {
        await db.habitLog.update({
          where: { id: existingLog.id },
          data: { completed: true },
        });
      } else {
        await db.habitLog.create({
          data: {
            habitId: targetHabit.id,
            date: todayStr,
            completed: true,
          },
        });
      }

      const todayLogs = await db.habitLog.count({
        where: { date: todayStr, completed: true },
      });

      const todayActiveTotal = await db.habit.count({
        where: { daysOfWeek: { has: dayOfWeek } },
      });

      const cleanHabitName = stripEmojis(targetHabit.name);
      const celebrationMsg = `Listo. ${cleanHabitName} registrado. Llevas ${todayLogs} de ${todayActiveTotal} hábitos hoy.`;

      return new NextResponse(celebrationMsg, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({ error: "Acción no reconocida", success: false }, { status: 400 });
  } catch (error) {
    console.error("POST Shortcuts error:", error);
    return new NextResponse("Error interno en Mi Espacio", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
