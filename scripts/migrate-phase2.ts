import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

async function migrate() {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();
  try {
    console.log("Creating FocusSession table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "FocusSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "subject" TEXT NOT NULL,
        "durationMinutes" INTEGER NOT NULL,
        "date" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "FocusSession_date_idx" ON "FocusSession"("date");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "FocusSession_subject_idx" ON "FocusSession"("subject");`);

    console.log("Creating BossBattle table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BossBattle" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "deadlineDate" TEXT NOT NULL,
        "deadlineTime" TEXT,
        "type" TEXT NOT NULL DEFAULT 'exam',
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "BossBattle_deadlineDate_idx" ON "BossBattle"("deadlineDate");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "BossBattle_completed_idx" ON "BossBattle"("completed");`);

    console.log("Migration completed successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
