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
  console.log("Connected to database. Executing migrations...");

  // 1. Create catalogo_patologias
  await client.query(`
    CREATE TABLE IF NOT EXISTS catalogo_patologias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      nombre VARCHAR(150) UNIQUE NOT NULL,
      codigo_cie VARCHAR(20) NULL,
      descripcion TEXT NULL
    );
  `);
  console.log("Table catalogo_patologias verified.");

  // 2. Create historial_patologias
  await client.query(`
    CREATE TABLE IF NOT EXISTS historial_patologias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_historial_fk UUID NOT NULL REFERENCES historial_clinico(id) ON DELETE CASCADE,
      id_patologia_fk UUID NOT NULL REFERENCES catalogo_patologias(id) ON DELETE CASCADE,
      tipo VARCHAR(20) NOT NULL
    );
  `);
  console.log("Table historial_patologias verified.");

  // 3. Create historial_clinico_evolucion
  await client.query(`
    CREATE TABLE IF NOT EXISTS historial_clinico_evolucion (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_historial_fk UUID NOT NULL REFERENCES historial_clinico(id) ON DELETE CASCADE,
      dia INTEGER NOT NULL,
      fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sintomas TEXT NULL,
      observaciones TEXT NULL,
      tratamiento TEXT NULL
    );
  `);
  console.log("Table historial_clinico_evolucion verified.");

  // 4. Create hospitalizacion_articulos
  await client.query(`
    CREATE TABLE IF NOT EXISTS hospitalizacion_articulos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      id_hospitalizacion_fk UUID NOT NULL REFERENCES hospitalizaciones(id) ON DELETE CASCADE,
      descripcion VARCHAR(150) NOT NULL,
      cantidad INTEGER DEFAULT 1,
      observacion VARCHAR(255) NULL
    );
  `);
  console.log("Table hospitalizacion_articulos verified.");

  // 5. Drop rigid columns
  try {
    await client.query(`
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia2_sintomas;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia2_obs;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia2_trat;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia3_sintomas;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia3_obs;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia3_trat;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia4_sintomas;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia4_obs;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia4_trat;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia5_sintomas;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia5_obs;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS evolucion_dia5_trat;
      ALTER TABLE historial_clinico DROP COLUMN IF EXISTS exam_fluidoterapia;
    `);
    console.log("Old rigid columns dropped from historial_clinico.");
  } catch (err) {
    console.warn("Rigid columns dropping warning:", err.message);
  }

  // 6. Set defaults and normalize states
  await client.query(`
    ALTER TABLE historial_clinico ALTER COLUMN estado SET DEFAULT 'ABIERTA';
    UPDATE historial_clinico SET estado = 'FINALIZADA' WHERE estado IN ('Cerrado', 'Finalizado', 'Finalizada');
    UPDATE historial_clinico SET estado = 'ABIERTA' WHERE estado IN ('Abierto', 'Abierta');
  `);
  console.log("Clinical states normalized in database.");

  // 7. Seed standard pathologies
  const standardPatologias = [
    { nombre: 'Moquillo Canino', codigo: 'A82.9', desc: 'Infección viral grave que afecta el sistema respiratorio, gastrointestinal y nervioso.' },
    { nombre: 'Traqueítis Infecciosa', codigo: 'J04.1', desc: 'Inflamación de la tráquea, comúnmente asociada a la tos de las perreras.' },
    { nombre: 'Desnutrición Severa', codigo: 'E43', desc: 'Deficiencia grave de nutrientes que compromete el peso y funciones metabólicas.' },
    { nombre: 'Anemia Clínica', codigo: 'D64.9', desc: 'Disminución de glóbulos rojos o hemoglobina en sangre.' },
    { nombre: 'Dermatitis Alérgica por Pulgas (DAPP)', codigo: 'L23.9', desc: 'Reacción de hipersensibilidad a la saliva de pulgas.' },
    { nombre: 'Parvovirosis Canina', codigo: 'A82.8', desc: 'Infección viral altamente contagiosa que causa gastroenteritis hemorrágica severa.' },
    { nombre: 'Gastroenteritis Aguda', codigo: 'K52.9', desc: 'Inflamación del tracto gastrointestinal que causa vómitos y diarreas.' },
    { nombre: 'Otitis Externa', codigo: 'H60.9', desc: 'Inflamación o infección del canal auditivo externo.' },
  ];

  for (const pat of standardPatologias) {
    await client.query(`
      INSERT INTO catalogo_patologias (nombre, codigo_cie, descripcion)
      VALUES ($1, $2, $3)
      ON CONFLICT (nombre) DO UPDATE SET codigo_cie = $2, descripcion = $3;
    `, [pat.nombre, pat.codigo, pat.desc]);
  }
  console.log("Master pathologies seeded successfully.");

  await client.end();
  console.log("Migration finished successfully.");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
