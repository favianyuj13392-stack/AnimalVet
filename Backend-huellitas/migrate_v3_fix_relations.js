const pg = require('pg');
require('dotenv').config();

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to database. Executing V3 Relations Fix migrations...");

  try {
    await client.query(`
      ALTER TABLE cirugias_registro ADD COLUMN IF NOT EXISTS id_historial_fk UUID NULL REFERENCES historial_clinico(id) ON DELETE SET NULL;
      ALTER TABLE tratamientos_zoosanitarios ADD COLUMN IF NOT EXISTS id_historial_fk UUID NULL REFERENCES historial_clinico(id) ON DELETE SET NULL;
    `);
    console.log("Altered tables successfully adding missing id_historial_fk columns.");
  } catch (err) {
    console.error("Error altering tables:", err.message);
  }

  await client.end();
  console.log("V3 Relations Fix migrations completed successfully.");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
