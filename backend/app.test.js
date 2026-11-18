import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { createApp } from "./app.js";

const token = "test-token-with-at-least-32-characters";

function createPool() {
  const rows = [];
  return {
    async query(sql, values) {
      if (sql.startsWith("SELECT")) return { rows: [...rows] };
      if (sql.startsWith("INSERT")) {
        const [id, url, name, description] = values;
        if (rows.some(row => row.url === url)) {
          const error = new Error("duplicate URL");
          error.code = "23505";
          throw error;
        }
        const row = { id, url, name, description };
        rows.push(row);
        return { rows: [row] };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

async function startApp(t, pool = createPool()) {
  const server = createApp({ pool, apiToken: token }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return `http://127.0.0.1:${server.address().port}`;
}

function post(base, body, authorization = `Bearer ${token}`) {
  return fetch(`${base}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authorization },
    body: JSON.stringify(body),
  });
}

test("project creation requires authorization and validates URLs and metadata", async t => {
  const base = await startApp(t);
  assert.equal((await post(base, { url: "https://example.com" }, "Bearer wrong")).status, 401);
  for (const body of [
    {},
    { url: "javascript:alert(1)" },
    { url: "https://user:password@example.com" },
    { url: "https://example.com", name: "" },
    { url: "https://example.com", description: "x".repeat(1001) },
  ]) {
    assert.equal((await post(base, body)).status, 400);
  }
  assert.deepEqual(await (await fetch(`${base}/api/projects`)).json(), []);
});

test("adding a project notifies connected clients and survives app restarts", async t => {
  const pool = createPool();
  const base = await startApp(t, pool);
  const abort = new AbortController();
  const events = await fetch(`${base}/api/projects/events`, { signal: abort.signal });
  const reader = events.body.getReader();
  t.after(() => { abort.abort(); });
  assert.match(new TextDecoder().decode((await reader.read()).value), /data: sync/);

  const response = await post(base, {
    url: "https://example.com/my-project",
    name: "My project",
    description: "A project description",
  });
  assert.equal(response.status, 201);
  const project = await response.json();
  assert.match(project.id, /^project:/);
  assert.equal(project.html_url, "https://example.com/my-project");
  assert.equal(project.name, "My project");
  assert.equal(project.description, "A project description");
  assert.match(new TextDecoder().decode((await reader.read()).value), /data: sync/);
  assert.equal((await post(base, { url: "https://example.com/my-project" })).status, 409);

  const restartedBase = await startApp(t, pool);
  assert.deepEqual(await (await fetch(`${restartedBase}/api/projects`)).json(), [project]);
  abort.abort();
});

test("link-only requests use the host as the project name", async t => {
  const base = await startApp(t);
  const response = await post(base, { url: "https://example.com" });
  assert.equal(response.status, 201);
  const project = await response.json();
  assert.equal(project.name, "example.com");
  assert.equal(project.html_url, "https://example.com/");
  assert.equal(project.stargazers_count, null);
});
