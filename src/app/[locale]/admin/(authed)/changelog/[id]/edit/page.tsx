import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ChangelogEditor } from "@/components/admin/ChangelogEditor";
import { db } from "@/db/client";
import { releases } from "@/db/schema";

export const metadata = { title: "Edit release · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

type Params = { params: Promise<{ id: string }> };

export default async function EditReleasePage({ params }: Params) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(releases)
    .where(eq(releases.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();

  return (
    <ChangelogEditor
      id={row.id}
      version={row.version}
      pubDate={row.pubDate.toISOString()}
      notesEn={row.notesEn}
      notesZh={row.notesZh}
      manualOverride={row.manualOverride}
    />
  );
}
