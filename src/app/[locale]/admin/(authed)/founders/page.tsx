import { FoundersManager } from "@/components/admin/FoundersManager";
import { listAllFounders } from "@/lib/founders";

export const metadata = { title: "创始用户 · Admin" };

export const dynamic = "force-dynamic";

export default async function AdminFoundersPage() {
  const rows = await listAllFounders();
  const initial = rows.map((row) => ({
    id: row.id,
    name: row.name,
    platform: row.platform,
    joinedAt: row.joinedAt,
    note: row.note,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
  return <FoundersManager initial={initial} />;
}
