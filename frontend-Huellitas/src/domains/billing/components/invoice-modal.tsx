"use client";

import React from "react";
import { Receipt, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

interface CartItem {
  nombre: string;
  precio: number;
  cantidad: number;
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facturaNro: number;
  clienteSelect: any;
  carrito: CartItem[];
  subtotal: number;
  descuento: number;
  total: number;
  onConfirmarFactura: () => void;
}

export function InvoiceModal({
  open,
  onOpenChange,
  facturaNro,
  clienteSelect,
  carrito,
  subtotal,
  descuento,
  total,
  onConfirmarFactura,
}: InvoiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 bg-white dark:bg-zinc-900 border">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-1.5 text-zinc-900 dark:text-zinc-50">
            <Receipt className="h-5 w-5 text-primary" /> FACTURA OFICIAL
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Clínica Veterinaria Huellitas Digitales SRL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4 text-xs font-mono text-zinc-700 dark:text-zinc-300">
          <div className="text-center border-b pb-3 border-dashed space-y-1">
            <p className="font-bold text-sm">HUELLITAS VET</p>
            <p>NIT: 288394028 • Autorización: 1993029940</p>
            <p>Av. Arce Edif. Los Pinos Nro. 2480</p>
            <p>La Paz - Bolivia</p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b pb-3 border-dashed">
            <div>
              <p>
                <span className="font-bold">FACTURA N°:</span> {facturaNro}
              </p>
              <p>
                <span className="font-bold">FECHA:</span> {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-bold">NIT/CI:</span> {clienteSelect?.ci || "1234567"}
              </p>
              <p>
                <span className="font-bold">CLIENTE:</span> {clienteSelect?.nombres || "Cliente General"}
              </p>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-2 border-b pb-3 border-dashed">
            <div className="grid grid-cols-3 font-bold border-b pb-1">
              <span>Detalle</span>
              <span className="text-center">Cant</span>
              <span className="text-right">Total</span>
            </div>
            {carrito.map((item) => (
              <div key={item.nombre} className="grid grid-cols-3 text-zinc-600 dark:text-zinc-400">
                <span className="truncate">{item.nombre}</span>
                <span className="text-center">{item.cantidad}</span>
                <span className="text-right">{(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totales Factura */}
          <div className="space-y-1.5 text-right font-bold text-sm">
            <p>SUBTOTAL: {subtotal.toFixed(2)} Bs</p>
            <p>DESCUENTO: {(subtotal * (descuento / 100)).toFixed(2)} Bs</p>
            <p className="text-primary text-base font-black border-t pt-1 border-dashed">
              TOTAL COBRADO: {total.toFixed(2)} Bs
            </p>
          </div>

          <div className="text-center text-[10px] text-muted-foreground pt-4 leading-normal space-y-1">
            <p>
              "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO DE ACUERDO A LEY"
            </p>
            <p className="font-bold mt-2">¡Gracias por confiar el cuidado de tu peludo en nuestras manos!</p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row gap-2 justify-end w-full">
          <Button variant="outline" className="rounded-xl flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="rounded-xl flex-1" onClick={onConfirmarFactura}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirmar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
