"use client";

import React from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Percent,
  Coins,
  CreditCard,
  QrCode,
  Receipt,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface PosCartProps {
  carrito: CartItem[];
  onUpdateCantidad: (nombre: string, delta: number) => void;
  onEliminarItem: (nombre: string) => void;
  descuento: number;
  setDescuento: (val: number) => void;
  metodoPago: string;
  setMetodoPago: (val: string) => void;
  subtotal: number;
  total: number;
  onProcesarPago: () => void;
}

export function PosCart({
  carrito,
  onUpdateCantidad,
  onEliminarItem,
  descuento,
  setDescuento,
  metodoPago,
  setMetodoPago,
  subtotal,
  total,
  onProcesarPago,
}: PosCartProps) {
  const totalItems = carrito.reduce((acc, c) => acc + c.cantidad, 0);

  return (
    <Card className="rounded-3xl border-border/50 shadow-md flex flex-col min-h-[500px]">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Carrito
          </span>
          <Badge variant="secondary">{totalItems} Items</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pt-6 overflow-y-auto max-h-[300px]">
        {carrito.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm">Agrega productos o servicios para iniciar el cobro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {carrito.map((c) => (
              <div
                key={c.id || c.nombre}
                className="flex justify-between items-center bg-card p-3 rounded-xl border border-border/60 text-xs"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold truncate text-foreground">{c.nombre}</p>
                  <p className="text-muted-foreground font-mono mt-0.5">Bs. {c.precio.toFixed(2)} c/u</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    onClick={() => onUpdateCantidad(c.nombre, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-mono font-bold px-1.5 text-sm">{c.cantidad}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    onClick={() => onUpdateCantidad(c.nombre, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive ml-1"
                    onClick={() => onEliminarItem(c.nombre)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Separator className="border-border/60" />

      <CardContent className="pt-4 bg-muted/10 space-y-4">
        {/* DESCUENTO */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Percent className="h-3.5 w-3.5" /> Descuento (%)
          </span>
          <Input
            type="number"
            placeholder="0"
            max="100"
            value={descuento || ""}
            onChange={(e) => setDescuento(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-20 text-right font-mono h-8 rounded-lg bg-background"
          />
        </div>

        {/* MEDIO DE PAGO */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Método de Pago</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMetodoPago("efectivo")}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold gap-1 transition-all ${
                metodoPago === "efectivo"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <Coins className="h-4 w-4" /> Efectivo
            </button>
            <button
              onClick={() => setMetodoPago("tarjeta")}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold gap-1 transition-all ${
                metodoPago === "tarjeta"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <CreditCard className="h-4 w-4" /> Tarjeta
            </button>
            <button
              onClick={() => setMetodoPago("qr")}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold gap-1 transition-all ${
                metodoPago === "qr"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <QrCode className="h-4 w-4" /> Pago QR
            </button>
          </div>
        </div>

        {/* MOSTRAR QR SIMULADO SI SE ELIGE QR */}
        {metodoPago === "qr" && subtotal > 0 && (
          <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border animate-in fade-in duration-300">
            <div className="bg-white p-1 rounded-lg border shrink-0">
              <div className="h-16 w-16 bg-zinc-950 flex items-center justify-center text-white text-[9px] font-bold text-center">
                QR HUELLITAS
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground">Escanea el código QR</p>
              <p className="text-[9px] text-muted-foreground">
                El cliente puede pagar desde cualquier app bancaria de Bolivia (Simple).
              </p>
            </div>
          </div>
        )}

        {/* TOTALES */}
        <div className="space-y-1.5 border-t pt-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">Bs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Descuento Aplicado</span>
            <span className="font-mono">Bs. {(subtotal * (descuento / 100)).toFixed(2)}</span>
          </div>
          <Separator className="my-1 border-dashed" />
          <div className="flex justify-between text-lg font-black text-foreground">
            <span>Total</span>
            <span className="font-mono text-primary">Bs. {total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/20 border-t border-border/40 p-4">
        <Button
          className="w-full h-12 rounded-xl text-sm font-bold shadow-md"
          onClick={onProcesarPago}
          disabled={carrito.length === 0}
        >
          <Receipt className="h-4 w-4 mr-2" /> Cobrar y Generar Factura
        </Button>
      </CardFooter>
    </Card>
  );
}
