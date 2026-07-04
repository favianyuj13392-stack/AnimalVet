import { z } from "zod";

// --- REGLAS REUTILIZABLES ---
export const globalRules = {
  id: z.coerce.number().positive(),
  // Evita que peguen 500 palabras donde va un nombre
  name: z.string()
    .min(2, "Demasiado corto")
    .max(60, "Máximo 60 caracteres"),
  // Para descripciones largas (Diagnósticos, Notas)
  description: z.string()
    .min(5, "Por favor sé más detallado")
    .max(1500, "Límite de 1500 caracteres excedido"),
  phone: z.string().regex(/^[67]\d{7}$/, "Número de Bolivia inválido"),
  positiveNum: z.coerce.number().min(0, "No puede ser negativo"),
};

// --- ESQUEMAS EJEMPLO ---
export const petSchema = z.object({
  nombre: globalRules.name,
  especie: z.string().min(1, "Requerido"),
  peso: globalRules.positiveNum,
  observaciones: globalRules.description.optional(),
});

export const productSchema = z.object({
  nombre: globalRules.name,
  precio: globalRules.positiveNum,
  stock: z.coerce.number().int().min(0),
});

export const especieSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 letras")
    .max(50, "El nombre es demasiado largo"),
});

export type EspecieFormData = z.infer<typeof especieSchema>;

export const razaSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 letras")
    .max(50, "El nombre es demasiado largo"),
  id_especie_fk: z.number().positive("Selecciona una especie válida"),
});

export type RazaFormData = z.infer<typeof razaSchema>;

export const servicioSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre del servicio debe tener al menos 2 letras")
    .max(100),
  descripcion: z.string().max(500).optional(),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  duracion_minutos: z.number().int().positive("La duración debe ser positiva"),
  requiere_veterinario: z.boolean(),
});

export type ServicioFormData = z.infer<typeof servicioSchema>;

export const vacunaSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre de la vacuna debe tener al menos 2 letras")
    .max(100),
  descripcion: z.string().max(500).optional(),
  diasParaRefuerzo: z.number().int().positive("Los días para refuerzo deben ser mayores a 0"),
  id_especie_fk: z.number().positive("Selecciona una especie válida"),
  id_producto_fk: z.string().uuid().optional().nullable(), // <-- NUEVO CAMPO
});

export type VacunaFormData = z.infer<typeof vacunaSchema>;

export const categoriaSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre de la categoría debe tener al menos 2 letras")
    .max(100),
  descripcion: z.string().max(500).optional(),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;