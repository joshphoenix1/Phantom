import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __sqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "food.db");

function getClient(): Database.Database {
  if (!globalThis.__sqlite) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    globalThis.__sqlite = sqlite;
  }
  return globalThis.__sqlite;
}

export function getDb() {
  if (!globalThis.__db) {
    globalThis.__db = drizzle(getClient(), { schema });
  }
  return globalThis.__db;
}

export type DB = ReturnType<typeof getDb>;
export { schema };
