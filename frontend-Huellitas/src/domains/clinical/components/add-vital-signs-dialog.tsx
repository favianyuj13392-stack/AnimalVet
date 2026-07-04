"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { vitalSignsSchema } from "@/lib/validations/clinical.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface AddVitalSignsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLog: { temp: string; fc: string; fr: string; turno: string; observaciones: string };
  setNewLog: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  pacienteNombre: string;
}

type FormErrors = Partial<Record<string, string>>;

export function AddVitalSignsDialog({
  open,
  onOpenChange,
  newLog,
  setNewLog,
  onSubmit,
  pacienteNombre,
}: AddVitalSignsDialogProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: undefined }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = vitalSignsSchema.safeParse({
      turno: newLog.turno,
      temp: newLog.temp,
      fc: newLog.fc,
      fr: newLog.fr,
      observaciones: newLog.observaciones,
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
      title: "Registrar signos vitales",
      description: `¿Confirmar el registro de monitoreo para ${pacienteNombre}?`,
      variant: "default",
      confirmLabel: "Sí, registrar",
      onConfirm: () => onSubmit({ preventDefault: () => {} } as React.FormEvent),
    });
  };

  return (
  <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) setErrors({}); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Signos Vitales</DialogTitle>
          <DialogDescription>Añadir medición horaria para {pacienteNombre}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="log-turno">Turno del Control</Label>
            <Select
              value={newLog.turno}
              onValueChange={(val) => { setNewLog({ ...newLog, turno: val }); clearError("turno"); }}
            >
              <SelectTrigger id="log-turno" className={`rounded-lg ${errors.turno ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Seleccione el turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mañana">Mañana</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="Noche">Noche</SelectItem>
              </SelectContent>
            </Select>
            {errors.turno && <p className="text-xs text-destructive">{errors.turno}</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="log-temp">Temp (°C)</Label>
              <Input
                id="log-temp"
                type="number"
                step="0.1"
                value={newLog.temp}
                onChange={(e) => { setNewLog({ ...newLog, temp: e.target.value }); clearError("temp"); }}
                className={`rounded-lg ${errors.temp ? "border-destructive" : ""}`}
                placeholder="38.5"
              />
              {errors.temp && <p className="text-[10px] text-destructive">{errors.temp}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="log-fc">F.C. (bpm)</Label>
              <Input
                id="log-fc"
                type="number"
                value={newLog.fc}
                onChange={(e) => { setNewLog({ ...newLog, fc: e.target.value }); clearError("fc"); }}
                className={`rounded-lg ${errors.fc ? "border-destructive" : ""}`}
                placeholder="120"
              />
              {errors.fc && <p className="text-[10px] text-destructive">{errors.fc}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="log-fr">F.R. (rpm)</Label>
              <Input
                id="log-fr"
                type="number"
                value={newLog.fr}
                onChange={(e) => { setNewLog({ ...newLog, fr: e.target.value }); clearError("fr"); }}
                className={`rounded-lg ${errors.fr ? "border-destructive" : ""}`}
                placeholder="30"
              />
              {errors.fr && <p className="text-[10px] text-destructive">{errors.fr}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-obs">Observaciones Clínicas</Label>
            <Textarea
              id="log-obs"
              value={newLog.observaciones}
              onChange={(e) => { setNewLog({ ...newLog, observaciones: e.target.value }); clearError("observaciones"); }}
              className={`rounded-lg min-h-[80px] ${errors.observaciones ? "border-destructive" : ""}`}
              placeholder="Ej. El paciente se encuentra estable, consumió alimento húmedo..."
            />
            {errors.observaciones && <p className="text-xs text-destructive">{errors.observaciones}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Monitoreo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
