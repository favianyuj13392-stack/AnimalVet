"use client";

import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lotesService } from "@/domains/billing/services/lotes.service";
import { loteSchema } from "@/lib/validations/inventory.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface ProductoItem {
  id: string;
  nombre: string;
  unidadMedida?: string;
}

interface RegisterLoteDialogProps {
  productos: ProductoItem[];
}

type FormErrors = Partial<Record<string, string>>;

export function RegisterLoteDialog({ productos }: RegisterLoteDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productoId, setProductoId] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: any) => lotesService.crear(payload),
    onSuccess: (lote: any) => {
      queryClient.invalidateQueries({ queryKey: ["lotes-caducidad"] });
      queryClient.invalidateQueries({ queryKey: ["kardex-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["productos-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["lotes-alertas-widget"] });
      toast.success("Lote registrado y stock actualizado", {
        description: `+${lote.cantidadInicial ?? cantidadInicial} unidades ingresadas al inventario.`,
      });
      setProductoId(""); setNumeroLote(""); setFechaVencimiento(""); setCantidadInicial("");
      setErrors({});
      setOpen(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loteSchema.safeParse({ productoId, numeroLote, fechaVencimiento, cantidadInicial });
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
      title: "Confirmar ingreso de lote",
      description: `¿Ingresar ${cantidadInicial} unidades de ${productoSeleccionado?.nombre ?? "este producto"} al inventario?`,
      variant: "default",
      confirmLabel: "Sí, ingresar",
      onConfirm: async () => {
        await mutateAsync({
          id_producto_fk: productoId,
          numero_lote: numeroLote.trim().toUpperCase(),
          fecha_vencimiento: fechaVencimiento,
          cantidad_inicial: parseInt(cantidadInicial, 10),
        });
      },
    });
  };

  const productoSeleccionado = productos.find((p) => p.id === productoId);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2">
          <PackagePlus className="h-4 w-4" /> Ingresar lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-120 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" /> Ingresar nuevo lote
          </DialogTitle>
          <DialogDescription className="text-sm">
            Registra la entrada de mercaderia. El stock del producto se actualiza automaticamente y se genera un movimiento en el Kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="lote-producto" className="text-sm font-medium">
              Producto <span className="text-destructive">*</span>
            </Label>
            <Select value={productoId} onValueChange={(v) => { setProductoId(v); setErrors((p) => ({ ...p, productoId: undefined })); }}>
              <SelectTrigger id="lote-producto" className={`rounded-lg h-10 ${errors.productoId ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}{p.unidadMedida ? ` (${p.unidadMedida})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productoId && <p className="text-xs text-destructive">{errors.productoId}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lote-numero" className="text-sm font-medium">
              Numero de lote <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lote-numero"
              placeholder="Ej: LOTE-AMOX-001"
              value={numeroLote}
              onChange={(e) => { setNumeroLote(e.target.value); setErrors((p) => ({ ...p, numeroLote: undefined })); }}
              className={`rounded-lg h-10 font-mono uppercase ${errors.numeroLote ? "border-destructive" : ""}`}
            />
            {errors.numeroLote && <p className="text-xs text-destructive">{errors.numeroLote}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lote-fecha" className="text-sm font-medium">
                Fecha de vencimiento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lote-fecha"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => { setFechaVencimiento(e.target.value); setErrors((p) => ({ ...p, fechaVencimiento: undefined })); }}
                min={new Date().toISOString().split("T")[0]}
                className={`rounded-lg h-10 ${errors.fechaVencimiento ? "border-destructive" : ""}`}
              />
              {errors.fechaVencimiento && <p className="text-xs text-destructive">{errors.fechaVencimiento}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lote-cantidad" className="text-sm font-medium">
                Cantidad a ingresar <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lote-cantidad"
                type="number"
                placeholder="Ej: 50"
                value={cantidadInicial}
                onChange={(e) => { setCantidadInicial(e.target.value); setErrors((p) => ({ ...p, cantidadInicial: undefined })); }}
                min="1"
                className={`rounded-lg h-10 ${errors.cantidadInicial ? "border-destructive" : ""}`}
              />
              {errors.cantidadInicial && <p className="text-xs text-destructive">{errors.cantidadInicial}</p>}
            </div>
          </div>

          {productoSeleccionado && cantidadInicial && Number(cantidadInicial) > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs space-y-0.5">
              <p className="font-medium text-primary">Resumen del ingreso</p>
              <p className="text-muted-foreground">
                +{cantidadInicial} unidades de <span className="font-medium text-foreground">{productoSeleccionado.nombre}</span> seran agregadas al stock.
              </p>
              <p className="text-muted-foreground">
                Se generara automaticamente un movimiento <span className="font-medium text-foreground">Entrada</span> en el Kardex.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-lg">
              Confirmar ingreso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      {dialog}
    </>
  );
}
