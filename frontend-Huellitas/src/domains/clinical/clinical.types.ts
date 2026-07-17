import { Especie } from "../pets/pets.types";

export interface Vacuna {
  id: number;               // <-- Cambiado para aceptar el string '1'
  nombre_vacuna: string;             // <-- EL CAMBIO CRÍTICO (antes era 'nombre')
  descripcion?: string | null;
  intervalo_revacunacion: string;    // <-- Viene como texto "365 días"
  id_especie_fk: number;
  id_producto_fk?: string | null;
  especie?: Especie;
  producto?: {
    id: string;
    nombre: string;
    precioVenta: number;
    stockActual: number;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
export interface HistorialClinico {
  id: string;
  fecha_consulta: string;
  motivo_consulta: string;
  sintomas: string;
  peso_actual_kg: number;
  diagnostico: string;
  notas_internas?: string | null;
  temperatura_c?: number | null;
  frecuencia_cardiaca?: number | null;
  frecuencia_respiratoria?: number | null;
  tipo_atencion?: string;
  triaje_completado?: boolean;
  id_cita_fk: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  hospitalizacion?: any;
  archivos_adjuntos?: any[];
  triaje?: any;

  turno?: string;
  mucosas?: string;
  anamnesis?: string;
  diagnostico_presuntivo?: string;
  diagnostico_definitivo?: string;

  // Estructuras clínicas independientes
  seguimientos?: SeguimientoClinico[];
  informes?: InformeClinico[];
  examenes_solicitados?: ExamenSolicitado[];
  patologias?: HistorialPatologia[];

  // Exámenes complementarios
  exam_ecografia?: boolean;
  exam_rayos_x?: boolean;
  exam_hemograma?: boolean;
  exam_quimica_sanguinea?: boolean;
  exam_otros?: boolean;
  exam_resultados?: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
    email?: string;
  };
  mascota?: {
    id: string;
    nombre: string;
    sexo: string;
    id_dueno_fk?: string;
    id_raza_fk?: number;
  };
  cita?: {
    id: string;
    estado: string;
  };
  recetas?: any[];
  vacunas_aplicadas?: any[];

  // Propiedades legadas para compatibilidad con vistas mock previas
  fecha?: string;
  motivo?: string;
  peso?: number;
  tratamiento?: string | null;
  vacunasAplicadas?: any[];
  archivosAdjuntos?: {
    id: string;
    nombre_archivo: string;
    url_archivo: string;
    tamanio_bytes: number;
    tipo_mime: string;
    createdAt: string;
  }[];
}

export interface ExpedienteClinico {
  id: string;
  notas_generales?: string | null;
  fecha_apertura: string;
  id_mascota_fk: string;
  createdAt?: string;
  updatedAt?: string;
  historiales?: HistorialClinico[];
}

export interface CreateHistorialClinicoDto {
  motivo_consulta: string;
  sintomas?: string;
  peso_actual_kg: number;
  diagnostico: string;
  notas_internas?: string;
  temperatura_c?: number;
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  tipo_atencion: string;
  triaje_completado?: boolean;
  id_cita_fk: string;

  turno?: string;
  mucosas?: string;
  anamnesis?: string;
  diagnostico_presuntivo?: string;
  diagnostico_definitivo?: string;

  // Evolución días 2 al 5
  evolucion_dia2_sintomas?: string;
  evolucion_dia2_obs?: string;
  evolucion_dia2_trat?: string;
  evolucion_dia3_sintomas?: string;
  evolucion_dia3_obs?: string;
  evolucion_dia3_trat?: string;
  evolucion_dia4_sintomas?: string;
  evolucion_dia4_obs?: string;
  evolucion_dia4_trat?: string;
  evolucion_dia5_sintomas?: string;
  evolucion_dia5_obs?: string;
  evolucion_dia5_trat?: string;

