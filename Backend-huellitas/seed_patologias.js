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
  console.log("Connected to database. Querying products...");

  const prodRes = await client.query(`SELECT id, nombre FROM productos;`);
  const products = prodRes.rows;
  console.log("Products found in database:", products);

  const findProdId = (substring) => {
    const match = products.find(p => p.nombre.toLowerCase().includes(substring.toLowerCase()));
    return match ? match.id : null;
  };

  await client.query(`DELETE FROM plantillas_productos_recomendados;`);
  await client.query(`DELETE FROM plantillas_patologia;`);

  console.log("Cleared old templates.");

  const templates = [
    {
      nombre: 'Dermatitis / Alergias',
      palabras_clave: 'dermatitis,alergia,piel,comezon,dermatofitosis,sarna,alopecia',
      descripcion: 'Sugerencias para cuadros de comezón, alergias cutáneas o infecciones de piel.',
      recomendaciones: [
        { name: 'meloxicam', dosis: '1 gota/kg', formula: '1 * peso', frecuencia: 'c/24h', dias: 5 },
        { name: 'prednisolona', dosis: '0.5 mg/kg', formula: '0.5 * peso', frecuencia: 'c/12h', dias: 7 }
      ]
    },
    {
      nombre: 'Gastroenteritis',
      palabras_clave: 'gastroenteritis,vomito,diarrea,gastritis,infeccion estomacal,dolor abdominal',
      descripcion: 'Tratamiento para vómitos, diarreas e infecciones estomacales.',
      recomendaciones: [
        { name: 'metronidazol', dosis: '15 mg/kg', formula: '15 * peso', frecuencia: 'c/12h', dias: 7 },
        { name: 'meloxicam', dosis: '1 gota/kg', formula: '1 * peso', frecuencia: 'c/24h', dias: 3 }
      ]
    },
    {
      nombre: 'Otitis',
      palabras_clave: 'otitis,oreja,oido,sacude la cabeza,cerumen,secrecion auricular',
      descripcion: 'Tratamiento para infecciones de oído medio/externo.',
      recomendaciones: [
        { name: 'meloxicam', dosis: '1 gota/kg', formula: '1 * peso', frecuencia: 'c/24h', dias: 5 }
      ]
    },
    {
      nombre: 'Traumatismo / Dolor',
      palabras_clave: 'trauma,dolor,fractura,cojea,golpe,inflamacion,artritis,cojera',
      descripcion: 'Manejo del dolor y desinflamación por traumas o cojeras.',
      recomendaciones: [
        { name: 'meloxicam', dosis: '1 gota/kg', formula: '1 * peso', frecuencia: 'c/24h', dias: 5 },
        { name: 'tramadol', dosis: '2 mg/kg', formula: '2 * peso', frecuencia: 'c/12h', dias: 5 }
      ]
    },
    {
      nombre: 'Infección Respiratoria',
      palabras_clave: 'tos,estornudo,resfriado,neumonia,bronquitis,gripe',
      descripcion: 'Cuadros respiratorios de vías aéreas altas o bajas.',
      recomendaciones: [
        { name: 'prednisolona', dosis: '0.5 mg/kg', formula: '0.5 * peso', frecuencia: 'c/24h', dias: 5 }
      ]
    }
  ];

  for (const t of templates) {
    const patRes = await client.query(`
      INSERT INTO plantillas_patologia (nombre, palabras_clave, descripcion)
      VALUES ($1, $2, $3)
      RETURNING id, nombre;
    `, [t.nombre, t.palabras_clave, t.descripcion]);

    const patId = patRes.rows[0].id;
    console.log(`Created pathology template: ${patRes.rows[0].nombre} (${patId})`);

    for (const rec of t.recomendaciones) {
      const prodId = findProdId(rec.name);
      if (prodId) {
        await client.query(`
          INSERT INTO plantillas_productos_recomendados 
            (id_plantilla_fk, id_producto_fk, dosis_sugerida, formula_dosis, frecuencia_sugerida, duracion_dias_sugerida)
          VALUES 
            ($1, $2, $3, $4, $5, $6);
        `, [patId, prodId, rec.dosis, rec.formula, rec.frecuencia, rec.dias]);
        console.log(`  Linked recommended product: ${rec.name} -> Product ID: ${prodId}`);
      } else {
        console.warn(`  Warning: Recommended product containing name '${rec.name}' not found in database. Skipping.`);
      }
    }
  }

  await client.end();
  console.log("Seeding completed successfully!");
}

main().catch(console.error);
