"use client";

import React, { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { registerStaffSchema } from "@/lib/validations/auth.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface RegisterStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nuevoMiembro: {
    nombres: string;
    email: string;
    celular: string;
    rol: string;
  };
  setNuevoMiembro: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

type FormErrors = Partial<Record<string, string>>;

export function RegisterStaffDialog({
  open,
  onOpenChange,
  nuevoMiembro,
  setNuevoMiembro,
  onSubmit,
}: RegisterStaffDialogProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerStaffSchema.safeParse({
      nombres: nuevoMiembro.nombres,
      email: nuevoMiembro.email,
      celular: nuevoMiembro.celular || undefined,
      rol: nuevoMiembro.rol,
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
      title: "Registrar empleado",
      description: "¿Confirmar el registro de este nuevo empleado en el sistema?",
      variant: "default",
      confirmLabel: "Sí, registrar",
      onConfirm: () => onSubmit({ preventDefault: () => {} } as React.FormEvent),
    });
  };

  return (
  <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) setErrors({}); onOpenChange(v); }}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md hover:-translate-y-0.5 transition-transform">
          <Plus className="h-5 w-5 mr-2" /> Registrar Personal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Registrar Empleado / Colaborador
          </DialogTitle>
          <DialogDescription>
            Completa los datos del profesional para otorgarle permisos en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres y Apellidos *</Label>
            <Input
              id="nombres"
              placeholder="Ej. Dra. Claudia Rivas"
              value={nuevoMiembro.nombres}
              onChange={(e) => { setNuevoMiembro({ ...nuevoMiembro, nombres: e.target.value }); setErrors((p) => ({ ...p, nombres: undefined })); }}
              className={`rounded-xl h-11 ${errors.nombres ? "border-destructive" : ""}`}
            />
            {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="claudia.rivas@huellitas.com"
                value={nuevoMiembro.email}
                onChange={(e) => { setNuevoMiembro({ ...nuevoMiembro, email: e.target.value }); setErrors((p) => ({ ...p, email: undefined })); }}
                className={`rounded-xl h-11 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular de Contacto</Label>
              <Input
                id="celular"
                placeholder="Ej. 70123456"
                value={nuevoMiembro.celular}
                onChange={(e) => { setNuevoMiembro({ ...nuevoMiembro, celular: e.target.value }); setErrors((p) => ({ ...p, celular: undefined })); }}
                className={`rounded-xl h-11 ${errors.celular ? "border-destructive" : ""}`}
              />
              {errors.celular && <p className="text-xs text-destructive">{errors.celular}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol Asignado *</Label>
            <Select
              value={nuevoMiembro.rol}
              onValueChange={(v) => { setNuevoMiembro({ ...nuevoMiembro, rol: v }); setErrors((p) => ({ ...p, rol: undefined })); }}
            >
              <SelectTrigger className={`rounded-xl h-11 ${errors.rol ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Veterinario">Veterinario</SelectItem>
                <SelectItem value="Cajero">Cajero</SelectItem>
              </SelectContent>
            </Select>
            {errors.rol && <p className="text-xs text-destructive">{errors.rol}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { setErrors({}); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit">Agregar Empleado</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