  // Exámenes complementarios
  exam_ecografia?: boolean;
  exam_rayos_x?: boolean;
  exam_hemograma?: boolean;
  exam_quimica_sanguinea?: boolean;
  exam_fluidoterapia?: boolean;
  exam_otros?: boolean;
  exam_resultados?: string;
}

export interface UpdateHistorialClinicoDto {
  notas_internas: string;
}

export interface DetalleReceta {
  id: string;
  id_producto?: string | null;
  medicamento_texto: string;
  dosis: string;
  frecuencia: string;
  duracion_dias: number;
  producto?: {
    id: string;
    nombre: string;
  };
}

export interface Receta {
  id: string;
  id_historial_fk: string;
  indicaciones_grales: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  detalles: DetalleReceta[];
}

export interface CreateRecetaDto {
  id_historial: string;
  indicaciones_grales: string;
  detalles: {
    id_producto?: string | null;
    medicamento_texto?: string;
    dosis: string;
    frecuencia: string;
    duracion_dias: number;
  }[];
}

export interface UpdateRecetaDto {
  indicaciones_grales: string;
}

export interface CreateDetalleRecetaDto {
  id_producto?: string | null;
  medicamento_texto?: string;
  dosis: string;
  frecuencia: string;
  duracion_dias: number;
}

export interface UpdateDetalleRecetaDto {
  dosis?: string;
  frecuencia?: string;
  duracion_dias?: number;
}

export interface ArchivoAdjunto {
  id: string;
  id_historial_fk?: string; // 👈 AHORA ES OPCIONAL (?)
  id_hospitalizacion_fk?: string; // 👈 ¡NUEVO CAMPO!
  url_archivo: string;
  nombre_archivo: string;
  tipo_archivo: string;
  tipo_estudio: 'Radiografia' | 'Laboratorio' | 'Ecografia' | 'Electrocardiograma' | 'Otro';
  origen: 'Interno' | 'Externo';
  estado_archivo: 'Pendiente' | 'Recibido' | 'Analizado';
  fecha_estudio: string;
  observaciones?: string;
}

export interface CreateArchivoAdjuntoDto {
  id_historial_fk?: string; // 👈 AHORA ES OPCIONAL (?)
  id_hospitalizacion_fk?: string; // 👈 ¡NUEVO CAMPO!
  url_archivo: string;
  nombre_archivo: string;
  tipo_archivo: string;
  tipo_estudio: 'Radiografia' | 'Laboratorio' | 'Ecografia' | 'Electrocardiograma' | 'Otro';
  origen: 'Interno' | 'Externo';
  estado_archivo: 'Pendiente' | 'Recibido' | 'Analizado';
  fecha_estudio?: string;
  observaciones?: string;
}

export interface UpdateArchivoAdjuntoDto {
  estado_archivo?: 'Pendiente' | 'Recibido' | 'Analizado';
  observaciones?: string;
}

export interface VacunaAplicada {
  id: string;
  fecha_aplicacion: string;
  fecha_proxima_dosis?: string;
  peso_mascota_kg: number;
  lote_vacuna: string;
  vacuna?: {
    id: number;
    nombre: string;
    diasParaRefuerzo: number;
  };
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
}

export interface CreateVacunasAplicadaDto {
  id_historial_fk: string;
  id_vacuna_fk: number;
  fecha_aplicacion: string;
  peso_mascota_kg: number;
  lote_vacuna: string;
  fecha_proxima_dosis?: string;
}

export interface UpdateVacunasAplicadaDto {
  fecha_proxima_dosis?: string;
  peso_mascota_kg?: number;
  lote_vacuna?: string;
}

// --- HOSPITALIZACIONES & MONITOREO DIARIO ---

export type EstadoHospitalizacion = 'Observacion' | 'Estable' | 'Grave' | 'Alta';

export interface Hospitalizacion {
  id: string;
  id_historial_fk: string;
  fecha_ingreso: string;
  fecha_alta: string | null;
  motivo_ingreso: string;
  estado_actual: EstadoHospitalizacion;
  costo_por_dia: number;
  id_mascota_fk?: string;
  id_veterinario_responsable?: string;
  
