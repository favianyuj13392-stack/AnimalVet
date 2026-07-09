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

const ADMIN_UUID = 'd4576ec1-15f4-4ca7-8cd5-6a0fb39f321d';
const VET_UUID = 'a2a3e0fa-98b7-4c31-8db9-f80e0fa3b81d';
const CAJERO_UUID = 'b3b4f1ab-8c76-4d22-9da8-e90f1ea4c92e';
const CLIENT1_UUID = '30000000-0000-0000-0000-000000000001';
const CLIENT2_UUID = '30000000-0000-0000-0000-000000000002';
const CLIENT3_UUID = 'c4c5f2bc-9d87-4e33-ae9f-f01f2eb5da3f';
const CLIENT_URG_UUID = 'f4a7d165-a6c1-4e9e-af01-9fb5f2cc994a';
const CLIENT_ANTONIO_UUID = '7f7327a3-7362-46ed-9fb3-74ac40ecdab8';

const PET_TOBY_UUID = '40000000-0000-0000-0000-000000000001';
const PET_LUNA_UUID = '40000000-0000-0000-0000-000000000002';
const PET_COCO_UUID = '40000000-0000-0000-0000-000000000003';

const EXP_TOBY_UUID = '50000000-0000-0000-0000-000000000001';
const EXP_LUNA_UUID = '50000000-0000-0000-0000-000000000002';
const EXP_COCO_UUID = '50000000-0000-0000-0000-000000000003';

const PROD_MELOXICAM_UUID = '10000000-0000-0000-0000-000000000001';
const PROD_TRAMADOL_UUID = '10000000-0000-0000-0000-000000000002';
const PROD_NEXGARD_UUID = '10000000-0000-0000-0000-000000000003';
const PROD_VAC_ANTIRRABICA_UUID = '10000000-0000-0000-0000-000000000004';
const PROD_VAC_QUINTUPLE_UUID = '10000000-0000-0000-0000-000000000005';

const LOTE_MELOXICAM_UUID = '20000000-0000-0000-0000-000000000001';
const LOTE_NEXGARD_UUID = '20000000-0000-0000-0000-000000000003';
const LOTE_ANTIRRABICA_UUID = '20000000-0000-0000-0000-000000000004';
const LOTE_QUINTUPLE_UUID = '20000000-0000-0000-0000-000000000005';

const CITA_TOBY_COMPLETADA_HOY = '60000000-0000-0000-0000-000000000001';
const CITA_LUNA_PENDIENTE_HOY = '60000000-0000-0000-0000-000000000002';
const CITA_COCO_ENCURSO_HOY = '60000000-0000-0000-0000-000000000003';
const CITA_TOBY_CONFIRMADA_MAÑANA = '60000000-0000-0000-0000-000000000004';
const CITA_TOBY_COMPLETADA_AYER = '60000000-0000-0000-0000-000000000005';
const CITA_LUNA_CONFIRMADA_FUTURA = '60000000-0000-0000-0000-000000000006';

const HC_TOBY_HOY = '70000000-0000-0000-0000-000000000001';
const HC_TOBY_AYER = '70000000-0000-0000-0000-000000000002';
const HC_COCO_HOY = '70000000-0000-0000-0000-000000000003';
const HC_LUNA_HOSP = '70000000-0000-0000-0000-000000000004';

const RECETA_TOBY_HOY = '80000000-0000-0000-0000-000000000001';
const RECETA_TOBY_AYER = '80000000-0000-0000-0000-000000000002';
const RECETA_COCO_HOY = '80000000-0000-0000-0000-000000000003';

const DET_REC_TOBY_HOY = '90000000-0000-0000-0000-000000000001';
const DET_REC_TOBY_AYER = '90000000-0000-0000-0000-000000000002';
const DET_REC_COCO_HOY = '90000000-0000-0000-0000-000000000003';

const HOSP_COCO_ACTIVA = 'a1000000-0000-0000-0000-000000000001';
const HOSP_LUNA_ALTA = 'a1000000-0000-0000-0000-000000000002';

const MON_COCO_1 = 'b1000000-0000-0000-0000-000000000001';
const MON_COCO_2 = 'b1000000-0000-0000-0000-000000000002';
const MON_LUNA_1 = 'b1000000-0000-0000-0000-000000000003';

const INS_COCO_1 = 'c1000000-0000-0000-0000-000000000001';
const INS_LUNA_1 = 'c1000000-0000-0000-0000-000000000002';
const INS_LUNA_2 = 'c1000000-0000-0000-0000-000000000003';

const TX_AYER_1 = 'd1000000-0000-0000-0000-000000000001';
const TX_AYER_2 = 'd1000000-0000-0000-0000-000000000002';
const TX_AYER_3 = 'd1000000-0000-0000-0000-000000000003';
const TX_AYER_4 = 'd1000000-0000-0000-0000-000000000004';
const TX_AYER_5 = 'd1000000-0000-0000-0000-000000000005';
const TX_HOY_1 = 'd1000000-0000-0000-0000-000000000006';
const TX_HOY_2 = 'd1000000-0000-0000-0000-000000000007';

const CIERRE_AYER_UUID = 'e1000000-0000-0000-0000-000000000001';

