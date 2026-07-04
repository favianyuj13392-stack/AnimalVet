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

// Fixed UUIDs for predictability
const CLIENT_UUID = '30000000-0000-0000-0000-000000000001';
const PET_UUID = '40000000-0000-0000-0000-000000000001';
const EXPEDIENTE_UUID = '50000000-0000-0000-0000-000000000001';

const PROD_MELOXICAM_UUID = '10000000-0000-0000-0000-000000000001';
const PROD_TRAMADOL_UUID = '10000000-0000-0000-0000-000000000002';
const PROD_NEXGARD_UUID = '10000000-0000-0000-0000-000000000003';

const LOTE_MELOXICAM_UUID = '20000000-0000-0000-0000-000000000001';
const LOTE_NEXGARD_UUID = '20000000-0000-0000-0000-000000000003';

const APPOINTMENT_PENDING_UUID = '60000000-0000-0000-0000-000000000001';
const APPOINTMENT_COMPLETED_UUID = '60000000-0000-0000-0000-000000000002';

const HISTORIAL_UUID = '70000000-0000-0000-0000-000000000001';
const RECETA_UUID = '80000000-0000-0000-0000-000000000001';
const DETALLE_RECETA_UUID = '90000000-0000-0000-0000-000000000001';
const VACUNA_APLICADA_UUID = 'a0000000-0000-0000-0000-000000000001';

