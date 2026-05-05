import { ApiTokensManager } from "@/components/admin/ApiTokensManager";
import { listAllApiTokens } from "@/lib/api-token";

export const metadata = { title: "API Tokens · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

export default async function AdminTokensPage() {
  const rows = await listAllApiTokens();
  const initial = rows.map((row) => ({
    id: row.id,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  }));
  return <ApiTokensManager initial={initial} />;
}
