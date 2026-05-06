import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { founders } from "@/db/schema";

export { FOUNDER_PLATFORMS, type FounderPlatform } from "./founder-platforms";

export type FounderRow = {
  id: string;
  name: string;
  platform: string;
  joinedAt: string;
  note: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const orderedRows = () =>
  db
    .select()
    .from(founders)
    .orderBy(asc(founders.displayOrder), asc(founders.createdAt));

export async function listAllFounders(): Promise<FounderRow[]> {
  return orderedRows();
}

export type PublicFounder = {
  id: string;
  name: string;
  displayOrder: number;
};

export async function listPublicFounders(): Promise<PublicFounder[]> {
  const rows = await db
    .select({
      id: founders.id,
      name: founders.name,
      displayOrder: founders.displayOrder,
    })
    .from(founders)
    .orderBy(asc(founders.displayOrder), asc(founders.createdAt));
  return rows;
}

export type CreateFounderInput = {
  name: string;
  platform: string;
  joinedAt: string;
  note?: string | null;
  displayOrder?: number | null;
};

async function nextDisplayOrder(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number | null>`max(${founders.displayOrder})` })
    .from(founders);
  return (row?.max ?? -1) + 1;
}

export async function createFounder(
  input: CreateFounderInput,
): Promise<FounderRow> {
  const displayOrder =
    typeof input.displayOrder === "number"
      ? input.displayOrder
      : await nextDisplayOrder();
  const [inserted] = await db
    .insert(founders)
    .values({
      name: input.name,
      platform: input.platform,
      joinedAt: input.joinedAt,
      note: input.note ?? null,
      displayOrder,
    })
    .returning();
  return inserted;
}

export type UpdateFounderInput = Partial<{
  name: string;
  platform: string;
  joinedAt: string;
  note: string | null;
  displayOrder: number;
}>;

export async function updateFounder(
  id: string,
  patch: UpdateFounderInput,
): Promise<FounderRow | null> {
  if (Object.keys(patch).length === 0) {
    const [row] = await db
      .select()
      .from(founders)
      .where(eq(founders.id, id))
      .limit(1);
    return row ?? null;
  }
  const [row] = await db
    .update(founders)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(founders.id, id))
    .returning();
  return row ?? null;
}

export async function deleteFounder(id: string): Promise<boolean> {
  const result = await db
    .delete(founders)
    .where(eq(founders.id, id))
    .returning({ id: founders.id });
  return result.length > 0;
}
