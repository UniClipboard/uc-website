import { readFile, mkdir, rename } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";

const command = process.argv[2];
function restic(args) {
  const result = spawnSync("restic", args, {
    env: {
      ...process.env,
      RESTIC_PASSWORD_FILE: "/run/secrets/backup_password",
      RESTIC_CACHE_DIR: "/tmp/restic-cache",
    },
    stdio: "inherit",
    timeout: 15 * 60 * 1000,
  });
  if (result.error || result.status !== 0)
    throw new Error(`restic ${args[0]} failed`);
}
try {
  if (command === "sync") {
    const secret = (await readFile("/run/secrets/cron_secret", "utf8")).trim();
    if (!secret) throw new Error("Cron credential is empty");
    const response = await fetch("http://website:3000/api/cron/sync-releases", {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(120000),
    });
    const result = await response.json();
    if (!response.ok || result.status === "skipped")
      throw new Error(
        `Release synchronization failed: HTTP ${response.status}`,
      );
    console.log(
      JSON.stringify({
        job: command,
        timestamp: new Date().toISOString(),
        result: result.status,
      }),
    );
  } else if (command === "backup") {
    await mkdir("/backups", { recursive: true, mode: 0o700 });
    const name = `/backups/website-${new Date().toISOString().replaceAll(":", "-")}.sqlite`;
    const source = new Database("/data/website.sqlite", {
      readonly: true,
      fileMustExist: true,
    });
    try {
      await source.backup(name + ".partial");
    } finally {
      source.close();
    }
    const backup = new Database(name + ".partial", {
      readonly: true,
      fileMustExist: true,
    });
    try {
      if (
        backup.pragma("integrity_check", { simple: true }) !== "ok" ||
        backup.pragma("foreign_key_check").length
      )
        throw new Error("Backup validation failed");
    } finally {
      backup.close();
    }
    await rename(name + ".partial", name);
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.RESTIC_REPOSITORY
    )
      throw new Error("Off-host backup credentials are absent");
    restic([
      "backup",
      name,
      "--tag",
      "uc-website",
      "--host",
      "primaryserver",
      "--json",
    ]);
    restic([
      "forget",
      "--tag",
      "uc-website",
      "--host",
      "primaryserver",
      "--group-by",
      "host,tags",
      "--keep-last",
      "10",
      "--keep-daily",
      "7",
      "--keep-weekly",
      "4",
      "--prune",
    ]);
    console.log(
      JSON.stringify({
        job: command,
        timestamp: new Date().toISOString(),
        result: "encrypted-off-host-backup-complete",
      }),
    );
  } else if (command === "init") {
    restic(["init"]);
  } else if (command === "check") {
    restic(["check", "--read-data"]);
  } else if (command === "restore") {
    const destination = process.argv[3];
    if (!destination?.startsWith("/backups/restore-"))
      throw new Error("Restore must use a new /backups/restore-* directory");
    restic([
      "restore",
      "latest",
      "--tag",
      "uc-website",
      "--host",
      "primaryserver",
      "--target",
      destination,
    ]);
  } else throw new Error("Unknown maintenance job");
} catch (error) {
  console.error(
    JSON.stringify({
      job: command,
      timestamp: new Date().toISOString(),
      error: String(error),
    }),
  );
  process.exitCode = 1;
}
