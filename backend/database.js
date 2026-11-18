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
