import { IosBetaSignupsManager } from "@/components/admin/IosBetaSignupsManager";
import { listIosBetaSignups } from "@/lib/ios-beta-signups";

export const metadata = { title: "iOS Beta · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

export default async function AdminIosBetaPage() {
  const rows = await listIosBetaSignups();
  const initial = rows.map((row) => ({
    id: row.id,
    email: row.email,
    locale: row.locale,
    userAgent: row.userAgent,
    note: row.note,
    invitedAt: row.invitedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
  return <IosBetaSignupsManager initial={initial} />;
}
