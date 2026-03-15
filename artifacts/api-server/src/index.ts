import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "./app";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function runMigrations() {
  console.log("Running startup migrations...");
  try {
    // Add last_seen_at column if missing
    await db.execute(sql`
      ALTER TABLE meters ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;
    `);

    // Add meter_delivery_status column if missing
    await db.execute(sql`
      ALTER TABLE meters ADD COLUMN IF NOT EXISTS meter_delivery_status TEXT NOT NULL DEFAULT 'pending';
    `);

    // Fix any rows where last_seen_at is NULL or earlier than created_at
    await db.execute(sql`
      UPDATE meters SET last_seen_at = created_at
      WHERE last_seen_at IS NULL OR last_seen_at < created_at;
    `);

    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