  mascota?: {
    id: string;
    nombre: string;
    sexo: string;
    raza?: {
      id: number;
      nombre: string;
    } | null;
  };
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  insumos?: any[]; 
  vacunas_aplicadas?: any[];
  archivos?: ArchivoAdjunto[]; // 👈 ¡ESTA ES LA LÍNEA MÁGICA QUE FALTABA!
  articulos_ingreso?: string | null;
  medicion_post_operatoria?: string | null;
  tratamientos?: HospitalizacionTratamientoMonitoreo[];
  alimentacion?: HospitalizacionAlimentacion[];
}
export interface CreateHospitalizacioneDto {
  id_historial_fk: string;
  id_mascota_fk: string;
  id_veterinario_responsable: string;
  fecha_ingreso: string;
  motivo_ingreso: string;
  estado_actual?: EstadoHospitalizacion;
  costo_por_dia: number;
  articulos_ingreso?: string;
  medicion_post_operatoria?: string;
}

export interface UpdateHospitalizacioneDto {
  estado_actual?: EstadoHospitalizacion;
  fecha_alta?: string | null;
  costo_por_dia?: number;
  id_veterinario_responsable?: string;
  articulos_ingreso?: string;
  medicion_post_operatoria?: string;
  condicion_egreso?: string;
  diagnostico_egreso?: string;
  instrucciones_alta?: string;
}

export type TurnoMonitoreo = 'Mañana' | 'Tarde' | 'Noche';

export interface MonitoreoDiario {
  id: string;
  id_hospitaliza_fk: string;
  id_veterinario_fk: string;
  turno: TurnoMonitoreo;
  temperatura_c: number;
  freq_cardiaca: number;
  freq_respiratoria: number;
  observaciones: string;
  fecha_registro?: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  vomito_diarrea_convulsion?: string;
  presion?: string;
  spo2?: number;
  tllc?: string;
  mucosa?: string;
  peso_kg?: number;
  produccion_orina_ml?: number;
  glasgow?: number;
}

export interface CreateMonitoreoDiarioDto {
  id_hospitaliza_fk: string;
  id_veterinario_fk: string;
  turno: TurnoMonitoreo;
  temperatura_c: number;
  freq_cardiaca: number;
  freq_respiratoria: number;
  observaciones: string;
  vomito_diarrea_convulsion?: string;
  presion?: string;
  spo2?: number;
  tllc?: string;
  mucosa?: string;
  peso_kg?: number;
  produccion_orina_ml?: number;
  glasgow?: number;
}

export interface UpdateMonitoreoDiarioDto {
  turno?: TurnoMonitoreo;
  temperatura_c?: number;
  freq_cardiaca?: number;
  freq_respiratoria?: number;
  observaciones?: string;
  id_veterinario_fk?: string;
  vomito_diarrea_convulsion?: string;
  presion?: string;
  spo2?: number;
  tllc?: string;
  mucosa?: string;
  peso_kg?: number;
  produccion_orina_ml?: number;
  glasgow?: number;
}

export interface HospitalizacionTratamientoMonitoreo {
  id: string;
  id_hospitalizacion_fk: string;
  medicamento?: string | null;
  dosis?: string | null;
  via?: string | null;
  ml?: number | null;
  hora?: string | null;
  fluido?: string | null;
  fluido_dosis?: string | null;
  ml_hr?: number | null;
  tiempo_inicio_fin?: string | null;
  fecha?: string | null;
}

export interface HospitalizacionAlimentacion {
  id: string;
  id_hospitalizacion_fk: string;
  dia?: string | null;
  hora?: string | null;
  tipo?: string | null;
  cantidad?: string | null;
}

export interface Patologia {
  id: string;
  nombre: string;
  codigoCie?: string | null;
  descripcion?: string | null;
}

export interface HistorialPatologia {
  id: string;
  tipo: 'PRESUNTIVO' | 'DEFINITIVO';
  patologia?: Patologia;
}

export interface SeguimientoClinico {
  id: string;
  id_historial_clinico_fk: string;
  fecha: string;
  hora: string;
  estado: 'BORRADOR' | 'FINALIZADO';
  motivo: string;
  sintomas?: string | null;
  observaciones?: string | null;
  tratamiento?: string | null;
  diagnostico_actual?: string | null;
  recomendaciones?: string | null;
  peso_kg?: number | null;
  temperatura_c?: number | null;
  frecuencia_cardiaca?: number | null;
  frecuencia_respiratoria?: number | null;
  mucosas?: string | null;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  recetas?: any[];
}

export interface InformeClinico {
  id: string;
  id_mascota_fk: string;
  id_historial_fk?: string | null;
  id_seguimiento_fk?: string | null;
  id_hospitalizacion_fk?: string | null;
  tipo: 'ECOGRAFIA' | 'RADIOGRAFIA' | 'LABORATORIO' | 'CITOLOGIA' | 'HISTOPATOLOGIA' | 'ELECTROCARDIOGRAMA' | 'OTRO';
  estado: 'BORRADOR' | 'FINALIZADO' | 'ENTREGADO';
  titulo: string;
  comentario_clinico?: string | null;
  conclusion?: string | null;
  recomendaciones?: string | null;
  fecha: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  imagenes?: string[];
  pdf_generado?: string | null;
  datos_estructurados?: Record<string, any> | null;
}

export interface ExamenSolicitado {
  id: string;
  id_historial_fk: string;
  tipo: string;
  estado: 'SOLICITADO' | 'REALIZADO' | 'CANCELADO';
  fecha_solicitud: string;
  fecha_realizacion?: string | null;
  informe_id?: string | null;
}

export interface HospitalizacionArticulo {
  id: string;
  id_hospitalizacion_fk: string;
  descripcion: string;
  cantidad: number;
  observacion?: string | null;
}


