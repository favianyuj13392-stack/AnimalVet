"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Syringe, Loader2 } from "lucide-react";
import { useCrud } from "@/shared/hooks/useCrud";
import { vaccinesCatalogService } from "@/domains/clinical/services/vaccines-catalog.service";
import { vacunaHospSchema } from "@/lib/validations/clinical.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface AddVacunaHospDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (vacunaData: any) => Promise<void>;
  pacienteNombre: string;
}

type FormErrors = Partial<Record<string, string>>;

export function AddVacunaHospDialog({ open, onOpenChange, onSubmit, pacienteNombre }: AddVacunaHospDialogProps) {
  const [idVacuna, setIdVacuna] = useState("");
  const [lote, setLote] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState(new Date().toISOString().split('T')[0]);
  const [fechaProxima, setFechaProxima] = useState("");
  const [peso, setPeso] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const { data: vacunas, loading: isLoadingVacunas } = useCrud(
    vaccinesCatalogService,
    "vaccines-catalog",
    { enabled: open }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = vacunaHospSchema.safeParse({ idVacuna, fechaAplicacion, lote: lote || undefined, fechaProxima: fechaProxima || undefined, peso: peso || undefined });
    if (!result.success) {
      const errs: FormErrors = {};
      result.error.issues.forEach((err: any) => {
        const key = err.path[0] as string;
        if (!errs[key]) errs[key] = err.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    openConfirm({
      title: "Aplicar vacuna",
      description: `¿Confirmar la aplicación de esta vacuna a ${pacienteNombre}?`,
      variant: "default",
      confirmLabel: "Sí, aplicar",
      onConfirm: async () => {
        await onSubmit({
          id_vacuna_fk: Number(idVacuna),
          fecha_aplicacion: fechaAplicacion,
          lote_vacuna: lote || null,
          peso_mascota_kg: peso ? Number(peso) : null,
          fecha_proxima_dosis: fechaProxima || null,
        });
        setIdVacuna(""); setLote(""); setFechaProxima(""); setPeso("");
      },
    });
  };

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/50 bg-background/95 backdrop-blur-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Syringe className="h-5 w-5 text-primary" /> Aplicar Vacuna
            </DialogTitle>
            <DialogDescription>
              Registrar aplicación de vacuna para <strong>{pacienteNombre}</strong> durante su internación.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Seleccionar Vacuna</label>
              <Select value={idVacuna} onValueChange={(v) => { setIdVacuna(v); setErrors((p) => ({ ...p, idVacuna: undefined })); }} disabled={isLoadingVacunas}>
                <SelectTrigger className={`rounded-xl ${errors.idVacuna ? "border-destructive" : ""}`}>
                  <SelectValue placeholder={isLoadingVacunas ? "Cargando vacunas..." : "Selecciona la vacuna..."} />
                </SelectTrigger>
                <SelectContent>
                  {vacunas?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.nombre_vacuna}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.idVacuna && <p className="text-xs text-destructive">{errors.idVacuna}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Fecha Aplicación</label>
                <Input
                  type="date"
                  value={fechaAplicacion}
                  onChange={(e) => setFechaAplicacion(e.target.value)}
                  className={`rounded-xl ${errors.fechaAplicacion ? "border-destructive" : ""}`}
                />
                {errors.fechaAplicacion && <p className="text-xs text-destructive">{errors.fechaAplicacion}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Lote (Opcional)</label>
                <Input placeholder="Ej. L-409" value={lote} onChange={(e) => setLote(e.target.value)} className="rounded-xl uppercase font-mono text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Próxima Dosis</label>
                <Input
                  type="date"
                  value={fechaProxima}
                  onChange={(e) => setFechaProxima(e.target.value)}
                  className={`rounded-xl ${errors.fechaProxima ? "border-destructive" : ""}`}
                />
                {errors.fechaProxima && <p className="text-xs text-destructive">{errors.fechaProxima}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 12.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className={`rounded-xl ${errors.peso ? "border-destructive" : ""}`}
                />
                {errors.peso && <p className="text-xs text-destructive">{errors.peso}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold">Cancelar</Button>
            <Button type="submit" className="rounded-xl font-bold bg-primary shadow-md">
              Guardar Vacuna
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
