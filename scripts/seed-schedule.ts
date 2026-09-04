import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface BlockData {
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  category: "class" | "routine" | "personal" | "study";
  daysOfWeek: number[];
  location?: string;
}

// ═══ Colores por Materia ═══
// 🟣 #7C6EF6 — Álgebra Lineal
// 🩷 #E879F9 — Cálculo Vectorial
// 🔴 #F43F5E — Introducción a la Inteligencia Artificial
// 🔵 #3B82F6 — Fundamentos de Programación
// 🩵 #06B6D4 — Cómputo en la Nube
// 🟠 #F97316 — Matemáticas Discretas
// 🟢 #10B981 — Analítica de Datos

const blocks: BlockData[] = [
  // ═══════════════════════════════════════════════════
  // LUNES A VIERNES — Mañana compartida (1=Lun..5=Vie)
  // ═══════════════════════════════════════════════════
  { title: "🛌 Despertar",                  startTime: "06:00", endTime: "06:15", color: "#4ADE80", category: "routine",  daysOfWeek: [1,2,3,4,5] },
  { title: "🐕 Aika + ejercicio",           startTime: "06:15", endTime: "07:00", color: "#22D3EE", category: "personal", daysOfWeek: [1,2,3,4,5] },
  { title: "🚿 Higiene + desayuno + prep",  startTime: "07:00", endTime: "08:00", color: "#4ADE80", category: "routine",  daysOfWeek: [1,2,3,4,5] },
  { title: "☁️ AWS / MEXIA — sesión síncrona", startTime: "08:00", endTime: "11:00", color: "#3B82F6", category: "class", daysOfWeek: [1,2,3,4,5] },
  { title: "☕ Descanso",                    startTime: "11:00", endTime: "11:30", color: "#6B7280", category: "routine",  daysOfWeek: [1,2,3,4,5] },

  // ═══════════════════════════════════════════════════
  // LUNES & MIÉRCOLES — Mediodía + Tarde (1,3)
  // ═══════════════════════════════════════════════════
  { title: "🧠 Estudio / tareas TEC",        startTime: "11:30", endTime: "13:00", color: "#FB923C", category: "study",    daysOfWeek: [1,3] },
  { title: "🍽️ Comida",                      startTime: "13:00", endTime: "13:40", color: "#F59E0B", category: "routine",  daysOfWeek: [1,3] },
  { title: "🚗 Preparación + traslado",      startTime: "13:40", endTime: "14:20", color: "#6B7280", category: "routine",  daysOfWeek: [1,3] },
  // ── Clases TEC Lun & Mié ──
  {
    title: "📐 Álgebra Lineal",
    startTime: "15:00",
    endTime: "17:00",
    color: "#7C6EF6",
    category: "class",
    daysOfWeek: [1,3],
    location: "Aula O 06 · Profra. Sánchez Montaño Není",
  },
  {
    title: "📊 Cálculo Vectorial",
    startTime: "17:00",
    endTime: "19:00",
    color: "#E879F9",
    category: "class",
    daysOfWeek: [1,3],
    location: "Aula O 06 · Maestro 05 Básicas",
  },
  {
    title: "🤖 Introducción a la Inteligencia Artificial",
    startTime: "19:00",
    endTime: "21:00",
    color: "#F43F5E",
    category: "class",
    daysOfWeek: [1,3],
    location: "Aula V 01 · Prof. Vargas González Omar",
  },
  { title: "🏠 Regreso + cena",              startTime: "21:00", endTime: "22:00", color: "#4ADE80", category: "routine",  daysOfWeek: [1,3] },
  { title: "📋 Preparar día siguiente",      startTime: "22:00", endTime: "22:15", color: "#4ADE80", category: "routine",  daysOfWeek: [1,3] },

  // ═══════════════════════════════════════════════════
  // MARTES & JUEVES — Mediodía + Tarde (2,4)
  // ═══════════════════════════════════════════════════
  { title: "🍽️ Comida",                      startTime: "11:30", endTime: "12:15", color: "#F59E0B", category: "routine",  daysOfWeek: [2,4] },
  { title: "🚗 Preparación + traslado",      startTime: "12:15", endTime: "13:00", color: "#6B7280", category: "routine",  daysOfWeek: [2,4] },
  // ── Clases TEC Mar & Jue ──
  {
    title: "💻 Fundamentos de Programación",
    startTime: "13:00",
    endTime: "15:00",
    color: "#3B82F6",
    category: "class",
    daysOfWeek: [2,4],
    location: "Aula V 01 · Prof. Muñoz Collaso Ricardo",
  },
  {
    title: "☁️ Cómputo en la Nube",
    startTime: "15:00",
    endTime: "17:00",
    color: "#06B6D4",
    category: "class",
    daysOfWeek: [2,4],
    location: "Aula O 06 · Prof. Fajardo Delgado Daniel",
  },
  {
    title: "🔢 Matemáticas Discretas",
    startTime: "17:00",
    endTime: "19:00",
    color: "#F97316",
    category: "class",
    daysOfWeek: [2,4],
    location: "Aula V 01 · Prof. Vargas González Omar",
  },
  {
    title: "📈 Analítica de Datos",
    startTime: "19:00",
    endTime: "21:00",
    color: "#10B981",
    category: "class",
    daysOfWeek: [2,4],
    location: "Aula V 01 · Prof. Vargas González Omar",
  },
  { title: "🏠 Regreso + cena",              startTime: "21:00", endTime: "22:00", color: "#4ADE80", category: "routine",  daysOfWeek: [2,4] },
  { title: "📋 Preparar día siguiente",      startTime: "22:00", endTime: "22:15", color: "#4ADE80", category: "routine",  daysOfWeek: [2,4] },

  // ═══════════════════════════════════════════════════
  // VIERNES — Tarde (5)
  // ═══════════════════════════════════════════════════
  { title: "🧠 Estudio / tareas TEC",        startTime: "11:30", endTime: "12:30", color: "#FB923C", category: "study",    daysOfWeek: [5] },
  { title: "🍽️ Comida",                      startTime: "12:30", endTime: "13:15", color: "#F59E0B", category: "routine",  daysOfWeek: [5] },
  { title: "🚗 Preparación + traslado",      startTime: "13:15", endTime: "14:00", color: "#6B7280", category: "routine",  daysOfWeek: [5] },
  // ── Clases TEC Vie ──
  {
    title: "💻 Fundamentos de Programación",
    startTime: "14:00",
    endTime: "15:00",
    color: "#3B82F6",
    category: "class",
    daysOfWeek: [5],
    location: "Aula V 01 · Prof. Muñoz Collaso Ricardo",
  },
  {
    title: "📐 Álgebra Lineal",
    startTime: "15:00",
    endTime: "16:00",
    color: "#7C6EF6",
    category: "class",
    daysOfWeek: [5],
    location: "Aula O 08 · Profra. Sánchez Montaño Není",
  },
  { title: "☕ Descanso + comida",            startTime: "16:00", endTime: "17:00", color: "#6B7280", category: "routine",  daysOfWeek: [5] },
  {
    title: "📊 Cálculo Vectorial",
    startTime: "17:00",
    endTime: "18:00",
    color: "#E879F9",
    category: "class",
    daysOfWeek: [5],
    location: "Aula O 06 · Maestro 05 Básicas",
  },
  {
    title: "🔢 Matemáticas Discretas",
    startTime: "18:00",
    endTime: "19:00",
    color: "#F97316",
    category: "class",
    daysOfWeek: [5],
    location: "Aula V 01 · Prof. Vargas González Omar",
  },

  // ═══════════════════════════════════════════════════
  // SÁBADO (6)
  // ═══════════════════════════════════════════════════
  { title: "🛌 Despertar",                   startTime: "08:00", endTime: "08:30", color: "#4ADE80", category: "routine",  daysOfWeek: [6] },
  { title: "🍳 Desayuno",                    startTime: "08:30", endTime: "09:00", color: "#F59E0B", category: "routine",  daysOfWeek: [6] },
  { title: "☁️ AWS / MEXIA — autogestivo",    startTime: "09:00", endTime: "10:00", color: "#3B82F6", category: "study",   daysOfWeek: [6] },
  { title: "🧠 Estudio / tareas TEC",        startTime: "10:00", endTime: "11:00", color: "#FB923C", category: "study",    daysOfWeek: [6] },
  { title: "🐕 Aika + ejercicio",            startTime: "11:00", endTime: "12:00", color: "#22D3EE", category: "personal", daysOfWeek: [6] },
  { title: "🚿 Ducha + descanso",            startTime: "12:00", endTime: "13:00", color: "#4ADE80", category: "routine",  daysOfWeek: [6] },
  { title: "🍽️ Comida",                      startTime: "13:00", endTime: "14:00", color: "#F59E0B", category: "routine",  daysOfWeek: [6] },
  { title: "💻 Proyecto personal",            startTime: "14:00", endTime: "16:00", color: "#A78BFA", category: "personal", daysOfWeek: [6] },

  // ═══════════════════════════════════════════════════
  // DOMINGO (0)
  // ═══════════════════════════════════════════════════
  { title: "🛌 Despertar",                   startTime: "08:00", endTime: "08:30", color: "#4ADE80", category: "routine",  daysOfWeek: [0] },
  { title: "🍳 Desayuno",                    startTime: "08:30", endTime: "09:00", color: "#F59E0B", category: "routine",  daysOfWeek: [0] },
  { title: "☁️ AWS / MEXIA — autogestivo",    startTime: "09:00", endTime: "10:00", color: "#3B82F6", category: "study",   daysOfWeek: [0] },
  { title: "🧠 Revisión académica",          startTime: "10:00", endTime: "11:00", color: "#FB923C", category: "study",    daysOfWeek: [0] },
  { title: "🐕 Aika + caminata",             startTime: "11:00", endTime: "12:00", color: "#22D3EE", category: "personal", daysOfWeek: [0] },
  { title: "🚿 Ducha + descanso",            startTime: "12:00", endTime: "13:00", color: "#4ADE80", category: "routine",  daysOfWeek: [0] },
  { title: "🍽️ Comida",                      startTime: "13:00", endTime: "14:00", color: "#F59E0B", category: "routine",  daysOfWeek: [0] },
  { title: "📅 Planificación de la semana",   startTime: "14:00", endTime: "15:00", color: "#A78BFA", category: "routine",  daysOfWeek: [0] },
];

async function main() {
  console.log("🗑️  Limpiando bloques existentes...");
  await prisma.scheduleBlock.deleteMany();

  console.log(`📅 Insertando ${blocks.length} bloques con Aulas y Docentes...`);

  for (const block of blocks) {
    await prisma.scheduleBlock.create({
      data: {
        title: block.title,
        location: block.location || null,
        startTime: block.startTime,
        endTime: block.endTime,
        color: block.color,
        category: block.category,
        daysOfWeek: block.daysOfWeek,
        specificDate: null,
      },
    });
  }

  const count = await prisma.scheduleBlock.count();
  console.log(`✅ ¡Listo! ${count} bloques insertados con aulas y profesores.`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
