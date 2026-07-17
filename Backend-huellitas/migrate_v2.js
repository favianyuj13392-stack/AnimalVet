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
  console.log("Connected to database. Executing V2 migrations (Clinical Refactoring)...");

  // 1. Drop deprecated evolution table
  try {
    await client.query(`DROP TABLE IF EXISTS historial_clinico_evolucion CASCADE;`);
    console.log("Dropped legacy table historial_clinico_evolucion.");
  } catch (err) {
    console.warn("Error dropping legacy table:", err.message);
  }

  // 2. Create table seguimientos_clinicos
  await client.query(`
    CREATE TABLE IF NOT EXISTS seguimientos_clinicos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_historial_clinico_fk UUID NOT NULL REFERENCES historial_clinico(id) ON DELETE CASCADE,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      hora VARCHAR(10) NOT NULL DEFAULT to_char(now(), 'HH24:MI'),
      veterinario_id UUID NOT NULL REFERENCES usuarios(id),
      estado VARCHAR(20) NOT NULL DEFAULT 'FINALIZADO',
      motivo TEXT NOT NULL,
      sintomas TEXT NULL,
      observaciones TEXT NULL,
      tratamiento TEXT NULL,
      diagnostico_actual TEXT NULL,
      recomendaciones TEXT NULL,
      peso_kg NUMERIC(5,2) NULL,
      temperatura_c NUMERIC(4,2) NULL,
      frecuencia_cardiaca INTEGER NULL,
      frecuencia_respiratoria INTEGER NULL,
      mucosas VARCHAR(100) NULL,
      created_by UUID NOT NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table seguimientos_clinicos verified.");

  // 3. Create table informes_clinicos
  await client.query(`
    CREATE TABLE IF NOT EXISTS informes_clinicos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_mascota_fk UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
      id_historial_fk UUID NULL REFERENCES historial_clinico(id) ON DELETE SET NULL,
      id_seguimiento_fk UUID NULL REFERENCES seguimientos_clinicos(id) ON DELETE SET NULL,
      id_hospitalizacion_fk UUID NULL REFERENCES hospitalizaciones(id) ON DELETE SET NULL,
      tipo VARCHAR(50) NOT NULL DEFAULT 'OTRO',
      estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
      titulo VARCHAR(255) NOT NULL,
      comentario_clinico TEXT NULL,
      conclusion TEXT NULL,
      recomendaciones TEXT NULL,
      fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      veterinario_id UUID NOT NULL REFERENCES usuarios(id),
      imagenes TEXT NULL,
      pdf_generado VARCHAR(255) NULL,
      datos_estructurados JSONB NULL,
      created_by UUID NOT NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table informes_clinicos verified.");

  // 4. Create table examenes_solicitados
  await client.query(`
    CREATE TABLE IF NOT EXISTS examenes_solicitados (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_historial_fk UUID NOT NULL REFERENCES historial_clinico(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'SOLICITADO',
      fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_realizacion TIMESTAMP NULL,
      informe_id UUID NULL REFERENCES informes_clinicos(id) ON DELETE SET NULL,
      created_by UUID NOT NULL REFERENCES usuarios(id),
      updated_by UUID NULL REFERENCES usuarios(id)
    );
  `);
  console.log("Table examenes_solicitados verified.");

  // 5. Update recetas table columns
  try {
    await client.query(`
      ALTER TABLE recetas ADD COLUMN IF NOT EXISTS id_seguimiento_fk UUID NULL REFERENCES seguimientos_clinicos(id) ON DELETE CASCADE;
      ALTER TABLE recetas ALTER COLUMN id_historial_fk DROP NOT NULL;
    `);
    console.log("recetas table altered successfully.");
  } catch (err) {
    console.error("Error altering recetas table:", err.message);
  }

  await client.end();
  console.log("V2 migrations completed successfully.");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
