"use client";

import { useState } from "react";
import { AlertOctagon } from "lucide-react";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kardexService } from "@/domains/billing/services/kardex.service";
import { mermaSchema } from "@/lib/validations/inventory.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface ProductItem {
  id: string;
  nombre: string;
  stockActual: number;
}

interface RegisterMermaDialogProps {
  productos: ProductItem[];
  onMermaRegistered?: () => void;
}

const MOTIVOS = [
  { value: "Caducidad",       label: "Vencido / Caducado" },
  { value: "Rotura",          label: "Rotura / Daño fisico" },
  { value: "Robo",            label: "Perdida / Robo" },
  { value: "Consumo Interno", label: "Uso clinico interno" },
  { value: "Otro",            label: "Otro motivo" },
];

type FormErrors = Partial<Record<string, string>>;

export function RegisterMermaDialog({ productos, onMermaRegistered }: RegisterMermaDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen]             = useState(false);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad]     = useState("");
  const [motivo, setMotivo]         = useState("");
  const [notas, setNotas]           = useState("");
  const [errors, setErrors]         = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const selectedProduct = productos.find((p) => p.id === productoId);

  const { mutateAsync: registrar, isPending } = useMutation({
    mutationFn: (payload: any) => kardexService.registrar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["kardex-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["lotes-caducidad"] });
      onMermaRegistered?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = mermaSchema.safeParse({ productoId, cantidad, motivo, notas: notas || undefined });
    if (!result.success) {
      const errs: FormErrors = {};
      result.error.issues.forEach((err: any) => {
        const key = err.path[0] as string;
        if (!errs[key]) errs[key] = err.message;
      });
      setErrors(errs);
      return;
    }

    const cantVal = parseInt(cantidad, 10);
    if (selectedProduct && cantVal > selectedProduct.stockActual) {
      setErrors({ cantidad: `Stock insuficiente. Disponible: ${selectedProduct.stockActual}` });
      return;
    }
    setErrors({});

    const motivoDetalle = notas.trim() ? `${motivo}. ${notas.trim()}` : motivo;

    openConfirm({
      title: "Registrar merma",
      description: `¿Descontar ${cantVal} unidades de ${selectedProduct?.nombre ?? "este producto"}? Esta acción no se puede deshacer.`,
      variant: "warning",
      confirmLabel: "Sí, registrar merma",
      onConfirm: async () => {
        await registrar({
          id_producto_fk:  productoId,
          tipo_movimiento: "Merma",
          cantidad:        cantVal,
          motivo_detalle:  motivoDetalle,
        });
        toast.success("Merma registrada en el Kardex", {
          description: `${cantVal} unidades descontadas de ${selectedProduct?.nombre}.`,
        });
        setProductoId(""); setCantidad(""); setMotivo(""); setNotas("");
        setOpen(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="rounded-xl gap-2">
          <AlertOctagon className="h-4 w-4" /> Registrar Merma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-120 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertOctagon className="h-5 w-5" /> Registrar merma / perdida
          </DialogTitle>
          <DialogDescription className="text-sm">
            Descuenta stock por rotura, vencimiento, perdida u otro motivo. Se registra un movimiento en el Kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="merma-producto" className="text-sm font-medium">Producto afectado <span className="text-destructive">*</span></Label>
            <Select value={productoId} onValueChange={(v) => { setProductoId(v); setErrors((p) => ({ ...p, productoId: undefined })); }}>
              <SelectTrigger id="merma-producto" className={`rounded-lg h-10 ${errors.productoId ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.filter(p => p.stockActual > 0).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} — {p.stockActual} en stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productoId && <p className="text-xs text-destructive">{errors.productoId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="merma-cantidad" className="text-sm font-medium">Cantidad <span className="text-destructive">*</span></Label>
              <Input
                id="merma-cantidad"
                type="number"
                placeholder="Ej: 3"
                value={cantidad}
                onChange={(e) => { setCantidad(e.target.value); setErrors((p) => ({ ...p, cantidad: undefined })); }}
                className={`rounded-lg h-10 ${errors.cantidad ? "border-destructive" : ""}`}
                min="1"
                max={selectedProduct?.stockActual}
              />
              {errors.cantidad
                ? <p className="text-xs text-destructive">{errors.cantidad}</p>
                : selectedProduct && <p className="text-[11px] text-muted-foreground">Max: {selectedProduct.stockActual}</p>
              }
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="merma-motivo" className="text-sm font-medium">Motivo <span className="text-destructive">*</span></Label>
              <Select value={motivo} onValueChange={(v) => { setMotivo(v); setErrors((p) => ({ ...p, motivo: undefined })); }}>
                <SelectTrigger id="merma-motivo" className={`rounded-lg h-10 ${errors.motivo ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.motivo && <p className="text-xs text-destructive">{errors.motivo}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="merma-notas" className="text-sm font-medium">Observaciones</Label>
            <Textarea
              id="merma-notas"
              placeholder="Detalla lo ocurrido..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" className="rounded-lg">
              Confirmar merma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      {dialog}
    </>
  );
}
