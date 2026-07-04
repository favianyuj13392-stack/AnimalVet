import { z } from "zod";

export const aperturaCajaSchema = z.object({
  montoInput: z
    .string()
    .min(1, "Ingresa el monto inicial")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "El monto no puede ser negativo",
    }),
});
export type AperturaCajaValues = z.infer<typeof aperturaCajaSchema>;

export const cierreCajaSchema = z.object({
  efectivoContado: z
    .string()
    .min(1, "Ingresa el efectivo contado")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "El efectivo contado no puede ser negativo",
    }),
});
export type CierreCajaValues = z.infer<typeof cierreCajaSchema>;
