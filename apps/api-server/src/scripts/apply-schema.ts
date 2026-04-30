import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run db:schema");
  }

  const schemaPath = path.resolve(__dirname, "../../../../database/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf-8");

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query(schemaSql);
    console.log("Applied database/schema.sql successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Schema apply failed:", error);
  process.exit(1);
});