async function main() {
  console.log("Conectando a la base de datos de Supabase para sembrado de DEMO...");
  await client.connect();

  console.log("Limpiando todas las tablas anteriores...");
  
  // Limpieza en orden estricto de dependencias usando TRUNCATE CASCADE
  try {
    console.log("Ejecutando TRUNCATE CASCADE...");
    await client.query(`
      TRUNCATE TABLE 
        detalles_transaccion, 
        transacciones_caja, 
        cierres_caja, 
        monitoreo_diario, 
        hospitalizacion_insumos, 
        hospitalizaciones, 
        vacunas_aplicadas, 
        detalles_receta, 
        recetas, 
        historial_clinico, 
        citas, 
        expediente_clinico, 
        mascotas, 
        horarios_atencion, 
        fechas_bloqueadas, 
        configuracion_clinica, 
        kardex_inventario, 
        lotes_caducidad, 
        catalogo_vacunas, 
        productos, 
        servicios, 
        usuarios, 
        envases_abiertos, 
        logs_sistema, 
        registro_escaneos_qr, 
        registro_notificaciones, 
        interacciones_bot
      RESTART IDENTITY CASCADE;
    `);
    await client.query(`DELETE FROM razas WHERE id >= 3;`);
  } catch (e) {
    console.error("Error crítico durante TRUNCATE:", e);
    throw e;
  }

  console.log("Seeding base users with correct hashes...");
  
  // Seeding default users (admin123, vet123, cajero123, cliente123)
  const usersToSeed = [
    {
      id: ADMIN_UUID,
      email: 'admin@animalvet.com',
      hash: '$2b$12$w/zz2rNzMZRVEueHSEHtj.OzyZ.7ebEx2MNR8RASEJfF7mmosx2x6', // admin123
      nombres: 'Admin',
      apellidos: 'AnimalVet',
      rol: 1
    },
    {
      id: VET_UUID,
      email: 'veterinario@animalvet.com',
      hash: '$2b$12$COwTzPGPS9dU1zS9gIi1keWZbdYIMewDnU0/HKJRIo0Fo4a2u6O9G', // vet123
      nombres: 'Veterinario',
      apellidos: 'AnimalVet',
      rol: 2
    },
    {
      id: CAJERO_UUID,
      email: 'cajero@animalvet.com',
      hash: '$2b$12$mETIZn2U/XTKkTdN/CcljepUGDmid7IEpfHkvsCjpCirvYIbxjmUq', // cajero123
      nombres: 'Cajero',
      apellidos: 'AnimalVet',
      rol: 3
    },
    {
      id: CLIENT1_UUID,
      email: 'favian.flores@example.com',
      hash: '$2b$12$MRarxQ2eqxCYQRGm8RaAp.6xSMReAh4nFUWIG0IIxNo6W9tRMw.ZK', // cliente123
      nombres: 'Favian',
      apellidos: 'Flores',
      rol: 4
    },
    {
      id: CLIENT2_UUID,
      email: 'maria.gomez@example.com',
      hash: '$2b$12$MRarxQ2eqxCYQRGm8RaAp.6xSMReAh4nFUWIG0IIxNo6W9tRMw.ZK', // cliente123
      nombres: 'María',
      apellidos: 'Gómez',
      rol: 4
    },
    {
      id: CLIENT3_UUID,
      email: 'cliente@animalvet.com',
      hash: '$2b$12$MRarxQ2eqxCYQRGm8RaAp.6xSMReAh4nFUWIG0IIxNo6W9tRMw.ZK', // cliente123
      nombres: 'Cliente',
      apellidos: 'AnimalVet',
      rol: 4
    },
    {
      id: CLIENT_URG_UUID,
      email: 'urgencias@animalvet.com',
      hash: '$2b$12$WildcardUserPlaceholderPasswordHashDoNotUseToLogIn',
      nombres: 'Cliente Genérico',
      apellidos: 'de Urgencias',
      rol: 4
    },
    {
      id: CLIENT_ANTONIO_UUID,
      email: 'imuue0379@gmail.com',
      hash: '$2b$12$QF7f2bnt98anNlTHJ5JjueMV6J6liXFrO2GL3aX0vChofigMVk2LK',
      nombres: 'Antonio',
      apellidos: 'Yujra',
      rol: 4
    }
  ];

  for (const u of usersToSeed) {
    await client.query(`
      INSERT INTO usuarios (id, email, password_hash, nombres, apellidos, id_rol_fk, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [u.id, u.email, u.hash, u.nombres, u.apellidos, u.rol, ADMIN_UUID]);
  }

  console.log("Seeding clinical configuration...");
  const configs = [
    { key: 'nombre_clinica', val: 'AnimalVet', desc: 'Nombre de la Clínica' },
    { key: 'clinica_slogan', val: 'Cuidamos a los que más querés con tecnología y amor', desc: 'Slogan' },
    { key: 'clinica_ciudad', val: 'Santa Cruz', desc: 'Ciudad de operación' },
    { key: 'direccion', val: 'Av. Banzer entre 3er y 4to Anillo', desc: 'Dirección física' },
    { key: 'telefono', val: '33123456', desc: 'Teléfono de contacto' },
    { key: 'email', val: 'contacto@animalvet.com', desc: 'Correo institucional' },
    { key: 'moneda_simbolo', val: 'Bs.', desc: 'Símbolo monetario' },
    { key: 'moneda_nombre', val: 'Boliviano', desc: 'Nombre oficial de la moneda' },
    { key: 'descuento_maximo', val: '20', desc: 'Descuento máximo para POS' },
    { key: 'descuento_maximo_porcentaje', val: '20', desc: 'Límite porcentual para validación back' },
    { key: 'citas_duracion_default', val: '30', desc: 'Duración por defecto de citas en minutos' },
    { key: 'stock_alerta_dias', val: '60', desc: 'Días de anticipación para alerta de caducidad' },
    { key: 'notificaciones_whatsapp', val: 'true', desc: 'Habilitar recordatorios automáticos por WhatsApp' },
    { key: 'notificaciones_email', val: 'true', desc: 'Habilitar alertas de sistema por correo' }
  ];

  for (const c of configs) {
    await client.query(`
      INSERT INTO configuracion_clinica (clave, valor, descripcion, created_by)
      VALUES ($1, $2, $3, $4)
    `, [c.key, c.val, c.desc, ADMIN_UUID]);
  }

  console.log("Seeding services...");
  await client.query(`
    INSERT INTO servicios (id, nombre, descripcion, precio, duracion_minutos, requiere_veterinario)
    VALUES 
      (1, 'Consulta General', 'Revisión clínica completa y diagnóstico base.', 60.00, 30, true),
      (2, 'Desparasitación', 'Tratamiento contra parásitos internos y externos.', 40.00, 15, true),
      (3, 'Esterilización', 'Cirugía menor programada para caninos o felinos.', 350.00, 60, true),
      (4, 'Internación Clínica', 'Costo de internación diaria con monitoreo y jaula.', 120.00, 1440, true);
  `);

  console.log("Seeding extra feline breed...");
  await client.query(`
    INSERT INTO razas (id, nombre, id_especie_fk)
    VALUES (3, 'Siamés', 1);
  `);

  console.log("Seeding products...");
  // Meloxicam
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, unidad_dosis, contenido_dosis_por_envase, 
      dias_caducidad_abierto, precio_por_dosis, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [PROD_MELOXICAM_UUID, "Meloxicam Gotas 10ml", "Antiinflamatorio no esteroideo para perros y gatos", "ml", true, 25.00, 15, 3, "Multidosis", "ml", 10.00, 60, 2.50, ADMIN_UUID, 2]);

  // Tramadol
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, unidad_dosis, contenido_dosis_por_envase, 
      dias_caducidad_abierto, precio_por_dosis, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [PROD_TRAMADOL_UUID, "Tramadol Inyectable 20ml", "Analgésico opiáceo para dolores moderados a severos", "ml", true, 80.00, 8, 2, "Multidosis", "ml", 20.00, 90, 4.00, ADMIN_UUID, 2]);

  // Nexgard (bajo stock crítico para gatillar alerta en el dashboard)
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [PROD_NEXGARD_UUID, "NexGard Spectra (2-3.5kg)", "Antiparasitario masticable mensual contra pulgas y garrapatas", "unidad", false, 75.00, 2, 5, "Unitario", ADMIN_UUID, 2]);

  // Vacuna Antirrabica (producto)
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [PROD_VAC_ANTIRRABICA_UUID, "Vacuna Antirrábica Dosis", "Dosis inyectable antirrábica", "unidad", false, 70.00, 10, 3, "Unitario", ADMIN_UUID, 2]);

  // Vacuna Quintuple (producto)
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [PROD_VAC_QUINTUPLE_UUID, "Vacuna Quíntuple Dosis", "Dosis inyectable quíntuple", "unidad", false, 110.00, 12, 3, "Unitario", ADMIN_UUID, 2]);

  console.log("Seeding lotes de caducidad...");
  const dateMel = new Date();
  dateMel.setDate(dateMel.getDate() + 10); // vence en 10 días para disparar alerta
  await client.query(`
    INSERT INTO lotes_caducidad (id, numero_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, created_by, id_producto_fk)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [LOTE_MELOXICAM_UUID, "LOT-MEL-01", dateMel.toISOString().split('T')[0], 15, 15, ADMIN_UUID, PROD_MELOXICAM_UUID]);

  const dateNex = new Date();
  dateNex.setDate(dateNex.getDate() + 15); // vence en 15 días
  await client.query(`
    INSERT INTO lotes_caducidad (id, numero_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, created_by, id_producto_fk)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [LOTE_NEXGARD_UUID, "LOT-NEX-02", dateNex.toISOString().split('T')[0], 2, 2, ADMIN_UUID, PROD_NEXGARD_UUID]);

  const dateVac = new Date();
  dateVac.setDate(dateVac.getDate() + 120); // vence en 120 días
  await client.query(`
    INSERT INTO lotes_caducidad (id, numero_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, created_by, id_producto_fk)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [LOTE_ANTIRRABICA_UUID, "LOT-VAC-01", dateVac.toISOString().split('T')[0], 10, 10, ADMIN_UUID, PROD_VAC_ANTIRRABICA_UUID]);

  const dateQuin = new Date();
  dateQuin.setDate(dateQuin.getDate() + 180); // vence en 180 días
  await client.query(`
    INSERT INTO lotes_caducidad (id, numero_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, created_by, id_producto_fk)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [LOTE_QUINTUPLE_UUID, "LOT-VAC-02", dateQuin.toISOString().split('T')[0], 12, 12, ADMIN_UUID, PROD_VAC_QUINTUPLE_UUID]);

  console.log("Seeding catalogo de vacunas...");
  await client.query(`
    INSERT INTO catalogo_vacunas (id, nombre, descripcion, dias_para_refuerzo, id_producto_fk, id_especie_fk)
    VALUES 
      (1, 'Antirrábica', 'Vacuna anual obligatoria contra el virus de la rabia.', 365, $1, 2),
      (2, 'Quíntuple Canina', 'Inmunización contra moquillo, parvovirus, parainfluenza, adenovirus y leptospira.', 365, $2, 2),
      (3, 'Triple Felina', 'Inmunización para gatos contra rinotraqueitis, calicivirus y panleucopenia.', 365, $1, 1);
  `, [PROD_VAC_ANTIRRABICA_UUID, PROD_VAC_QUINTUPLE_UUID]);

  console.log("Seeding pets and expedientes...");
  // Toby (Canino)
  await client.query(`
    INSERT INTO mascotas (id, nombre, fecha_nacimiento, sexo, id_dueno_fk, id_raza_fk, hash_qr_identidad, created_by)
    VALUES ($1, 'Toby', '2023-04-15', 'M', $2, 1, 'toby-test-qr-hash', $3)
  `, [PET_TOBY_UUID, CLIENT1_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO expediente_clinico (id, id_mascota_fk, fecha_apertura, notas_generales, created_by)
    VALUES ($1, $2, '2025-01-10', 'Expediente clínico principal de Toby.', $3)
  `, [EXP_TOBY_UUID, PET_TOBY_UUID, ADMIN_UUID]);

  // Luna (Felino)
  await client.query(`
    INSERT INTO mascotas (id, nombre, fecha_nacimiento, sexo, id_dueno_fk, id_raza_fk, hash_qr_identidad, created_by)
    VALUES ($1, 'Luna', '2024-02-20', 'H', $2, 3, 'luna-test-qr-hash', $3)
  `, [PET_LUNA_UUID, CLIENT2_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO expediente_clinico (id, id_mascota_fk, fecha_apertura, notas_generales, created_by)
    VALUES ($1, $2, '2025-02-15', 'Expediente clínico principal de Luna.', $3)
  `, [EXP_LUNA_UUID, PET_LUNA_UUID, ADMIN_UUID]);

  // Coco (Canino)
  await client.query(`
    INSERT INTO mascotas (id, nombre, fecha_nacimiento, sexo, id_dueno_fk, id_raza_fk, hash_qr_identidad, created_by)
    VALUES ($1, 'Coco', '2022-09-05', 'M', $2, 2, 'coco-test-qr-hash', $3)
  `, [PET_COCO_UUID, CLIENT3_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO expediente_clinico (id, id_mascota_fk, fecha_apertura, notas_generales, created_by)
    VALUES ($1, $2, '2025-03-01', 'Expediente clínico principal de Coco.', $3)
  `, [EXP_COCO_UUID, PET_COCO_UUID, ADMIN_UUID]);

  console.log("Seeding horarios de atencion multi-bloque...");
  // Registrar Lunes a Viernes (8-12 y 14-18) y Sábado (9-13)
  for (let dia = 1; dia <= 5; dia++) {
    // Bloque Mañana
    await client.query(`
      INSERT INTO horarios_atencion (id_veterinario_fk, dia_semana, hora_inicio, hora_fin, activo, created_by)
      VALUES ($1, $2, '08:00:00', '12:00:00', true, $3)
    `, [VET_UUID, dia, ADMIN_UUID]);
    // Bloque Tarde
    await client.query(`
      INSERT INTO horarios_atencion (id_veterinario_fk, dia_semana, hora_inicio, hora_fin, activo, created_by)
      VALUES ($1, $2, '14:00:00', '18:00:00', true, $3)
    `, [VET_UUID, dia, ADMIN_UUID]);
  }
  // Sábado
  await client.query(`
    INSERT INTO horarios_atencion (id_veterinario_fk, dia_semana, hora_inicio, hora_fin, activo, created_by)
    VALUES ($1, 6, '09:00:00', '13:00:00', true, $2)
  `, [VET_UUID, ADMIN_UUID]);

  // 1 fecha bloqueada
  const dateBloq = new Date();
  dateBloq.setDate(dateBloq.getDate() + 1); // mañana
  await client.query(`
    INSERT INTO fechas_bloqueadas (fecha, motivo, id_veterinario_fk, created_by)
    VALUES ($1, 'Feriado', null, $2)
  `, [dateBloq.toISOString().split('T')[0], ADMIN_UUID]);

  console.log("Seeding dynamic appointments relative to 'today'...");
  const dateToday = new Date();
  
  // 1. Cita completada hoy a las 09:00 AM (Toby) -> Historial clínico cerrado -> listo para cobrar en POS
  const dateC1 = new Date(dateToday);
  dateC1.setHours(9, 0, 0, 0);
  await client.query(`
    INSERT INTO citas (id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion, id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by)
    VALUES ($1, $2, 30, 'Dolor de oído y secreción', 'Completada', false, $3, $4, 1, 'RECEPCION', 'Normal', $5)
  `, [CITA_TOBY_COMPLETADA_HOY, dateC1, PET_TOBY_UUID, VET_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO historial_clinico (
      id, id_expediente_fk, id_veterinario_fk, id_cita_fk, fecha_consulta, tipo_atencion,
      motivo_consulta, sintomas, peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria,
      triaje_completado, diagnostico, notas_internas, estado, created_by
    ) VALUES ($1, $2, $3, $4, $5, 'Consulta', 'Control de otitis', 'Mucha cera y dolor en oído izquierdo', 16.50, 39.10, 120, 24, true, 'Otitis media bacteriana leve', 'Dar gotas cada 24h', 'Cerrado', $6)
  `, [HC_TOBY_HOY, EXP_TOBY_UUID, VET_UUID, CITA_TOBY_COMPLETADA_HOY, dateC1, ADMIN_UUID]);

  await client.query(`
    INSERT INTO recetas (id, id_historial_fk, id_veterinario_fk, indicaciones_grales, created_by)
    VALUES ($1, $2, $3, 'Administrar 3 gotas en cada oído de Meloxicam para inflamación.', $4)
  `, [RECETA_TOBY_HOY, HC_TOBY_HOY, VET_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO detalles_receta (id, id_receta_fk, id_producto_fk, dosis, frecuencia, duracion_dias, created_by)
    VALUES ($1, $2, $3, '3 gotas', 'Cada 24 horas', 5, $4)
  `, [DET_REC_TOBY_HOY, RECETA_TOBY_HOY, PROD_MELOXICAM_UUID, ADMIN_UUID]);

  // Vacuna aplicada hoy durante la consulta
  const dateRef = new Date(dateToday);
  dateRef.setFullYear(dateRef.getFullYear() + 1); // refuerzo en 1 año
  await client.query(`
    INSERT INTO vacunas_aplicadas (id, id_historial_fk, id_vacuna_fk, id_veterinario_fk, fecha_aplicacion, fecha_proxima_dosis, peso_mascota_kg, lote_vacuna, created_by)
    VALUES ($1, $2, 1, $3, $4, $5, 16.50, 'LOT-VAC-01', $6)
  `, ['a0000000-0000-0000-0000-000000000001', HC_TOBY_HOY, VET_UUID, dateC1, dateRef, ADMIN_UUID]);

  // 2. Cita pendiente hoy a las 11:30 AM (Luna) -> Aparece en cola de espera / sala de espera
  const dateC2 = new Date(dateToday);
  dateC2.setHours(11, 30, 0, 0);
  await client.query(`
    INSERT INTO citas (id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion, id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by)
    VALUES ($1, $2, 30, 'Desparasitación periódica', 'Pendiente', false, $3, $4, 2, 'RECEPCION', 'Normal', $5)
  `, [CITA_LUNA_PENDIENTE_HOY, dateC2, PET_LUNA_UUID, VET_UUID, ADMIN_UUID]);

  // 3. Cita en curso hoy a las 14:00 (Coco) -> Aparece en curso
  const dateC3 = new Date(dateToday);
  dateC3.setHours(14, 0, 0, 0);
  await client.query(`
    INSERT INTO citas (id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion, id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by)
    VALUES ($1, $2, 30, 'Vómitos y letargia', 'En_Curso', false, $3, $4, 1, 'RECEPCION', 'Normal', $5)
  `, [CITA_COCO_ENCURSO_HOY, dateC3, PET_COCO_UUID, VET_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO historial_clinico (
      id, id_expediente_fk, id_veterinario_fk, id_cita_fk, fecha_consulta, tipo_atencion,
      motivo_consulta, sintomas, peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria,
      triaje_completado, diagnostico, notas_internas, estado, created_by
    ) VALUES ($1, $2, $3, $4, $5, 'Consulta', 'Urgencias estomacales', 'Dolor abdominal severo y deshidratación', 11.20, 39.50, 135, 28, true, 'Gastroenteritis aguda y sospecha de cuerpo extraño', 'Hospitalizar inmediatamente para observación.', 'Abierto', $6)
  `, [HC_COCO_HOY, EXP_COCO_UUID, VET_UUID, CITA_COCO_ENCURSO_HOY, dateC3, ADMIN_UUID]);

  // 4. Cita confirmada mañana a las 10:00 AM (Toby) -> Aparece en agenda futura
  const dateC4 = new Date(dateToday);
  dateC4.setDate(dateC4.getDate() + 1);
  dateC4.setHours(10, 0, 0, 0);
  await client.query(`
    INSERT INTO citas (id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion, id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by)
    VALUES ($1, $2, 30, 'Control clínico general', 'Confirmada', false, $3, $4, 1, 'RECEPCION', 'Normal', $5)
  `, [CITA_TOBY_CONFIRMADA_MAÑANA, dateC4, PET_TOBY_UUID, VET_UUID, ADMIN_UUID]);

  // 5. Cita completada ayer (Toby - ya facturada)
  const dateC5 = new Date(dateToday);
  dateC5.setDate(dateC5.getDate() - 1);
  dateC5.setHours(15, 0, 0, 0);
  await client.query(`
    INSERT INTO citas (id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion, id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by)
    VALUES ($1, $2, 30, 'Chequeo vacuna', 'Completada', false, $3, $4, 1, 'RECEPCION', 'Normal', $5)
  `, [CITA_TOBY_COMPLETADA_AYER, dateC5, PET_TOBY_UUID, VET_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO historial_clinico (
      id, id_expediente_fk, id_veterinario_fk, id_cita_fk, fecha_consulta, tipo_atencion,
      motivo_consulta, sintomas, peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria,
      triaje_completado, diagnostico, notas_internas, estado, created_by
    ) VALUES ($1, $2, $3, $4, $5, 'Consulta', 'Chequeo', 'Chequeo de rutina', 16.20, 38.60, 110, 20, true, 'Sano', 'Ninguna recomendación', 'Facturado', $6)
  `, [HC_TOBY_AYER, EXP_TOBY_UUID, VET_UUID, CITA_TOBY_COMPLETADA_AYER, dateC5, ADMIN_UUID]);

  // Receta y detalle de ayer
  await client.query(`
    INSERT INTO recetas (id, id_historial_fk, id_veterinario_fk, indicaciones_grales, created_by)
    VALUES ($1, $2, $3, 'Ninguna', $4)
  `, [RECETA_TOBY_AYER, HC_TOBY_AYER, VET_UUID, ADMIN_UUID]);

  await client.query(`
    INSERT INTO detalles_receta (id, id_receta_fk, id_producto_fk, dosis, frecuencia, duracion_dias, created_by)
    VALUES ($1, $2, $3, 'Ninguna', 'Ninguna', 0, $4)
  `, [DET_REC_TOBY_AYER, RECETA_TOBY_AYER, PROD_MELOXICAM_UUID, ADMIN_UUID]);

  console.log("Seeding hospitalizaciones...");
  // 1. Hospitalización activa: Coco (Canino) ingresado hace 2 días, en estado 'Observacion'
  const dateH1Ingreso = new Date(dateToday);
  dateH1Ingreso.setDate(dateH1Ingreso.getDate() - 2);
  await client.query(`
    INSERT INTO hospitalizaciones (id, id_historial_fk, id_mascota_fk, id_veterinario_responsable, fecha_ingreso, fecha_alta, motivo_ingreso, estado_actual, costo_por_dia, created_by)
    VALUES ($1, $2, $3, $4, $5, null, 'Gastroenteritis severa, se requiere suero e hidratación continua.', 'Observacion', 120.00, $6)
  `, [HOSP_COCO_ACTIVA, HC_COCO_HOY, PET_COCO_UUID, VET_UUID, dateH1Ingreso, ADMIN_UUID]);

  // Monitoreo diario para Coco
  const dateMon1 = new Date(dateToday);
  dateMon1.setDate(dateMon1.getDate() - 1);
  dateMon1.setHours(9, 0, 0, 0);
  await client.query(`
    INSERT INTO monitoreo_diario (id, id_hospitaliza_fk, id_veterinario_fk, turno, temperatura_c, freq_cardiaca, freq_respiratoria, observaciones, created_by)
    VALUES ($1, $2, $3, 'Mañana', 39.20, 130, 26, 'Paciente con letargo moderado. Tolera suero.', $4)
  `, [MON_COCO_1, HOSP_COCO_ACTIVA, VET_UUID, ADMIN_UUID]);

  const dateMon2 = new Date(dateToday);
  dateMon2.setHours(8, 30, 0, 0);
  await client.query(`
    INSERT INTO monitoreo_diario (id, id_hospitaliza_fk, id_veterinario_fk, turno, temperatura_c, freq_cardiaca, freq_respiratoria, observaciones, created_by)
    VALUES ($1, $2, $3, 'Mañana', 38.70, 115, 22, 'Mayor vivacidad. Fiebre controlada. Sigue en observación.', $4)
  `, [MON_COCO_2, HOSP_COCO_ACTIVA, VET_UUID, ADMIN_UUID]);

  // Insumos clínicos consumidos en hospitalización por Coco
  await client.query(`
    INSERT INTO hospitalizacion_insumos (id, id_hospitalizacion_fk, id_producto_fk, id_servicio_fk, cantidad, notas, created_by)
    VALUES ($1, $2, $3, null, 2, 'Meloxicam gotas administradas en sala', $4)
  `, [INS_COCO_1, HOSP_COCO_ACTIVA, PROD_MELOXICAM_UUID, ADMIN_UUID]);

  // 2. Hospitalización dada de ALTA (pendiente de cobro): Luna (Felino) ingresada hace 3 días, dada de alta HOY.
  // Tiene insumos cargados y servicio de internación. Aparecerá en el selector del POS de Caja.
  const dateH2Ingreso = new Date(dateToday);
  dateH2Ingreso.setDate(dateH2Ingreso.getDate() - 3);
  dateH2Ingreso.setHours(10, 0, 0, 0);

  const dateH2Alta = new Date(dateToday);
  dateH2Alta.setHours(11, 0, 0, 0);

  // Crear historial temporal para la hospitalización de Luna
  const HC_LUNA_UUID = '70000000-0000-0000-0000-000000000004';
  await client.query(`
    INSERT INTO historial_clinico (
      id, id_expediente_fk, id_veterinario_fk, id_cita_fk, fecha_consulta, tipo_atencion,
      motivo_consulta, sintomas, peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria,
      triaje_completado, diagnostico, notas_internas, estado, created_by
    ) VALUES ($1, $2, $3, null, $4, 'Hospitalizacion', 'Recuperación post-operatoria', 'Internación preventiva tras esterilización', 3.50, 38.20, 100, 18, true, 'Recuperación exitosa', 'Someter a reposo total', 'Cerrado', $5)
  `, [HC_LUNA_HOSP, EXP_LUNA_UUID, VET_UUID, dateH2Ingreso, ADMIN_UUID]);

  await client.query(`
    INSERT INTO hospitalizaciones (id, id_historial_fk, id_mascota_fk, id_veterinario_responsable, fecha_ingreso, fecha_alta, motivo_ingreso, estado_actual, costo_por_dia, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, 'Monitoreo post-quirúrgico esterilización.', 'Alta', 120.00, $7)
  `, [HOSP_LUNA_ALTA, HC_LUNA_HOSP, PET_LUNA_UUID, VET_UUID, dateH2Ingreso, dateH2Alta, ADMIN_UUID]);

  // Monitoreo para Luna
  await client.query(`
    INSERT INTO monitoreo_diario (id, id_hospitaliza_fk, id_veterinario_fk, turno, temperatura_c, freq_cardiaca, freq_respiratoria, observaciones, created_by)
    VALUES ($1, $2, $3, 'Tarde', 38.40, 105, 20, 'Post-quirúrgico estable. Anestesia superada.', $4)
  `, [MON_LUNA_1, HOSP_LUNA_ALTA, VET_UUID, ADMIN_UUID]);

  // Insumos para Luna
  await client.query(`
    INSERT INTO hospitalizacion_insumos (id, id_hospitalizacion_fk, id_producto_fk, id_servicio_fk, cantidad, notas, created_by)
    VALUES 
      ($1, $3, null, 1, 1, 'Servicio de consulta de egreso', $5),
      ($2, $3, $4, null, 1, 'Antibióticos post-quirúrgicos administrados', $5)
  `, [INS_LUNA_1, INS_LUNA_2, HOSP_LUNA_ALTA, PROD_MELOXICAM_UUID, ADMIN_UUID]);

  console.log("Seeding completed transactions for yesterday (for Admin dashboard charts)...");
  const dateTxYest = new Date(dateToday);
  dateTxYest.setDate(dateTxYest.getDate() - 1);
  dateTxYest.setHours(12, 0, 0, 0);

  // 1. Cobro clínico ayer (Toby - Cita completada)
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, $4, null, $5, 60.00, 0.00, 60.00, 'Efectivo', 'Completada', 'Completo', $2)
  `, [TX_AYER_1, CAJERO_UUID, CLIENT1_UUID, HC_TOBY_AYER, dateTxYest]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000001', '${TX_AYER_1}', null, 1, null, null, 1, 60.00, 60.00, 'previo', '${CAJERO_UUID}')
  `);

  // 2. Venta rápida ayer 2
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, null, null, $4, 150.00, 10.00, 140.00, 'QR', 'Completada', 'Completo', $2)
  `, [TX_AYER_2, CAJERO_UUID, CLIENT2_UUID, dateTxYest]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000002', '${TX_AYER_2}', '${PROD_NEXGARD_UUID}', null, null, '${LOTE_NEXGARD_UUID}', 2, 75.00, 150.00, 'entrega', '${CAJERO_UUID}')
  `);

  // 3. Venta rápida ayer 3
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, null, null, $4, 25.00, 0.00, 25.00, 'Tarjeta', 'Completada', 'Completo', $2)
  `, [TX_AYER_3, CAJERO_UUID, CLIENT3_UUID, dateTxYest]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000003', '${TX_AYER_3}', '${PROD_MELOXICAM_UUID}', null, null, '${LOTE_MELOXICAM_UUID}', 1, 25.00, 25.00, 'entrega', '${CAJERO_UUID}')
  `);

  // 4. Venta rápida ayer 4
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, null, null, $4, 70.00, 0.00, 70.00, 'Efectivo', 'Completada', 'Completo', $2)
  `, [TX_AYER_4, CAJERO_UUID, CLIENT_URG_UUID, dateTxYest]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000004', '${TX_AYER_4}', '${PROD_VAC_ANTIRRABICA_UUID}', null, null, '${LOTE_ANTIRRABICA_UUID}', 1, 70.00, 70.00, 'entrega', '${CAJERO_UUID}')
  `);

  // 5. Venta rápida ayer 5
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, null, null, $4, 110.00, 0.00, 110.00, 'Efectivo', 'Completada', 'Completo', $2)
  `, [TX_AYER_5, CAJERO_UUID, CLIENT_ANTONIO_UUID, dateTxYest]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000005', '${TX_AYER_5}', '${PROD_VAC_QUINTUPLE_UUID}', null, null, '${LOTE_QUINTUPLE_UUID}', 1, 110.00, 110.00, 'entrega', '${CAJERO_UUID}')
  `);

  console.log("Seeding completed cashier shift closure for yesterday...");
  await client.query(`
    INSERT INTO cierres_caja (id, id_cajero_fk, fecha_turno, turno, total_transacciones, total_efectivo, total_qr, total_tarjeta, total_descuentos, total_general, cerrado_en, observaciones, created_by)
    VALUES ($1, $2, $3, 'Completo', 5, 240.00, 140.00, 25.00, 10.00, 405.00, $4, 'Cierre de turno de prueba exitoso.', $2)
  `, [CIERRE_AYER_UUID, CAJERO_UUID, dateTxYest.toISOString().split('T')[0], dateTxYest]);

  console.log("Seeding completed transactions for TODAY (for Cashier Shift closing demo)...");
  const dateTxToday1 = new Date(dateToday);
  dateTxToday1.setHours(10, 0, 0, 0);
  
  const dateTxToday2 = new Date(dateToday);
  dateTxToday2.setHours(12, 30, 0, 0);

  // Tx 1 Hoy: Venta rápida producto
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, null, null, $4, 25.00, 0.00, 25.00, 'Efectivo', 'Completada', 'Completo', $2)
  `, [TX_HOY_1, CAJERO_UUID, CLIENT1_UUID, dateTxToday1]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000006', '${TX_HOY_1}', '${PROD_MELOXICAM_UUID}', null, null, '${LOTE_MELOXICAM_UUID}', 1, 25.00, 25.00, 'entrega', '${CAJERO_UUID}')
  `);

  // Tx 2 Hoy: Venta rápida servicio
  await client.query(`
    INSERT INTO transacciones_caja (id, id_cajero_fk, id_cliente_fk, id_historial_fk, id_hospitalizacion_fk, fecha_transaccion, subtotal, descuento, total_cobrado, metodo_pago, estado_transaccion, turno, created_by)
    VALUES ($1, $2, $3, null, null, $4, 40.00, 0.00, 40.00, 'QR', 'Completada', 'Completo', $2)
  `, [TX_HOY_2, CAJERO_UUID, CLIENT2_UUID, dateTxToday2]);

  await client.query(`
    INSERT INTO detalles_transaccion (id, id_transaccion_fk, id_producto_fk, id_servicio_fk, id_receta_fk, id_lote_fk, cantidad, precio_unitario, subtotal_linea, tipo_cobro, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000007', '${TX_HOY_2}', null, 2, null, null, 1, 40.00, 40.00, 'entrega', '${CAJERO_UUID}')
  `);

  console.log("Seeding Kardex logs...");
  // Kardex entries to show inventory movements history
  const kardexEntries = [
    { prod: PROD_MELOXICAM_UUID, type: 'Entrada', qty: 20, sal: 20, desc: 'Lote inicial de importación' },
    { prod: PROD_MELOXICAM_UUID, type: 'Salida_Venta', qty: 2, sal: 18, desc: 'Venta en POS', tx: TX_AYER_3 },
    { prod: PROD_MELOXICAM_UUID, type: 'Salida_Venta', qty: 1, sal: 17, desc: 'Venta en POS', tx: TX_HOY_1 },
    { prod: PROD_NEXGARD_UUID, type: 'Entrada', qty: 10, sal: 10, desc: 'Lote Nexgard Spectra' },
    { prod: PROD_NEXGARD_UUID, type: 'Salida_Venta', qty: 2, sal: 8, desc: 'Agotado lote anterior', tx: TX_AYER_2 },
    { prod: PROD_VAC_ANTIRRABICA_UUID, type: 'Entrada', qty: 20, sal: 20, desc: 'Compra lote vacunas' },
    { prod: PROD_VAC_ANTIRRABICA_UUID, type: 'Salida_Venta', qty: 1, sal: 19, desc: 'Cobro vacuna aplicada', tx: TX_AYER_4 },
    { prod: PROD_VAC_QUINTUPLE_UUID, type: 'Entrada', qty: 15, sal: 15, desc: 'Compra lote vacunas quintuples' },
    { prod: PROD_VAC_QUINTUPLE_UUID, type: 'Salida_Venta', qty: 1, sal: 14, desc: 'Cobro vacuna aplicada', tx: TX_AYER_5 }
  ];

  for (const k of kardexEntries) {
    await client.query(`
      INSERT INTO kardex_inventario (id_producto_fk, id_usuario_fk, tipo_movimiento, cantidad, saldo_resultante, motivo_detalle, id_transaccion_fk, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $2)
    `, [k.prod, ADMIN_UUID, k.type, k.qty, k.sal, k.desc, k.tx || null]);
  }

  console.log("Sembrado de datos finalizado con éxito.");
  console.log(`====================================================
  DATOS LISTOS PARA DEMOSTRACIÓN DE PRODUCTO (CON FECHAS RELATIVAS A HOY):
  - Admin: admin@animalvet.com / admin123
  - Veterinario: veterinario@animalvet.com / vet123
  - Cajero: cajero@animalvet.com / cajero123
  - Cliente Favian: favian.flores@example.com / cliente123
  
  FLUJOS LISTOS PARA PRESENTAR:
  1. Dashboard Admin: Muestra alertas de bajo stock (Nexgard) y lotes por expirar (Meloxicam).
  2. Agenda y Sala de Espera: Citas dinámicas hoy (Pendiente, En Curso, Completada).
  3. Consulta Vet: Historiales con recetas y vacunas para Toby hoy.
  4. Hospitalización: Coco hospitalizado activo con 2 monitoreos. Luna dada de alta hoy lista para cobrar.
  5. POS y Facturación: Cita completada de Toby hoy e internación de Luna hoy listos para cobro clínico.
  6. Cierre de Caja: 2 ventas registradas hoy listas para el cierre de turno. Cierre de ayer en histórico.
====================================================`);

  await client.end();
}

main().catch(async (err) => {
  console.error("Error al sembrar datos:", err);
  await client.end();
});
