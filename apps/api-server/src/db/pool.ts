import { Pool } from "pg";
import { ApiError } from "../lib/api-error";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new ApiError(
        503,
        "DATABASE_UNAVAILABLE",
        "DATABASE_URL is not configured; cannot connect to the database"
      );
    }
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}
