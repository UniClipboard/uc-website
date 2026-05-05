import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { apiTokens } from "@/db/schema";

const TOKEN_PREFIX = "uct_";
const TOKEN_BYTES = 32;

export type IssuedToken = {
  id: string;
  plaintext: string;
  hash: string;
};

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function generateToken(): { plaintext: string; hash: string } {
  const random = randomBytes(TOKEN_BYTES).toString("base64url");
  const plaintext = `${TOKEN_PREFIX}${random}`;
  return { plaintext, hash: hashToken(plaintext) };
}

const constantTimeStringEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return timingSafeEqual(ab, bb);
};

export type VerifiedToken = {
  id: string;
  label: string;
};

export async function verifyBearerToken(
  authorization: string | null | undefined,
): Promise<VerifiedToken | null> {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match) return null;
  const presented = match[1].trim();
  if (!presented.startsWith(TOKEN_PREFIX)) return null;

  const presentedHash = hashToken(presented);
  const rows = await db
    .select({
      id: apiTokens.id,
      tokenHash: apiTokens.tokenHash,
      label: apiTokens.label,
    })
    .from(apiTokens)
    .where(
      and(eq(apiTokens.tokenHash, presentedHash), isNull(apiTokens.revokedAt)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (!constantTimeStringEqual(row.tokenHash, presentedHash)) return null;

  await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, row.id));

  return { id: row.id, label: row.label };
}

export async function listActiveApiTokens() {
  return db
    .select({
      id: apiTokens.id,
      label: apiTokens.label,
      createdAt: apiTokens.createdAt,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
    })
    .from(apiTokens)
    .where(isNull(apiTokens.revokedAt))
    .orderBy(apiTokens.createdAt);
}

export async function listAllApiTokens() {
  return db
    .select({
      id: apiTokens.id,
      label: apiTokens.label,
      createdAt: apiTokens.createdAt,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
    })
    .from(apiTokens)
    .orderBy(apiTokens.createdAt);
}

export async function issueApiToken(label: string): Promise<IssuedToken> {
  const { plaintext, hash } = generateToken();
  const [inserted] = await db
    .insert(apiTokens)
    .values({ label, tokenHash: hash })
    .returning({ id: apiTokens.id });
  return { id: inserted.id, plaintext, hash };
}

export async function revokeApiToken(id: string): Promise<boolean> {
  const result = await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(eq(apiTokens.id, id))
    .returning({ id: apiTokens.id });
  return result.length > 0;
}

export async function requireApiToken(req: Request): Promise<VerifiedToken> {
  const verified = await verifyBearerToken(req.headers.get("authorization"));
  if (!verified) {
    throw new Response(
      JSON.stringify({ error: "Invalid or missing API token" }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
          "www-authenticate": "Bearer",
        },
      },
    );
  }
  return verified;
}
