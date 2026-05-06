import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin-auth";

export const metadata = { title: "Admin · UniClipboard" };

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session.userId) {
    redirect("/admin/sign-in");
  }
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!isAdminEmail(email)) {
    redirect("/admin/forbidden");
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin/articles" className="text-sm font-semibold">
            UniClipboard Admin
          </Link>
          <nav className="text-muted-foreground flex items-center gap-4 text-sm">
            <Link
              href="/admin/articles"
              className="hover:text-foreground transition-colors"
            >
              Articles
            </Link>
            <Link
              href="/admin/tokens"
              className="hover:text-foreground transition-colors"
            >
              API Tokens
            </Link>
            <Link
              href="/admin/founders"
              className="hover:text-foreground transition-colors"
            >
              Founders
            </Link>
          </nav>
        </div>
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span>{email}</span>
          <UserButton
            appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
