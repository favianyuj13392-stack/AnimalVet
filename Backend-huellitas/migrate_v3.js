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
  console.log("Connected to database. Executing V3 migrations (Zoosanitary Control Card)...");

  // 1. Alter vacunas_aplicadas table
  try {
    await client.query(`
      ALTER TABLE vacunas_aplicadas ADD COLUMN IF NOT EXISTS id_mascota_fk UUID NULL REFERENCES mascotas(id) ON DELETE CASCADE;
      ALTER TABLE vacunas_aplicadas ADD COLUMN IF NOT EXISTS id_hospitalizacion_fk UUID NULL REFERENCES hospitalizaciones(id) ON DELETE SET NULL;
      ALTER TABLE vacunas_aplicadas ALTER COLUMN id_historial_fk DROP NOT NULL;
    `);
    console.log("Altered vacunas_aplicadas table successfully.");
  } catch (err) {
    console.error("Error altering vacunas_aplicadas table:", err.message);
  }

  // 2. Create desparasitaciones table
  await client.query(`
    CREATE TABLE IF NOT EXISTS desparasitaciones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_mascota_fk UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      producto_utilizado VARCHAR(255) NOT NULL,
      tipo_parasitos VARCHAR(50) NOT NULL DEFAULT 'interno',
      dosis_sugerida VARCHAR(100) NULL,
      peso_kg NUMERIC(5,2) NULL,
      fecha_proxima DATE NULL,
      notas TEXT NULL,
      id_veterinario_fk UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
      created_by UUID NOT NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table desparasitaciones verified.");

  // 3. Create cirugias_registro table
  await client.query(`
    CREATE TABLE IF NOT EXISTS cirugias_registro (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_mascota_fk UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
      tipo_cirugia VARCHAR(255) NOT NULL,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      id_veterinario_fk UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
      observaciones TEXT NULL,
      created_by UUID NOT NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table cirugias_registro verified.");

  // 4. Create tratamientos_zoosanitarios table
  await client.query(`
    CREATE TABLE IF NOT EXISTS tratamientos_zoosanitarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_mascota_fk UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      descripcion TEXT NOT NULL,
      id_veterinario_fk UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
      created_by UUID NOT NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table tratamientos_zoosanitarios verified.");

  // 5. Create programa_sanitario_items table
  await client.query(`
    CREATE TABLE IF NOT EXISTS programa_sanitario_items (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      especie VARCHAR(50) NOT NULL,
      edad_texto VARCHAR(100) NOT NULL,
      edad_dias_desde INTEGER NULL,
      edad_dias_hasta INTEGER NULL,
      detalle VARCHAR(255) NOT NULL,
      observaciones TEXT NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      created_by UUID NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table programa_sanitario_items verified.");

  // 6. Seeds for programa_sanitario_items
  const itemsCountRes = await client.query(`SELECT COUNT(*) FROM programa_sanitario_items;`);
  const count = parseInt(itemsCountRes.rows[0].count);

  if (count === 0) {
    console.log("Inserting default seeds for Programa Sanitario...");
    const seeds = [
      // CANINOS
      ['Canino', '45 días (6 semanas)', 40, 50, 'Vacuna Puppy (Parvovirus/Moquillo)', 'Primera vacuna recomendada para cachorros', 10],
      ['Canino', '60 días (2 meses)', 50, 70, 'Vacuna Pentavalente (DHPPL)', 'Inmunización contra Parvovirus, Moquillo, Hepatitis y Leptospira', 20],
      ['Canino', '60 días (2 meses)', 50, 70, 'Desparasitación Interna', 'Eliminación de parásitos gastrointestinales', 30],
      ['Canino', '90 días (3 meses)', 80, 100, 'Vacuna Pentavalente (Refuerzo)', 'Refuerzo de la inmunización primaria', 40],
      ['Canino', '120 días (4 meses)', 110, 130, 'Vacuna Antirrábica + Sextuple', 'Inmunización obligatoria contra Rabia', 50],
      ['Canino', 'Anual (Refuerzo)', 350, 380, 'Vacuna Antirrábica (Refuerzo Anual)', 'Protección anual obligatoria', 60],
      ['Canino', 'Anual (Refuerzo)', 350, 380, 'Vacuna Sextuple (Refuerzo Anual)', 'Protección anual continuada', 70],
      ['Canino', 'Cada 3 meses', 80, 100, 'Desparasitación Interna Trimestral', 'Control periódico de endoparásitos', 80],

      // FELINOS
      ['Felino', '60 días (2 meses)', 50, 70, 'Vacuna Triple Felina (RCP)', 'Protección contra Calicivirus, Rinotraqueitis y Panleucopenia', 10],
      ['Felino', '60 días (2 meses)', 50, 70, 'Desparasitación Interna', 'Eliminación de endoparásitos inicial', 20],
      ['Felino', '90 días (3 meses)', 80, 100, 'Vacuna Triple Felina (Refuerzo)', 'Segundo refuerzo de inmunización primaria', 30],
      ['Felino', '90 días (3 meses)', 80, 100, 'Vacuna Leucemia Felina', 'Recomendado para gatos con acceso al exterior', 40],
      ['Felino', '120 días (4 meses)', 110, 130, 'Vacuna Antirrábica', 'Inmunización obligatoria contra la Rabia', 50],
      ['Felino', 'Anual (Refuerzo)', 350, 380, 'Vacuna Antirrábica (Refuerzo Anual)', 'Inmunización anual de protección contra la Rabia', 60],
      ['Felino', 'Anual (Refuerzo)', 350, 380, 'Vacuna Triple Felina (Refuerzo Anual)', 'Protección anual RCP', 70]
    ];

    for (const [especie, edad_texto, desde, hasta, detalle, obs, orden] of seeds) {
      await client.query(`
        INSERT INTO programa_sanitario_items (especie, edad_texto, edad_dias_desde, edad_dias_hasta, detalle, observaciones, orden)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [especie, edad_texto, desde, hasta, detalle, obs, orden]);
    }
    console.log("Seeds inserted successfully.");
  } else {
    console.log("Seeds already exist. Skipping.");
  }

  // 7. Run backfill if id_mascota_fk column was newly added
  try {
    console.log("Executing retroactive backfill for existing applied vaccines...");
    await client.query(`
      UPDATE vacunas_aplicadas va
      SET id_mascota_fk = ec.id_mascota_fk
      FROM historial_clinico hc
      JOIN expediente_clinico ec ON hc.id_expediente_fk = ec.id
      WHERE va.id_historial_fk = hc.id
      AND va.id_mascota_fk IS NULL;
    `);
    console.log("Retroactive backfill finished successfully.");
  } catch (err) {
    console.warn("Backfill warning:", err.message);
  }

  await client.end();
  console.log("V3 migrations completed successfully.");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
