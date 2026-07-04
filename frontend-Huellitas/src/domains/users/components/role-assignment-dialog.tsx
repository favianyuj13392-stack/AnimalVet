"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { ImageUploader } from "@/shared/components/ui/image-uploader";
import { roleAssignmentSchema } from "@/lib/validations/auth.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface Role {
  id: number;
  nombre: string;
}

interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any | null;
  form: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    ci: string;
    rolId: string;
    password?: string;
    avatar_url?: string;
    numero_matricula?: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  roles: Role[];
}

type FormErrors = Partial<Record<string, string>>;

export function RoleAssignmentDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSubmit,
  roles,
}: RoleAssignmentDialogProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const handleSubmit = () => {
    const result = roleAssignmentSchema.safeParse({
      nombres: form.nombres,
      apellidos: form.apellidos,
      email: form.email,
      telefono: form.telefono || undefined,
      ci: form.ci,
      rolId: form.rolId,
      password: form.password || undefined,
      avatar_url: form.avatar_url || undefined,
      numero_matricula: form.numero_matricula || undefined,
    });
    if (!result.success) {
      const errs: FormErrors = {};
      result.error.issues.forEach((issue: any) => {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    openConfirm({
      title: editing ? "Guardar cambios" : "Crear usuario",
      description: editing
        ? "¿Confirmar los cambios en este usuario?"
        : "¿Confirmar la creación de este usuario en el sistema?",
      variant: editing ? "warning" : "default",
      confirmLabel: editing ? "Sí, guardar" : "Sí, crear",
      onConfirm: () => onSubmit(),
    });
  };

  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: undefined }));

  return (
  <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) setErrors({}); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {editing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>
        <ImageUploader
          label="Foto de perfil"
          placeholder="Seleccionar foto"
          value={form.avatar_url || ""}
          onChange={(url) => setForm({ ...form, avatar_url: url })}
        />
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres *</Label>
            <Input
              id="nombres"
              className={`rounded-xl h-11 ${errors.nombres ? "border-destructive" : ""}`}
              value={form.nombres}
              onChange={(e) => { setForm({ ...form, nombres: e.target.value }); clearError("nombres"); }}
            />
            {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input
              id="apellidos"
              className={`rounded-xl h-11 ${errors.apellidos ? "border-destructive" : ""}`}
              value={form.apellidos}
              onChange={(e) => { setForm({ ...form, apellidos: e.target.value }); clearError("apellidos"); }}
            />
            {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci">Cédula / CI *</Label>
            <Input
              id="ci"
              className={`rounded-xl h-11 ${errors.ci ? "border-destructive" : ""}`}
              value={form.ci}
              onChange={(e) => { setForm({ ...form, ci: e.target.value }); clearError("ci"); }}
            />
            {errors.ci && <p className="text-xs text-destructive">{errors.ci}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              className={`rounded-xl h-11 ${errors.telefono ? "border-destructive" : ""}`}
              value={form.telefono}
              onChange={(e) => { setForm({ ...form, telefono: e.target.value }); clearError("telefono"); }}
            />
            {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              className={`rounded-xl h-11 ${errors.email ? "border-destructive" : ""}`}
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError("email"); }}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol *</Label>
            <Select
              value={form.rolId}
              onValueChange={(v) => { setForm({ ...form, rolId: v }); clearError("rolId"); }}
            >
              <SelectTrigger className={`rounded-xl h-11 ${errors.rolId ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rolId && <p className="text-xs text-destructive">{errors.rolId}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {editing ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña *"}
            </Label>
            <Input
              id="password"
              type="password"
              className={`rounded-xl h-11 ${errors.password ? "border-destructive" : ""}`}
              value={form.password || ""}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError("password"); }}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Matrícula — solo visible si el rol es Veterinario (id=2) */}
          {form.rolId === "2" && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="matricula" className="flex items-center gap-1.5">
                Nº de Matrícula Profesional
                <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">Solo Veterinarios</span>
              </Label>
              <Input
                id="matricula"
                className={`rounded-xl h-11 font-mono ${errors.numero_matricula ? "border-destructive" : ""}`}
                placeholder="Ej. VET-2024-00123"
                value={form.numero_matricula || ""}
                onChange={(e) => { setForm({ ...form, numero_matricula: e.target.value }); clearError("numero_matricula"); }}
              />
              {errors.numero_matricula && (
                <p className="text-xs text-destructive">{errors.numero_matricula}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Requerido para que aparezca en las recetas médicas y documentos oficiales.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => { setErrors({}); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={handleSubmit}>
            {editing ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
