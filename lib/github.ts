// Server-side GitHub fetches. Cached for an hour so we stay far below the
// unauthenticated rate limit and the browser never talks to GitHub directly.

export type RepoActivity = {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  pushedAt: string;
};

export type GithubSnapshot = {
  publicRepos: number;
  repos: RepoActivity[];
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

export async function getGithubSnapshot(user: string): Promise<GithubSnapshot | null> {
  type ApiRepo = {
    name: string;
    description: string | null;
    language: string | null;
    html_url: string;
    pushed_at: string;
    fork: boolean;
  };

  const [profile, repos] = await Promise.all([
    getJson<{ public_repos: number }>(`/users/${user}`),
    getJson<ApiRepo[]>(`/users/${user}/repos?per_page=100&sort=pushed`),
  ]);
  if (!profile || !repos) return null;

  return {
    publicRepos: profile.public_repos,
    repos: repos
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        url: r.html_url,
        pushedAt: r.pushed_at,
      })),
  };
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
