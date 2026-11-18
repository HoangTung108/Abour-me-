import pg from "pg";
import { createApp } from "./app.js";
import { initializeDatabase } from "./database.js";

const { DATABASE_URL, PROJECT_API_TOKEN, PORT = "8787" } = process.env;
if (!DATABASE_URL || !PROJECT_API_TOKEN || PROJECT_API_TOKEN.length < 32) {
  console.error("Set DATABASE_URL and a PROJECT_API_TOKEN of at least 32 characters.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
pool.on("error", error => console.error("PostgreSQL connection error:", error));

try {
  await initializeDatabase(pool);
  createApp({ pool, apiToken: PROJECT_API_TOKEN }).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
} catch (error) {
  console.error("Unable to initialize PostgreSQL:", error);
  await pool.end();
  process.exit(1);
}
