import { z } from "zod";

export const productSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  descripcion: z.string().optional(),
  id_categoria_fk: z.string().min(1, "Selecciona una categoría"),
  unidad_medida: z.string().min(1, "Selecciona la unidad de medida"),
  precio_venta: z
    .string()
    .min(1, "El precio es obligatorio")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "El precio debe ser mayor a 0",
    }),
  stock_minimo: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "El stock mínimo no puede ser negativo",
    }),
  stock_actual: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "El stock no puede ser negativo",
    }),
  requiere_receta: z.boolean(),
  imagen_url: z.string().optional(),
});
export type ProductValues = z.infer<typeof productSchema>;

const today = () => new Date().toISOString().split("T")[0];

export const loteSchema = z.object({
  productoId: z.string().min(1, "Selecciona un producto"),
  numeroLote: z.string().min(1, "El número de lote es obligatorio"),
  fechaVencimiento: z
    .string()
    .min(1, "La fecha de vencimiento es obligatoria")
    .refine((v) => v > today(), {
      message: "La fecha de vencimiento debe ser posterior a hoy",
    }),
  cantidadInicial: z
    .string()
    .min(1, "La cantidad es obligatoria")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, {
      message: "La cantidad debe ser al menos 1",
    }),
});
export type LoteValues = z.infer<typeof loteSchema>;

export const mermaSchema = z.object({
  productoId: z.string().min(1, "Selecciona un producto"),
  cantidad: z
    .string()
    .min(1, "La cantidad es obligatoria")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, {
      message: "La cantidad debe ser al menos 1",
    }),
  motivo: z.string().min(1, "Selecciona el motivo"),
  notas: z.string().optional(),
});
export type MermaValues = z.infer<typeof mermaSchema>;
