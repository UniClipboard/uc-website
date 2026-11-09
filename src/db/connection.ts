import { isAbsolute } from "node:path";

import Database from "better-sqlite3";

export function openSqlite(path: string | undefined, initialize = false) {
  if (!path || !isAbsolute(path))
    throw new Error("SQLITE_PATH must be an absolute database path");
  const client = new Database(path, { fileMustExist: !initialize });
  client.pragma("busy_timeout = 5000");
  client.pragma("foreign_keys = ON");
  client.pragma("journal_mode = WAL");
  client.pragma("synchronous = FULL");
  if (!initialize) {
    const count = client
      .prepare(
        "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('articles', 'article_translations', 'api_tokens', 'releases', 'founders', 'ios_beta_signups', 'sponsors', 'sponsor_invites')",
      )
      .get() as { count: number };
    if (count.count !== 8) {
      client.close();
      throw new Error(
        "SQLite schema is absent; run the migration command before startup",
      );
    }
  }
  if (process.env.WEBSITE_READ_ONLY === "1") client.pragma("query_only = ON");
  return client;
}
