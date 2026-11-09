import { existsSync, chmodSync } from "node:fs";
import { isAbsolute } from "node:path";

import Database from "better-sqlite3";

const [sourcePath, targetPath] = process.argv.slice(2);
if (
  !sourcePath ||
  !targetPath ||
  !isAbsolute(sourcePath) ||
  !isAbsolute(targetPath) ||
  existsSync(targetPath)
) {
  throw new Error(
    "Provide an existing source and a new absolute snapshot path",
  );
}
const tables = [
  "articles",
  "article_translations",
  "api_tokens",
  "releases",
  "founders",
  "ios_beta_signups",
  "sponsors",
  "sponsor_invites",
  "__drizzle_migrations",
];
const source = new Database(sourcePath, {
  readonly: true,
  fileMustExist: true,
});
const target = new Database(targetPath);
chmodSync(targetPath, 0o600);
try {
  source.transaction(() => {
    const objects = source
      .prepare(
        `SELECT sql FROM sqlite_master WHERE type IN ('table', 'index') AND sql IS NOT NULL AND tbl_name IN (${tables.map(() => "?").join(",")}) ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END`,
      )
      .all(...tables);
    for (const { sql } of objects) target.exec(sql);
    target.pragma("foreign_keys = ON");
    target.transaction(() => {
      for (const table of tables) {
        let rows = [];
        if (table === "articles")
          rows = source
            .prepare("SELECT * FROM articles WHERE status = 'published'")
            .all();
        else if (table === "article_translations")
          rows = source
            .prepare(
              "SELECT t.* FROM article_translations t JOIN articles a ON a.id = t.article_id WHERE a.status = 'published'",
            )
            .all();
        else if (table === "sponsors")
          rows = source
            .prepare("SELECT * FROM sponsors WHERE status = 'published'")
            .all()
            .map((row) => ({ ...row, amount_cents: null }));
        else if (table === "founders")
          rows = source
            .prepare("SELECT * FROM founders")
            .all()
            .map((row) => ({ ...row, note: null }));
        else if (["releases", "__drizzle_migrations"].includes(table))
          rows = source.prepare(`SELECT * FROM "${table}"`).all();
        const columns = target
          .prepare(`PRAGMA table_info("${table}")`)
          .all()
          .map((row) => row.name);
        const insert = target.prepare(
          `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
        );
        for (const row of rows)
          insert.run(...columns.map((column) => row[column]));
      }
    })();
  })();
  if (
    target.pragma("foreign_key_check").length ||
    target.pragma("integrity_check", { simple: true }) !== "ok"
  )
    throw new Error("Public snapshot integrity failed");
  for (const table of ["api_tokens", "ios_beta_signups", "sponsor_invites"]) {
    if (
      target.prepare(`SELECT count(*) AS count FROM "${table}"`).get().count !==
      0
    )
      throw new Error("Public snapshot contains private rows");
  }
  console.log(
    JSON.stringify({
      status: "public-snapshot-created",
      createdAt: new Date().toISOString(),
    }),
  );
} finally {
  target.close();
  source.close();
}
