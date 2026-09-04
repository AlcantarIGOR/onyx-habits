import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { getLocalDateString, getLocalDayOfWeek } from "../src/lib/storage";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanString(str: string): string {
  if (!str) return "";
  try {
    const decoded = decodeURIComponent(str);
    return decoded
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[🔴🟡🟢✓😴🌅☁️🐕📚📱🧘💧🧹📖💻🧠💰📝🚭\r\n\t]/gu, " ")
      .replace(/[^\w\s]/g, " ")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  } catch {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[🔴🟡🟢✓😴🌅☁️🐕📚📱🧘💧🧹📖💻🧠💰📝🚭\r\n\t]/gu, " ")
      .replace(/[^\w\s]/g, " ")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }
}

async function testPostHandler(bodyName: string) {
  const todayStr = getLocalDateString();
  const dayOfWeek = getLocalDayOfWeek();
  console.log("Testing POST with name:", bodyName);

  const allHabits = await prisma.habit.findMany();
  const cleaned = cleanString(bodyName);

  let targetHabit = allHabits.find((h) => cleanString(h.name) === cleaned);
  if (!targetHabit) {
    targetHabit = allHabits.find((h) => {
      const hCleaned = cleanString(h.name);
      return hCleaned.includes(cleaned) || cleaned.includes(hCleaned);
    });
  }
  if (!targetHabit) {
    targetHabit = allHabits.find((h) => {
      const descCleaned = cleanString(h.description || "");
      return descCleaned.includes(cleaned);
    });
  }

  console.log("Matched habit for POST:", targetHabit?.name);

  if (targetHabit) {
    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: targetHabit.id, date: todayStr } },
      create: { habitId: targetHabit.id, date: todayStr, completed: true },
      update: { completed: true },
    });
    console.log("POST upsert result:", log);
  }
}

testPostHandler("🟡 Meditación matutina")
  .catch(console.error)
  .finally(() => prisma.$disconnect());
