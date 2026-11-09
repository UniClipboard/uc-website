import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { openSqlite } from "../src/db/connection";

config({ path: ".env.local", quiet: true });
const path = process.env.SQLITE_PATH;
if (!path) throw new Error("SQLITE_PATH is required");
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const client = openSqlite(path, true);
try {
  migrate(drizzle(client), { migrationsFolder: "./drizzle/sqlite" });
  console.log(
    JSON.stringify({
      status: "migrated",
      sqlite: client.prepare("select sqlite_version() as version").get(),
    }),
  );
} finally {
  client.close();
}
