"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { Pill, Syringe, Activity, Loader2 } from "lucide-react";
import { useCrud } from "@/shared/hooks/useCrud";
import { productosService } from "@/domains/inventory/services/productos.service";
import { servicesService } from "@/domains/billing/services/services.service";
import { insumoSchema } from "@/lib/validations/clinical.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface AddInsumoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (insumoData: any) => Promise<void>;
  pacienteNombre: string;
}

type FormErrors = Partial<Record<string, string>>;

export function AddInsumoDialog({ open, onOpenChange, onSubmit, pacienteNombre }: AddInsumoDialogProps) {
  const [tipo, setTipo] = useState<"PRODUCTO" | "SERVICIO">("PRODUCTO");
  const [idItem, setIdItem] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [notas, setNotas] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const { data: productos, loading: isLoadingProductos } = useCrud(
    productosService,
    "productos-inventario",
    { enabled: open && tipo === "PRODUCTO" }
  );

  const { data: servicios, loading: isLoadingServicios } = useCrud(
    servicesService,
    "servicios-clinicos",
    { enabled: open && tipo === "SERVICIO" }
  );

  useEffect(() => {
    setIdItem("");
    setErrors({});
    if (tipo === "SERVICIO") setCantidad("1");
  }, [tipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = insumoSchema.safeParse({ tipo, idItem, cantidad, notas: notas || undefined });
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
      title: "Cargar insumo",
      description: `¿Confirmar el cargo de este ${tipo.toLowerCase()} a la cuenta de ${pacienteNombre}?`,
      variant: "default",
      confirmLabel: "Sí, cargar",
      onConfirm: async () => {
        await onSubmit({
          id_producto_fk: tipo === "PRODUCTO" ? idItem : undefined,
          id_servicio_fk: tipo === "SERVICIO" ? Number(idItem) : undefined,
          cantidad: Number(cantidad),
          notas,
        });
        setIdItem(""); setCantidad("1"); setNotas(""); setTipo("PRODUCTO");
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
              <Pill className="h-5 w-5 text-primary" /> Cargar Insumo / Servicio
            </DialogTitle>
            <DialogDescription>
              Añade cargos a la cuenta clínica de <strong>{pacienteNombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Cargo</label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={tipo === "PRODUCTO" ? "default" : "outline"} onClick={() => setTipo("PRODUCTO")} className="rounded-xl font-semibold transition-all">
                  <Syringe className="w-4 h-4 mr-2" /> Producto
                </Button>
                <Button type="button" variant={tipo === "SERVICIO" ? "default" : "outline"} onClick={() => setTipo("SERVICIO")} className="rounded-xl font-semibold transition-all">
                  <Activity className="w-4 h-4 mr-2" /> Servicio
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Seleccionar {tipo === "PRODUCTO" ? "Producto" : "Servicio"}
              </label>
              <Select value={idItem} onValueChange={(v) => { setIdItem(v); setErrors((p) => ({ ...p, idItem: undefined })); }} disabled={isLoadingProductos || isLoadingServicios}>
                <SelectTrigger className={`rounded-xl ${errors.idItem ? "border-destructive" : ""}`}>
                  <SelectValue placeholder={
                    (tipo === "PRODUCTO" && isLoadingProductos) || (tipo === "SERVICIO" && isLoadingServicios)
                      ? "Cargando catálogo..."
                      : `Selecciona un ${tipo.toLowerCase()}...`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {tipo === "PRODUCTO" && productos?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.stockActual <= 0}>
                      {p.nombre} {p.stockActual > 0 ? `(Stock: ${p.stockActual})` : '(Sin Stock)'}
                    </SelectItem>
                  ))}
                  {tipo === "SERVICIO" && servicios?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nombre} - Bs. {s.precio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.idItem && <p className="text-xs text-destructive">{errors.idItem}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Cantidad / Unidades</label>
              <Input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => { setCantidad(e.target.value); setErrors((p) => ({ ...p, cantidad: undefined })); }}
                className={`rounded-xl font-mono font-bold ${errors.cantidad ? "border-destructive" : ""}`}
              />
              {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Notas o Indicaciones (Opcional)</label>
              <Textarea
                placeholder={tipo === "PRODUCTO" ? "Ej. Suministrado en vía venosa" : "Ej. Resultados pendientes de laboratorio"}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold">
              Cancelar
            </Button>
            <Button type="submit" disabled={!idItem} className="rounded-xl font-bold bg-primary shadow-md">
              <Pill className="mr-2 h-4 w-4" />
              Guardar Cargo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
