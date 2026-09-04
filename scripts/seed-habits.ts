import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface HabitData {
  name: string;
  description: string;
  icon: string;
  color: string;
  type: "fundamental" | "maintenance" | "growth";
  daysOfWeek: number[];
}

const HABITS: HabitData[] = [
  // ═══════════════════════════════════════════════════
  // 🔴 1. HÁBITOS FUNDAMENTALES (6)
  // ═══════════════════════════════════════════════════
  {
    name: "Dormir a las 22:15",
    description: "21:45 desconexión · 22:00 higiene · 22:15 dormido (7h 45m meta)",
    icon: "moon",
    color: "#F43F5E",
    type: "fundamental",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Despertar a las 06:00",
    description: "Levantarse al sonar la alarma sin posponer ni volver a acostarse",
    icon: "sunrise",
    color: "#F59E0B",
    type: "fundamental",
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    name: "Asistir a AWS / MEXIA",
    description: "08:00–11:00 L-V · Puntualidad, permanencia, participación y apuntes",
    icon: "cloud",
    color: "#3B82F6",
    type: "fundamental",
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    name: "Salir con Aika / Ejercicio",
    description: "Actividad física diaria (ideal 40–45 min · cumplido 25–40 min · mín 15–20 min)",
    icon: "dog",
    color: "#22D3EE",
    type: "fundamental",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Cumplir bloque académico TEC",
    description: "Tareas, ejercicios, repaso, preparación de clases y proyectos",
    icon: "school",
    color: "#7C6EF6",
    type: "fundamental",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Primera hora sin redes sociales",
    description: "06:00–07:00 · Cero Instagram, TikTok, Shorts o feed innecesario",
    icon: "smartphone",
    color: "#E879F9",
    type: "fundamental",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },

  // ═══════════════════════════════════════════════════
  // 🟡 2. HÁBITOS DE MANTENIMIENTO (6)
  // ═══════════════════════════════════════════════════
  {
    name: "Meditación matutina",
    description: "07:00–07:10 · Mínimo 10 min de respiración, calma y atención plena",
    icon: "brain",
    color: "#F59E0B",
    type: "maintenance",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Meditación nocturna",
    description: "21:50–22:00 · Mínimo 10 min para reducir estímulos y desconectar",
    icon: "moon",
    color: "#8B9FCA",
    type: "maintenance",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Comida matutina de Aika",
    description: "Darle a Aika su alimento de la mañana",
    icon: "dog",
    color: "#4ADE80",
    type: "maintenance",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Comida vespertina de Aika",
    description: "Darle a Aika su alimento de la tarde / noche",
    icon: "dog",
    color: "#10B981",
    type: "maintenance",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Hidratación adecuada",
    description: "Al despertar, durante AWS, comidas, post-ejercicio y clases",
    icon: "droplet",
    color: "#06B6D4",
    type: "maintenance",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Ordenar habitación / escritorio",
    description: "5–10 min · Escritorio despejado, materiales guardados y espacio limpio",
    icon: "sparkles",
    color: "#D4A574",
    type: "maintenance",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },

  // ═══════════════════════════════════════════════════
  // 🟢 3. HÁBITOS DE CRECIMIENTO (5)
  // ═══════════════════════════════════════════════════
  {
    name: "Lectura deliberada",
    description: "15–20 min · Tech, programación, IA, filosofía o desarrollo",
    icon: "book",
    color: "#4ADE80",
    type: "growth",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Proyecto personal",
    description: "1–2 horas · Avance constante en ONYX / desarrollo web / IA",
    icon: "code",
    color: "#7C6EF6",
    type: "growth",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Estudio adicional",
    description: "45–60 min · Python, Git/GitHub, SQL, AWS o inglés técnico",
    icon: "target",
    color: "#FB923C",
    type: "growth",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: "Revisión de finanzas",
    description: "15–20 min semanal · Ingresos, gastos, deudas y ahorro",
    icon: "wallet",
    color: "#10B981",
    type: "growth",
    daysOfWeek: [0], // Domingos
  },
  {
    name: "Diario / Reflexión",
    description: "5 min · ¿Qué hice bien? ¿Qué salió mal? ¿Qué mejorar mañana?",
    icon: "edit",
    color: "#A78BFA",
    type: "growth",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
];

async function main() {
  console.log("🗑️  Limpiando hábitos existentes...");
  await prisma.habit.deleteMany();

  console.log(`✨ Insertando ${HABITS.length} hábitos estructurados en 3 categorías...`);

  for (const h of HABITS) {
    await prisma.habit.create({
      data: {
        name: h.name,
        description: h.description,
        icon: h.icon,
        color: h.color,
        type: h.type,
        daysOfWeek: h.daysOfWeek,
      },
    });
  }

  const count = await prisma.habit.count();
  console.log(`✅ ¡Listo! ${count} hábitos insertados exitosamente.`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
