import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export const metadata = { title: "Forbidden · Admin" };

export default async function AdminForbiddenPage() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const isDev = process.env.NODE_ENV !== "production";
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="border-border w-full max-w-md rounded-lg border p-8 text-center">
        <h1 className="text-foreground mb-2 text-xl font-semibold">
          Access denied
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Your account is signed in but is not on the admin allowlist.
        </p>

        {isDev && (
          <div className="border-border bg-bg2 mb-6 rounded-md border p-3 text-left font-mono text-[11px]">
            <div className="text-muted-foreground mb-1 tracking-wide uppercase">
              Dev hint
            </div>
            <div>
              <span className="text-muted-foreground">Logged in as:</span>{" "}
              <span className="text-foreground">{email ?? "(no email)"}</span>
            </div>
            <div className="mt-1">
              <span className="text-muted-foreground">ADMIN_EMAILS:</span>{" "}
              <span className="text-foreground">
                {allowlist.length > 0 ? allowlist.join(", ") : "(empty)"}
              </span>
            </div>
            <div className="text-muted-foreground mt-2 text-[10px]">
              Add the email above to ADMIN_EMAILS in .env.local and restart dev.
            </div>
          </div>
        )}

        <SignOutButton redirectUrl="/admin/sign-in">
          <button className="bg-foreground text-background rounded-full px-4 py-2 text-sm font-medium">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
