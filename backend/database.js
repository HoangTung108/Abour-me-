export async function initializeDatabase(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id uuid PRIMARY KEY,
      url text NOT NULL UNIQUE,
      name varchar(120) NOT NULL,
      description varchar(1000) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export function postgresProjects(pool) {
  return {
    async list() {
      const { rows } = await pool.query("SELECT id, url, name, description FROM portfolio_projects ORDER BY created_at, id");
      return rows;
    },
    async insert({ id, url, name, description }) {
      await pool.query(
        "INSERT INTO portfolio_projects (id, url, name, description) VALUES ($1, $2, $3, $4)",
        [id, url, name, description],
      );
    },
  };
}

export async function mongoProjects(database) {
  const collection = database.collection("portfolio_projects");
  await collection.createIndex({ url: 1 }, { unique: true });
  return {
    list: () => collection.find().sort({ created_at: 1, id: 1 }).toArray(),
    insert: project => collection.insertOne({ ...project, created_at: new Date() }),
  };
}
