import { auth, currentUser } from "@clerk/nextjs/server";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin() {
  const session = await auth();
  if (!session.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress.toLowerCase();

  if (adminEmails.length === 0) {
    throw new Response(
      "ADMIN_EMAILS env var is not configured — refusing access.",
      { status: 500 },
    );
  }
  if (!email || !adminEmails.includes(email)) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { userId: session.userId, email };
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}
