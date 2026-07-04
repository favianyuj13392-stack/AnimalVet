import { z } from "zod";

export const triageSchema = z.object({
  peso: z
    .string()
    .min(1, "El peso es obligatorio")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Peso debe ser mayor a 0")
    .refine((v) => Number(v) <= 200, "Peso máximo: 200 kg"),
  temperatura: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 35 && Number(v) <= 42), {
      message: "Temperatura debe estar entre 35°C y 42°C",
    }),
  fc: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 40 && Number(v) <= 300), {
      message: "Frecuencia cardíaca debe estar entre 40 y 300 bpm",
    }),
  fr: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 10 && Number(v) <= 100), {
      message: "Frecuencia respiratoria debe estar entre 10 y 100 rpm",
    }),
});
export type TriageValues = z.infer<typeof triageSchema>;

export const clinicalNotesSchema = z.object({
  sintomas: z.string().min(5, "Describe los síntomas (mínimo 5 caracteres)"),
  diagnostico: z.string().min(3, "El diagnóstico es obligatorio"),
  indicaciones: z.string().optional(),
});
export type ClinicalNotesValues = z.infer<typeof clinicalNotesSchema>;

export const vitalSignsSchema = z.object({
  turno: z.enum(["Mañana", "Tarde", "Noche"]),
  temp: z
    .string()
    .min(1, "Temperatura requerida")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 35 && Number(v) <= 42, {
      message: "Temperatura: 35–42°C",
    }),
  fc: z
    .string()
    .min(1, "F. Cardíaca requerida")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 40 && Number(v) <= 300, {
      message: "FC: 40–300 bpm",
    }),
  fr: z
    .string()
    .min(1, "F. Respiratoria requerida")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 10 && Number(v) <= 100, {
      message: "FR: 10–100 rpm",
    }),
  observaciones: z.string().min(3, "Las observaciones son requeridas"),
});
export type VitalSignsValues = z.infer<typeof vitalSignsSchema>;

const today = () => new Date().toISOString().split("T")[0];

export const vacunaHospSchema = z
  .object({
    idVacuna: z.string().min(1, "Selecciona una vacuna"),
    fechaAplicacion: z.string().min(1, "La fecha de aplicación es requerida"),
    lote: z.string().optional(),
    fechaProxima: z.string().optional(),
    peso: z
      .string()
      .optional()
      .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 200), {
        message: "Peso inválido (0.1–200 kg)",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.fechaProxima && data.fechaAplicacion && data.fechaProxima <= data.fechaAplicacion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La próxima dosis debe ser posterior a la fecha de aplicación",
        path: ["fechaProxima"],
      });
    }
  });
export type VacunaHospValues = z.infer<typeof vacunaHospSchema>;

export const archivoSchema = z.object({
  tipo_estudio: z.enum(["Radiografia", "Laboratorio", "Ecografia", "Electrocardiograma", "Otro"]),
  observaciones: z.string().optional(),
});
export type ArchivoValues = z.infer<typeof archivoSchema>;

export const insumoSchema = z.object({
  tipo: z.enum(["PRODUCTO", "SERVICIO"]),
  idItem: z.string().min(1, "Selecciona un ítem"),
  cantidad: z
    .string()
    .min(1, "La cantidad es requerida")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, {
      message: "La cantidad debe ser al menos 1",
    }),
  notas: z.string().optional(),
});
export type InsumoValues = z.infer<typeof insumoSchema>;
