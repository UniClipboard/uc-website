import { desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { iosBetaSignups } from "@/db/schema";

export type IosBetaSignupRow = {
  id: string;
  email: string;
  locale: string | null;
  userAgent: string | null;
  note: string | null;
  invitedAt: Date | null;
  createdAt: Date;
};

export type CreateIosBetaSignupInput = {
  email: string;
  locale?: string | null;
  userAgent?: string | null;
};

export type CreateIosBetaSignupResult = {
  status: "created" | "exists";
};

export async function createIosBetaSignup(
  input: CreateIosBetaSignupInput,
): Promise<CreateIosBetaSignupResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const rows = await db
    .insert(iosBetaSignups)
    .values({
      email: normalizedEmail,
      locale: input.locale ?? null,
      userAgent: input.userAgent ?? null,
    })
    .onConflictDoNothing({ target: iosBetaSignups.email })
    .returning({ id: iosBetaSignups.id });

  return { status: rows.length > 0 ? "created" : "exists" };
}

export async function listIosBetaSignups(): Promise<IosBetaSignupRow[]> {
  return db
    .select()
    .from(iosBetaSignups)
    .orderBy(desc(iosBetaSignups.createdAt));
}

export async function countIosBetaSignups(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(iosBetaSignups);
  return row?.count ?? 0;
}

export async function setIosBetaSignupInvited(
  id: string,
  invited: boolean,
): Promise<IosBetaSignupRow | null> {
  const [row] = await db
    .update(iosBetaSignups)
    .set({ invitedAt: invited ? new Date() : null })
    .where(eq(iosBetaSignups.id, id))
    .returning();
  return row ?? null;
}

export async function setIosBetaSignupsInvited(
  ids: string[],
  invited: boolean,
): Promise<IosBetaSignupRow[]> {
  if (ids.length === 0) return [];
  return db
    .update(iosBetaSignups)
    .set({ invitedAt: invited ? new Date() : null })
    .where(inArray(iosBetaSignups.id, ids))
    .returning();
}
