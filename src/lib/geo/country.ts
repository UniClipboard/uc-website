import { headers } from "next/headers";

export async function getCountryCode(): Promise<string | null> {
  const h = await headers();
  return h.get("x-vercel-ip-country");
}

export async function isChinaIp(): Promise<boolean> {
  const code = await getCountryCode();
  return code === "CN";
}
