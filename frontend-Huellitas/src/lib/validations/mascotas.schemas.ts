import { z } from "zod";

const today = () => new Date().toISOString().split("T")[0];

export const mascotaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(60, "Nombre muy largo"),
  sexo: z.enum(["M", "H"]),
  especieId: z.string().min(1, "Selecciona la especie"),
  id_raza_fk: z.string().optional(),
  fecha_nacimiento: z
    .string()
    .optional()
    .refine((v) => !v || v <= today(), {
      message: "La fecha de nacimiento no puede ser futura",
    }),
  esterilizado: z.boolean(),
  foto_url: z.string().optional(),
  caracteristicas_fisicas: z.string().max(300, "Máximo 300 caracteres").optional(),
  contacto_emergencia_telefono: z
    .string()
    .optional()
    .refine((v) => !v || /^[67]\d{7}$/.test(v), {
      message: "Teléfono boliviano inválido (ej: 70123456)",
    }),
});
export type MascotaValues = z.infer<typeof mascotaSchema>;
