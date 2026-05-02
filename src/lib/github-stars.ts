const REPO_API_URL = "https://api.github.com/repos/UniClipboard/UniClipboard";
const REVALIDATE_SECONDS = 60 * 60;
const TIMEOUT_MS = 4000;

export type GitHubStarsResult = {
  status: "ok" | "degraded";
  stars: number | null;
};

export async function fetchGitHubStars(): Promise<GitHubStarsResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const response = await fetch(REPO_API_URL, {
      signal: controller.signal,
      cache: "force-cache",
      next: { revalidate: REVALIDATE_SECONDS },
      headers,
    });

    if (!response.ok) {
      return { status: "degraded", stars: null };
    }

    const body = (await response.json()) as { stargazers_count?: unknown };
    const stars =
      typeof body.stargazers_count === "number" ? body.stargazers_count : null;
    return { status: stars === null ? "degraded" : "ok", stars };
  } catch {
    return { status: "degraded", stars: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function formatStars(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
