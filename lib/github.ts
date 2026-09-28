// Server-side GitHub fetches. Cached for an hour so we stay far below the
// unauthenticated rate limit and the browser never talks to GitHub directly.

export type RepoActivity = {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  pushedAt: string;
};

const API = "https://api.github.com";

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Public, non-fork repositories, most recently pushed first. Null if GitHub is unreachable. */
export async function getRepos(user: string): Promise<RepoActivity[] | null> {
  type ApiRepo = {
    name: string;
    description: string | null;
    language: string | null;
    html_url: string;
    pushed_at: string;
    fork: boolean;
  };

  const repos = await getJson<ApiRepo[]>(`/users/${user}/repos?per_page=100&sort=pushed`);
  if (!repos) return null;

  return repos
    // repo links go straight into hrefs: only accept real GitHub URLs (never javascript: etc.)
    .filter((r) => !r.fork && typeof r.html_url === "string" && r.html_url.startsWith("https://github.com/"))
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      url: r.html_url,
      pushedAt: r.pushed_at,
    }));
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, "y"],
    [60 * 60 * 24 * 30, "mo"],
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) {
    if (s >= size) return `${Math.floor(s / size)}${label} ago`;
  }
  return "just now";
}
