import assert from "node:assert/strict";
import { test } from "node:test";
import { loadGithubRepositories } from "./github-repositories.js";

const repository = {
  id: 1,
  name: "test",
  full_name: "owner/test",
  html_url: "https://github.com/owner/test",
  stargazers_count: 2,
};

function memoryStorage(initial) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
  };
}

test("uses saved snapshot when GitHub is rate limited on a first visit", async () => {
  const result = await loadGithubRepositories({
    username: "owner",
    storage: memoryStorage(),
    fetcher: async () => ({ ok: false, status: 403 }),
  });
  assert.match(result.error.message, /403/);
  assert.ok(result.repositories.length > 0);
  assert.ok(result.repositories.every(item => item.html_url.startsWith("https://github.com/")));
});

test("uses an expired local cache when GitHub is unavailable", async () => {
  const storage = memoryStorage(JSON.stringify({ time: 1, data: [repository] }));
  const result = await loadGithubRepositories({
    username: "owner", storage, now: 600001,
    fetcher: async () => { throw new Error("offline"); },
  });
  assert.deepEqual(result.repositories, [repository]);
  assert.match(result.error.message, /offline/);
});

test("refreshes and caches public repositories when GitHub is available", async () => {
  const storage = memoryStorage();
  const fetcher = async () => ({
    ok: true,
    json: async () => [repository, { ...repository, id: 2, private: true }],
  });
  const result = await loadGithubRepositories({ username: "owner", storage, fetcher, now: 1000 });
  assert.deepEqual(result.repositories, [repository]);
  assert.equal(result.error, null);
  const cached = await loadGithubRepositories({
    username: "owner", storage, now: 1001,
    fetcher: async () => { throw new Error("fresh cache should not fetch"); },
  });
  assert.deepEqual(cached.repositories, [repository]);
  assert.equal(cached.error, null);
});

test("does not turn a cancelled request into a fallback result", async () => {
  await assert.rejects(loadGithubRepositories({
    username: "owner",
    fetcher: async () => { throw new DOMException("Aborted", "AbortError"); },
  }), { name: "AbortError" });
});
