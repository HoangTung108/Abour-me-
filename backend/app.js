import express from "express";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";

function projectFromRow(row) {
  return {
    id: `project:${row.id}`,
    name: row.name,
    full_name: new URL(row.url).hostname,
    html_url: row.url,
    description: row.description,
    language: null,
    stargazers_count: null,
    source: "project",
  };
}

function parseProject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.url !== "string" || body.url.length > 2048) {
    throw new Error("Provide a valid project URL.");
  }
  let url;
  try {
    url = new URL(body.url);
  } catch {
    throw new Error("Provide a valid project URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Project URLs must use HTTP or HTTPS and must not contain credentials.");
  }
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120)) {
    throw new Error("Name must contain 1 to 120 characters.");
  }
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.trim().length > 1000)) {
    throw new Error("Description must contain at most 1000 characters.");
  }
  return {
    url: url.href,
    name: body.name?.trim() || url.hostname,
    description: body.description?.trim() || "",
  };
}

export function createApp({ projects, apiToken }) {
  const app = express();
  const clients = new Set();
  const tokenHash = createHash("sha256").update(apiToken).digest();

  app.use("/api", (_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });

  app.get("/api/projects", async (_request, response) => {
    response.json((await projects.list()).map(projectFromRow));
  });

  app.get("/api/projects/events", (_request, response) => {
    response.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.flushHeaders();
    response.write("data: sync\n\n");
    clients.add(response);
    const heartbeat = setInterval(() => response.write(": heartbeat\n\n"), 25000);
    response.on("close", () => {
      clearInterval(heartbeat);
      clients.delete(response);
    });
  });

  app.post("/api/projects", (request, response, next) => {
    const authorization = request.get("Authorization") || "";
    const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const suppliedHash = createHash("sha256").update(supplied).digest();
    if (!supplied || !timingSafeEqual(suppliedHash, tokenHash)) {
      response.status(401).json({ error: "A valid bearer token is required." });
      return;
    }
    next();
  }, express.json({ limit: "8kb" }), async (request, response) => {
    let project;
    try {
      project = parseProject(request.body);
    } catch (error) {
      response.status(400).json({ error: error.message });
      return;
    }
    try {
      project.id = randomUUID();
      await projects.insert(project);
      for (const client of clients) client.write("data: sync\n\n");
      response.status(201).json(projectFromRow(project));
    } catch (error) {
      if (error.code === "23505" || error.code === 11000) {
        response.status(409).json({ error: "This project URL has already been added." });
        return;
      }
      throw error;
    }
  });

  app.use("/api", (_request, response) => response.status(404).json({ error: "API endpoint not found." }));
  app.use(express.static(resolve("dist")));
  app.use((error, _request, response, _next) => {
    if (error.type === "entity.parse.failed") {
      response.status(400).json({ error: "Invalid JSON." });
    } else if (error.type === "entity.too.large") {
      response.status(413).json({ error: "Request body is too large." });
    } else {
      console.error("API error:", error);
      response.status(500).json({ error: "The server could not process the request." });
    }
  });

  return app;
}
