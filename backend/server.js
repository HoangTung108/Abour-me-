import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import pg from "pg";
import { createApp } from "./app.js";
import { initializeDatabase, mongoProjects, postgresProjects } from "./database.js";

try {
  loadEnvFile(fileURLToPath(new URL("../enviroment.env", import.meta.url)));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const {
  DATABASE_URL,
  MONGODB_URI,
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  MONGODB_DATABASE,
  PROJECT_API_TOKEN,
  PORT = "8787",
} = process.env;

if ((!MONGODB_URI && !DATABASE_URL) || !PROJECT_API_TOKEN || PROJECT_API_TOKEN.length < 32) {
  console.error("Set MONGODB_URI or DATABASE_URL, and a PROJECT_API_TOKEN of at least 32 characters.");
  process.exit(1);
}

async function connectProjects() {
  if (MONGODB_URI) {
    const auth = MONGODB_USERNAME && MONGODB_PASSWORD
      ? { username: MONGODB_USERNAME, password: MONGODB_PASSWORD }
      : undefined;
    const client = new MongoClient(MONGODB_URI, { auth, serverSelectionTimeoutMS: 10000 });
    try {
      const databaseName = decodeURIComponent(new URL(MONGODB_URI).pathname.slice(1));
      const database = client.db(MONGODB_DATABASE || databaseName || "portfolio");
      return await mongoProjects(database);
    } catch (error) {
      await client.close();
      throw error;
    }
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  pool.on("error", error => console.error("PostgreSQL connection error:", error.code || error.name));
  try {
    await initializeDatabase(pool);
    return postgresProjects(pool);
  } catch (error) {
    await pool.end();
    throw error;
  }
}

try {
  const projects = await connectProjects();
  createApp({ projects, apiToken: PROJECT_API_TOKEN }).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
} catch (error) {
  console.error("Unable to initialize the project database:", error.code || error.name);
  process.exit(1);
}
