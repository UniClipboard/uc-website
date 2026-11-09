import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { isAbsolute } from "node:path";

import Database from "better-sqlite3";

const path = process.env.SQLITE_PATH;
if (!path || !isAbsolute(path))
  throw new Error("SQLITE_PATH must be an absolute path");
const db = new Database(path, { fileMustExist: true });
try {
  const applied = new Set(
    db
      .prepare("SELECT hash FROM __drizzle_migrations")
      .all()
      .map((row) => row.hash),
  );
  for (const file of readdirSync(
    new URL("../drizzle/sqlite/", import.meta.url),
  ).filter((name) => name.endsWith(".sql"))) {
    const hash = createHash("sha256")
      .update(
        readFileSync(new URL(`../drizzle/sqlite/${file}`, import.meta.url)),
      )
      .digest("hex");
    if (!applied.has(hash))
      throw new Error("SQLite migrations do not match this image");
  }
} finally {
  db.close();
}

await import("../server.js");
