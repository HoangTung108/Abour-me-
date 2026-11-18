import snapshot from "./repositories.json" with { type: "json" };

const cacheKey = "github-repositories-v2";
const cacheLifetime = 300000;

function isRepositoryList(data) {
  return Array.isArray(data) && data.every(repository =>
    repository && typeof repository.id === "number" && typeof repository.name === "string" &&
    typeof repository.full_name === "string" && typeof repository.html_url === "string" &&
    typeof repository.stargazers_count === "number",
  );
}

export async function loadGithubRepositories({ username, storage, signal, fetcher = fetch, now = Date.now() }) {
  let cached;
  try {
    const stored = JSON.parse(storage?.getItem(cacheKey));
    if (stored && Number.isFinite(stored.time) && isRepositoryList(stored.data)) cached = stored;
  } catch {
    // Storage is optional.
  }
  if (cached && now >= cached.time && now - cached.time < cacheLifetime) {
    return { repositories: cached.data, error: null };
  }
  try {
    const response = await fetcher(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
      headers: { Accept: "application/vnd.github+json" },
      signal,
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const data = await response.json();
    if (!isRepositoryList(data)) throw new Error("GitHub returned an invalid repository list");
    const repositories = data.filter(repository => !repository.private);
    try {
      storage?.setItem(cacheKey, JSON.stringify({ time: now, data: repositories }));
    } catch {
      // Storage is optional.
    }
    return { repositories, error: null };
  } catch (error) {
    if (error.name === "AbortError") throw error;
    return { repositories: cached?.data ?? snapshot, error };
  }
}