async function main() {
  console.log("Conectando a la base de datos para el sembrado...");
  await client.connect();

  console.log("Limpiando datos de prueba anteriores...");
  // Limpieza en orden inverso de dependencias
  await client.query(`DELETE FROM vacunas_aplicadas WHERE id = $1;`, [VACUNA_APLICADA_UUID]);
  await client.query(`DELETE FROM detalles_receta WHERE id = $1;`, [DETALLE_RECETA_UUID]);
  await client.query(`DELETE FROM recetas WHERE id = $1;`, [RECETA_UUID]);
  await client.query(`DELETE FROM historial_clinico WHERE id = $1;`, [HISTORIAL_UUID]);
  await client.query(`DELETE FROM citas WHERE id IN ($1, $2);`, [APPOINTMENT_PENDING_UUID, APPOINTMENT_COMPLETED_UUID]);
  await client.query(`DELETE FROM expediente_clinico WHERE id = $1;`, [EXPEDIENTE_UUID]);
  await client.query(`DELETE FROM mascotas WHERE id = $1;`, [PET_UUID]);
  await client.query(`DELETE FROM usuarios WHERE id = $1;`, [CLIENT_UUID]);
  await client.query(`DELETE FROM lotes_caducidad WHERE id IN ($1, $2);`, [LOTE_MELOXICAM_UUID, LOTE_NEXGARD_UUID]);
  await client.query(`DELETE FROM productos WHERE id IN ($1, $2, $3);`, [PROD_MELOXICAM_UUID, PROD_TRAMADOL_UUID, PROD_NEXGARD_UUID]);

  console.log("Insertando productos...");
  
  // 1. Meloxicam (Multidosis)
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, unidad_dosis, contenido_dosis_por_envase, 
      dias_caducidad_abierto, precio_por_dosis, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    PROD_MELOXICAM_UUID,
    "Meloxicam Gotas 10ml",
    "Meloxicam en gotas para control de dolor e inflamación 10ml",
    "ml",
    true,
    25.00,
    12,
    3,
    "Multidosis",
    "ml",
    10.00,
    60,
    2.50,
    ADMIN_UUID,
    2 // MEDICAMENTOS
  ]);

  // 2. Tramadol (Multidosis)
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, unidad_dosis, contenido_dosis_por_envase, 
      dias_caducidad_abierto, precio_por_dosis, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    PROD_TRAMADOL_UUID,
    "Tramadol Inyectable 20ml",
    "Analgésico Tramadol solución inyectable 20ml",
    "ml",
    true,
    80.00,
    5,
    2,
    "Multidosis",
    "ml",
    20.00,
    90,
    4.00,
    ADMIN_UUID,
    2 // MEDICAMENTOS
  ]);

  // 3. NexGard Spectra (Unitario - Bajo Stock)
  await client.query(`
    INSERT INTO productos (
      id, nombre, descripcion, unidad_medida, requiere_receta, precio_venta, 
      stock_actual, stock_minimo, tipo_producto, created_by, id_categoria_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    PROD_NEXGARD_UUID,
    "NexGard Spectra (2-3.5kg)",
    "Antiparasitario masticable para perros pequeños",
    "unidad",
    false,
    75.00,
    2, // STOCK CRÍTICO (menor a 5)
    5,
    "Unitario",
    ADMIN_UUID,
    2
  ]);

  console.log("Insertando lotes de caducidad...");
  
  // Lote de Meloxicam que expira pronto (para las alertas del dashboard!)
  const fechaMel = new Date();
  fechaMel.setDate(fechaMel.getDate() + 10); // vence en 10 días
  await client.query(`
    INSERT INTO lotes_caducidad (
      id, numero_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, created_by, id_producto_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    LOTE_MELOXICAM_UUID,
    "LOT-MEL-01",
    fechaMel.toISOString().split('T')[0],
    12,
    12,
    ADMIN_UUID,
    PROD_MELOXICAM_UUID
  ]);

  // Lote de NexGard que expira pronto
  const fechaNex = new Date();
  fechaNex.setDate(fechaNex.getDate() + 15); // vence en 15 días
  await client.query(`
    INSERT INTO lotes_caducidad (
      id, numero_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, created_by, id_producto_fk
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    LOTE_NEXGARD_UUID,
    "LOT-NEX-02",
    fechaNex.toISOString().split('T')[0],
    2,
    2,
    ADMIN_UUID,
    PROD_NEXGARD_UUID
  ]);

  console.log("Insertando cliente Favian Flores...");
  await client.query(`
    INSERT INTO usuarios (
      id, email, password_hash, nombres, apellidos, telefono, id_rol_fk, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    CLIENT_UUID,
    "favian.flores@example.com",
    "$2b$10$tM2Uv87kR3w2P0N4d8v/1ePqT2b2Uv87kR3w2P0N4d8v/1ePqT2b2", // dummy bcrypt
    "Favian",
    "Flores",
    "70012345", // bolivian number
    4, // Cliente
    ADMIN_UUID
  ]);

  console.log("Insertando mascota Toby...");
  await client.query(`
    INSERT INTO mascotas (
      id, nombre, fecha_nacimiento, sexo, id_dueno_fk, id_raza_fk, hash_qr_identidad, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    PET_UUID,
    "Toby",
    "2023-04-15",
    "M",
    CLIENT_UUID,
    1, // Chow Chow
    "toby-test-qr-hash",
    ADMIN_UUID
  ]);

  console.log("Insertando expediente clínico...");
  await client.query(`
    INSERT INTO expediente_clinico (
      id, id_mascota_fk, fecha_apertura, notas_generales, created_by
    ) VALUES ($1, $2, $3, $4, $5)
  `, [
    EXPEDIENTE_UUID,
    PET_UUID,
    new Date().toISOString().split('T')[0],
    "Expediente de prueba creado para Toby en Animal Vet.",
    ADMIN_UUID
  ]);

  console.log("Insertando cita en cola de espera (Pendiente)...");
  const horaInicio1 = new Date();
  horaInicio1.setHours(10, 0, 0, 0);

  await client.query(`
    INSERT INTO citas (
      id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion,
      id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `, [
    APPOINTMENT_PENDING_UUID,
    horaInicio1,
    30, // duracion_minutos
    "Consulta por cojera y control de vacunas",
    "Pendiente",
    false,
    PET_UUID,
    VET_UUID,
    2, // Consulta (Servicio)
    "Punto_Venta",
    "Normal",
    ADMIN_UUID
  ]);

  console.log("Insertando cita completada e historial pendiente de cobro...");
  const horaInicio2 = new Date();
  horaInicio2.setHours(9, 0, 0, 0);

  await client.query(`
    INSERT INTO citas (
      id, fecha_hora_inicio, duracion_minutos, motivo_cita, estado, requiere_confirmacion,
      id_mascota_fk, id_veterinario_fk, id_servicio_fk, origen_reserva, tipo_prioridad, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `, [
    APPOINTMENT_COMPLETED_UUID,
    horaInicio2,
    30, // duracion_minutos
    "Control de dolor",
    "Completada",
    false,
    PET_UUID,
    VET_UUID,
    2, // Consulta
    "Punto_Venta",
    "Normal",
    ADMIN_UUID
  ]);

  await client.query(`
    INSERT INTO historial_clinico (
      id, id_expediente_fk, id_veterinario_fk, id_cita_fk, fecha_consulta, tipo_atencion,
      motivo_consulta, sintomas, peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria,
      triaje_completado, diagnostico, notas_internas, estado, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
  `, [
    HISTORIAL_UUID,
    EXPEDIENTE_UUID,
    VET_UUID,
    APPOINTMENT_COMPLETED_UUID,
    new Date(),
    "Consulta",
    "Revisión de dolor en pata",
    "Molestia al pisar con la pata trasera izquierda",
    15.00,
    38.80,
    110,
    22,
    true,
    "Fatiga muscular por esfuerzo leve",
    "Se prescribe dosis de prueba de Meloxicam",
    "Cerrado", // DEBE ESTAR CERRADO para que aparezca en el POS
    ADMIN_UUID
  ]);

  await client.query(`
    INSERT INTO recetas (
      id, id_historial_fk, id_veterinario_fk, indicaciones_grales, created_by
    ) VALUES ($1, $2, $3, $4, $5)
  `, [
    RECETA_UUID,
    HISTORIAL_UUID,
    VET_UUID,
    "Dar Meloxicam con comida. Reposo por 3 días.",
    ADMIN_UUID
  ]);

  await client.query(`
    INSERT INTO detalles_receta (
      id, id_receta_fk, id_producto_fk, dosis, frecuencia, duracion_dias, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    DETALLE_RECETA_UUID,
    RECETA_UUID,
    PROD_MELOXICAM_UUID,
    "2.0 ml",
    "Cada 24 horas",
    3,
    ADMIN_UUID
  ]);

  // Insertar vacuna aplicada pendiente de recordatorio
  const fechaProxVacuna = new Date();
  fechaProxVacuna.setDate(fechaProxVacuna.getDate() + 15); // Próxima dosis en 15 días
  await client.query(`
    INSERT INTO vacunas_aplicadas (
      id, id_historial_fk, id_vacuna_fk, id_veterinario_fk, fecha_aplicacion, fecha_proxima_dosis,
      peso_mascota_kg, lote_vacuna, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    VACUNA_APLICADA_UUID,
    HISTORIAL_UUID,
    1, // Antirrábica
    VET_UUID,
    new Date(),
    fechaProxVacuna.toISOString().split('T')[0],
    15.00,
    "LOTE-VAC-01",
    ADMIN_UUID
  ]);

  console.log("Sembrado de datos finalizado con éxito.");
  console.log(`====================================================
  DATOS LISTOS PARA PRUEBAS:
  - Cliente: Favian Flores (favian.flores@example.com - Cel: 70012345)
  - Mascota: Toby (Perro Chow Chow)
  - Productos:
    1. Meloxicam Gotas 10ml (Multidosis - Qty: 12 - Lote expira en 10 días!)
    2. NexGard Spectra (Unitario - Qty: 2 - Lote expira en 15 días! - Stock Crítico!)
  - Cita en Cola (Pendiente): Cita de Consulta para Toby a las 10:00 AM.
  - Cita Completada en POS: Consulta de Toby lista para cobro por 60.00 Bs (+ Receta de Meloxicam).
  - Recordatorio WA: Vacuna Antirrábica para Toby programada en 15 días.
====================================================`);

  await client.end();
}

main().catch(async (err) => {
  console.error("Error al sembrar datos:", err);
  await client.end();
});
