"use client";

import React, { useState } from "react";
import { Unlock, Lock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { aperturaCajaSchema, cierreCajaSchema } from "@/lib/validations/billing.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface AperturaCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montoInput: string;
  setMontoInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AperturaCajaDialog({
  open,
  onOpenChange,
  montoInput,
  setMontoInput,
  onSubmit,
}: AperturaCajaDialogProps) {
  const [error, setError] = useState<string | undefined>();
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = aperturaCajaSchema.safeParse({ montoInput });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    openConfirm({
      title: "Apertura de caja",
      description: `¿Confirmar la apertura de caja con Bs. ${montoInput} de monto inicial?`,
      variant: "warning",
      confirmLabel: "Sí, iniciar turno",
      onConfirm: () => onSubmit({ preventDefault: () => {} } as React.FormEvent),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Unlock className="h-6 w-6 text-primary" /> Apertura de Caja Comercial
          </DialogTitle>
          <DialogDescription>Asigna el efectivo inicial destinado al cambio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="montoApertura">Monto Inicial en Efectivo (Bs) *</Label>
            <Input
              id="montoApertura"
              type="number"
              value={montoInput}
              onChange={(e) => { setMontoInput(e.target.value); setError(undefined); }}
              className={`rounded-xl h-11 text-lg font-mono font-bold ${error ? "border-destructive" : ""}`}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl">
              Iniciar Turno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}

interface CierreCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldoInicial: number;
  recaudacionEfectivo: number;
  totalCajaCajon: number;
  efectivoContado: string;
  setEfectivoContado: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  ocultarMonto?: boolean;
}

export function CierreCajaDialog({
  open,
  onOpenChange,
  saldoInicial,
  recaudacionEfectivo,
  totalCajaCajon,
  efectivoContado,
  setEfectivoContado,
  onSubmit,
  ocultarMonto = false,
}: CierreCajaDialogProps) {
  const [error, setError] = useState<string | undefined>();
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = cierreCajaSchema.safeParse({ efectivoContado });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    openConfirm({
      title: "Cerrar caja",
      description: `¿Confirmar el cierre de caja con Bs. ${efectivoContado} en efectivo contado?`,
      variant: "warning",
      confirmLabel: "Sí, cerrar caja",
      onConfirm: () => onSubmit({ preventDefault: () => {} } as React.FormEvent),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-destructive">
            <Lock className="h-6 w-6" /> Arqueo y Cierre de Caja
          </DialogTitle>
          <DialogDescription>Verificación final del efectivo físico en el cajón.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {!ocultarMonto ? (
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 font-mono">
              <p>Monto Inicial: {saldoInicial.toFixed(2)} Bs</p>
              <p>Esperado en Ventas Efectivo: {recaudacionEfectivo.toFixed(2)} Bs</p>
              <Separator className="my-1 border-dashed" />
              <p className="font-bold text-foreground">TOTAL EFECTIVO ESPERADO: {totalCajaCajon.toFixed(2)} Bs</p>
            </div>
          ) : (
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 font-mono">
              <p>Monto Inicial de Cambio: {saldoInicial.toFixed(2)} Bs</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Arqueo a ciegas: Ingresa el conteo físico de billetes y monedas para declarar el cierre de caja.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="efectivoContado">Efectivo Físico Contado (Bs) *</Label>
            <Input
              id="efectivoContado"
              type="number"
              placeholder="Ingresa el conteo físico del cajón..."
              value={efectivoContado}
              onChange={(e) => { setEfectivoContado(e.target.value); setError(undefined); }}
              className={`rounded-xl h-11 text-lg font-mono font-bold ${error ? "border-destructive" : ""}`}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" className="rounded-xl">
              Cerrar Caja y Turno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}
