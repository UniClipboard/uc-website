import { desc } from "drizzle-orm";

import { ChangelogManager } from "@/components/admin/ChangelogManager";
import { db } from "@/db/client";
import { releases } from "@/db/schema";

export const metadata = { title: "Changelog · Admin" };

export const dynamic = "force-dynamic";

export default async function AdminChangelogPage() {
  const rows = await db
    .select({
      id: releases.id,
      version: releases.version,
      pubDate: releases.pubDate,
      manualOverride: releases.manualOverride,
      updatedAt: releases.updatedAt,
    })
    .from(releases)
    .orderBy(desc(releases.pubDate));

  const initial = rows.map((r) => ({
    id: r.id,
    version: r.version,
    pubDate: r.pubDate.toISOString(),
    manualOverride: r.manualOverride,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <ChangelogManager initial={initial} />;
}
