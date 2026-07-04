import { z } from "zod";

export const registerStaffSchema = z.object({
  nombres: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  celular: z
    .string()
    .optional()
    .refine((v) => !v || /^[67]\d{7}$/.test(v), {
      message: "Celular boliviano inválido (ej: 70123456)",
    }),
  rol: z.string().min(1, "Selecciona un rol"),
});
export type RegisterStaffValues = z.infer<typeof registerStaffSchema>;

export const roleAssignmentSchema = z
  .object({
    nombres: z.string().min(2, "Mínimo 2 caracteres"),
    apellidos: z.string().min(2, "Mínimo 2 caracteres"),
    ci: z
      .string()
      .min(5, "CI muy corto")
      .max(15, "CI muy largo")
      .regex(/^\d+$/, "Solo números"),
    telefono: z
      .string()
      .optional()
      .refine((v) => !v || /^[67]\d{7}$/.test(v), {
        message: "Teléfono boliviano inválido (ej: 70123456)",
      }),
    email: z.string().email("Correo electrónico inválido"),
    rolId: z.string().min(1, "Selecciona un rol"),
    password: z.string().optional(),
    avatar_url: z.string().optional(),
    numero_matricula: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.rolId === "2" && !data.numero_matricula?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La matrícula es requerida para veterinarios",
        path: ["numero_matricula"],
      });
    }
  });
export type RoleAssignmentValues = z.infer<typeof roleAssignmentSchema>;

export const nuevoClienteSchema = z.object({
  nombres: z.string().min(2, "Mínimo 2 caracteres"),
  apellidos: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/\d/, "Debe contener al menos un número"),
  telefono: z
    .string()
    .optional()
    .refine((v) => !v || /^[67]\d{7}$/.test(v), {
      message: "Teléfono boliviano inválido (ej: 70123456)",
    }),
});
export type NuevoClienteValues = z.infer<typeof nuevoClienteSchema>;
