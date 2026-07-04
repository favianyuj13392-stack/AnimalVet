"use client";

import React from "react";
import { DollarSign, AlertTriangle, Calendar, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface StockAlertsProps {
  productos: any[];
  kardex: any[];
}

export function StockAlerts({ productos, kardex }: StockAlertsProps) {
  // Métricas calculadas
  const valorTotalInventario = productos.reduce((acc, curr) => acc + (curr.stock * curr.precioVenta), 0);
  const itemsCriticos = productos.filter((p) => p.stock <= p.stockMinimo).length;

  const fechaSimulada = "2026-05-22";
  const movimientosHoy = kardex.filter(k => k.fecha.includes(fechaSimulada)).length;

  const proximoVencer = productos.filter((p) => {
    const dias = (new Date(p.vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return dias > 0 && dias <= 30; // Vence en menos de 30 días
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card className="rounded-3xl border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor del Almacén</CardTitle>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{valorTotalInventario.toFixed(2)} Bs</div>
          <p className="text-xs text-muted-foreground mt-1">Calculado en base a precio de venta</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Stock</CardTitle>
          <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{itemsCriticos} Artículos</div>
          <p className="text-xs text-destructive font-medium mt-1">Nivel igual o menor al mínimo de seguridad</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Próximos a Vencer</CardTitle>
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <Calendar className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{proximoVencer} Fármacos</div>
          <p className="text-xs text-orange-500 font-medium mt-1">Caducidad programada en los próximos 30 días</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Movimientos de Hoy</CardTitle>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
            <History className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{movimientosHoy} Ajustes</div>
          <p className="text-xs text-muted-foreground mt-1">Entradas y salidas registradas en Kardex</p>
        </CardContent>
      </Card>
    </div>
  );
}
