import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import postgres from "postgres";

import { openSqlite } from "../../src/db/connection";

// Dependency order also defines the only source tables this tool can read.
const tables = [
  "articles",
  "article_translations",
  "api_tokens",
  "releases",
  "founders",
  "ios_beta_signups",
  "sponsors",
  "sponsor_invites",
] as const;
type Row = Record<string, unknown>;
type Snapshot = {
  version: 1;
  createdAt: string;
  source: string;
  tables: Record<string, Row[]>;
};
const jsonColumns = new Set(["payload", "platforms", "raw_payload"]);
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function normalize(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (value === null) return [key, null];
      if (
        [
          "created_at",
          "updated_at",
          "pub_date",
          "last_used_at",
          "revoked_at",
          "invited_at",
          "expires_at",
          "used_at",
        ].includes(key)
      ) {
        const time =
          value instanceof Date
            ? value.getTime()
            : typeof value === "number"
              ? value
              : new Date(String(value)).getTime();
        if (!Number.isSafeInteger(time))
          throw new Error(`Invalid timestamp in ${key}`);
        return [key, time];
      }
      if (key === "manual_override") return [key, Number(value)];
      if (jsonColumns.has(key))
        return [
          key,
          canonical(typeof value === "string" ? JSON.parse(value) : value),
        ];
      return [key, value];
    }),
  );
}
const digest = (rows: Row[]) =>
  createHash("sha256")
    .update(
      rows
        .map((row) => canonical(normalize(row)))
        .sort()
        .join("\n"),
    )
    .digest("hex");
const save = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, JSON.stringify(value) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
};
async function main() {
  const [command, input, output] = process.argv.slice(2);
  if (!input)
    throw new Error(
      "Usage: database.ts export <snapshot> | import <snapshot> <database> | public <snapshot> <snapshot> | backup <database> <backup>",
    );

  if (command === "export") {
    config({ path: ".env.migration-production", quiet: true });
    if (!process.env.DATABASE_URL)
      throw new Error("DATABASE_URL is required for export only");
    const source = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false,
    });
    try {
      const snapshot = await source.begin(
        "isolation level repeatable read read only",
        async (tx) => {
          const inventory =
            await tx`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
          for (const { tablename } of inventory) {
            if (!(tables as readonly string[]).includes(tablename)) {
              if (tablename !== "shareholders")
                throw new Error(`Unreviewed source table: ${tablename}`);
              const [legacy] =
                await tx`SELECT count(*)::int AS count FROM shareholders`;
              if (legacy.count !== 0)
                throw new Error(
                  "Legacy shareholders contains data; review before conversion",
                );
            }
          }
          const data: Record<string, Row[]> = {};
          for (const table of tables)
            data[table] = [
              ...(await tx.unsafe(`SELECT * FROM "${table}"`)),
            ].map(normalize);
          return {
            version: 1,
            createdAt: new Date().toISOString(),
            source: "neon-postgres",
            tables: data,
          } satisfies Snapshot;
        },
      );
      save(resolve(input), snapshot);
      console.log(
        JSON.stringify({
          status: "exported",
          createdAt: snapshot.createdAt,
          counts: Object.fromEntries(
            tables.map((t) => [t, snapshot.tables[t].length]),
          ),
        }),
      );
    } finally {
      await source.end();
    }
  } else if (command === "public") {
    if (!output) throw new Error("Public snapshot output is required");
    const snapshot = JSON.parse(readFileSync(input, "utf8")) as Snapshot;
    const publicData: Record<string, Row[]> = Object.fromEntries(
      tables.map((t) => [t, []]),
    );
    publicData.articles = snapshot.tables.articles.filter(
      (row) => row.status === "published",
    );
    const articleIds = new Set(publicData.articles.map((row) => row.id));
    publicData.article_translations =
      snapshot.tables.article_translations.filter((row) =>
        articleIds.has(row.article_id),
      );
    publicData.releases = snapshot.tables.releases;
    publicData.founders = snapshot.tables.founders.map((row) => ({
      ...row,
      note: null,
    }));
    publicData.sponsors = snapshot.tables.sponsors
      .filter((row) => row.status === "published")
      .map((row) => ({ ...row, amount_cents: null }));
    save(resolve(output), {
      ...snapshot,
      source: "public-build-snapshot",
      tables: publicData,
    });
    console.log(
      JSON.stringify({
        status: "public-snapshot",
        sourceSnapshot: snapshot.createdAt,
      }),
    );
  } else if (command === "import") {
    if (!output) throw new Error("Target database path is required");
    const path = resolve(output);
    if (existsSync(path))
      throw new Error("Import requires a new database path");
    const snapshot = JSON.parse(readFileSync(input, "utf8")) as Snapshot;
    if (
      snapshot.version !== 1 ||
      Object.keys(snapshot.tables).sort().join() !== [...tables].sort().join()
    )
      throw new Error("Unexpected snapshot schema");
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const target = openSqlite(path, true);
    try {
      migrate(drizzle(target), { migrationsFolder: "./drizzle/sqlite" });
      target
        .transaction(() => {
          for (const table of tables) {
            const columns = (
              target.prepare(`PRAGMA table_info("${table}")`).all() as {
                name: string;
              }[]
            ).map((c) => c.name);
            const insert = target.prepare(
              `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
            );
            for (const row of snapshot.tables[table]) {
              const normalized = normalize(row);
              if (
                Object.keys(normalized).sort().join() !==
                [...columns].sort().join()
              )
                throw new Error(`Column mismatch: ${table}`);
              insert.run(...columns.map((c) => normalized[c]));
            }
          }
        })
        .immediate();
      const results = tables.map((table) => {
        const actual = target
          .prepare(`SELECT * FROM "${table}"`)
          .all() as Row[];
        const expected = snapshot.tables[table];
        if (
          actual.length !== expected.length ||
          digest(actual) !== digest(expected)
        )
          throw new Error(`Data mismatch: ${table}`);
        return {
          table,
          rows: actual.length,
          digest: digest(actual),
          status: "PASS",
        };
      });
      if ((target.pragma("foreign_key_check") as unknown[]).length)
        throw new Error("Foreign key validation failed");
      if (target.pragma("integrity_check", { simple: true }) !== "ok")
        throw new Error("Integrity validation failed");
      target.pragma("wal_checkpoint(TRUNCATE)");
      save(path + ".receipt.json", {
        sourceSnapshot: snapshot.createdAt,
        normalizedTimestamps: "UTC epoch milliseconds",
        results,
        integrity: "ok",
        foreignKeys: "ok",
      });
      console.log(
        JSON.stringify({
          status: "imported-and-verified",
          tables: results.map(({ table, rows }) => ({ table, rows })),
        }),
      );
    } finally {
      target.close();
    }
  } else if (command === "backup") {
    if (!output || existsSync(output))
      throw new Error("A new backup path is required");
    const source = openSqlite(resolve(input));
    try {
      await source.backup(resolve(output));
      const restored = openSqlite(resolve(output));
      try {
        if (
          restored.pragma("integrity_check", { simple: true }) !== "ok" ||
          (restored.pragma("foreign_key_check") as unknown[]).length
        )
          throw new Error("Backup validation failed");
      } finally {
        restored.close();
      }
      console.log(JSON.stringify({ status: "backup-verified" }));
    } finally {
      source.close();
    }
  } else throw new Error("Unknown database command");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
