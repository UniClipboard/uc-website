import { SponsorsManager } from "@/components/admin/SponsorsManager";
import { listAllSponsors } from "@/lib/sponsors-store";

export const metadata = { title: "赞助商 · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

export default async function AdminSponsorsPage() {
  const initial = await listAllSponsors();
  return <SponsorsManager initial={initial} />;
}
