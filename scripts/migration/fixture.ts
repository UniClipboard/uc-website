import { createHash, randomBytes, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

import { openSqlite } from "../../src/db/connection";

const [path, envPath] = process.argv.slice(2);
if (!path || !envPath || process.env.NODE_ENV === "production") {
  throw new Error(
    "Provide a disposable fixture database and credential file outside production",
  );
}
const db = openSqlite(path);
const token = "uct_" + randomBytes(32).toString("base64url");
const revoked = "uct_" + randomBytes(32).toString("base64url");
const invite = randomBytes(24).toString("base64url");
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
try {
  db.prepare(
    "INSERT INTO api_tokens(id,token_hash,label,created_at) VALUES(?,?,?,?)",
  ).run(randomUUID(), hash(token), "migration fixture", Date.now());
  db.prepare(
    "INSERT INTO api_tokens(id,token_hash,label,created_at,revoked_at) VALUES(?,?,?,?,?)",
  ).run(
    randomUUID(),
    hash(revoked),
    "revoked migration fixture",
    Date.now(),
    Date.now(),
  );
  db.prepare(
    "INSERT INTO sponsor_invites(id,token_hash,tier,created_at) VALUES(?,?,?,?)",
  ).run(randomUUID(), hash(invite), "regular", Date.now());
  writeFileSync(
    envPath,
    `MIGRATION_E2E_TOKEN=${token}\nMIGRATION_E2E_REVOKED_TOKEN=${revoked}\nMIGRATION_E2E_INVITE=${invite}\n`,
    { mode: 0o600 },
  );
} finally {
  db.close();
}
