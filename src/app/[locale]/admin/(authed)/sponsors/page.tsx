import { SponsorsManager } from "@/components/admin/SponsorsManager";
import { listInvites } from "@/lib/sponsor-invites";
import { listAllSponsors } from "@/lib/sponsors-store";

export const metadata = { title: "赞助商 · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

export default async function AdminSponsorsPage() {
  const [initial, invites] = await Promise.all([
    listAllSponsors(),
    listInvites(),
  ]);
  return <SponsorsManager initial={initial} initialInvites={invites} />;
}
