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

async function run() {
  const todayStr = getLocalDateString();
  const dayOfWeek = getLocalDayOfWeek();
  console.log("todayStr (America/Mexico_City):", todayStr);
  console.log("dayOfWeek:", dayOfWeek);

  const testName = "🔴 Dormir a las 22:15";
  const cleaned = cleanString(testName);
  console.log("Test input:", testName, "-> cleaned:", cleaned);

  const allHabits = await prisma.habit.findMany();
  console.log("Total habits in DB:", allHabits.length);

  const match = allHabits.find((h) => cleanString(h.name) === cleaned);
  console.log("Matched habit:", match?.name, match?.id);

  if (match) {
    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: match.id, date: todayStr } },
      create: { habitId: match.id, date: todayStr, completed: true },
      update: { completed: true },
    });
    console.log("Upserted log in DB:", log);
  }

  const logs = await prisma.habitLog.findMany({ where: { date: todayStr } });
  console.log("All logs for todayStr:", logs);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
