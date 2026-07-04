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
  const configRes = await client.query(`SELECT clave, valor FROM configuracion_clinica;`);
  console.log("Config keys:", configRes.rows);
  const usersRes = await client.query(`SELECT id, nombres, apellidos, email, id_rol_fk FROM usuarios;`);
  console.log("Users:", usersRes.rows);
  await client.end();
}

main().catch(console.error);
