"use client";

import {
  AlertTriangle, Calendar, TrendingDown,
  ShieldCheck, ChevronRight, Loader2,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productosService } from "@/domains/inventory/services/productos.service";
import { lotesService } from "@/domains/billing/services/lotes.service";
import api from "@/shared/lib/axios";

export function InventoryAlertsWidget() {
  const { data: configData = [] } = useQuery({
    queryKey: ["configuracion-clinica"],
    queryFn: async () => {
      const { data } = await api.get("/configuracion-clinica");
      return data as { clave: string; valor: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const diasAlerta = (() => {
    const entry = configData.find((c) => c.clave === "stock_alerta_dias");
    return entry ? parseInt(entry.valor) || 60 : 60;
  })();

  const { data: productos = [], isLoading: loadingProductos } = useQuery({
    queryKey: ["productos-inventario"],
    queryFn: () => productosService.getAll().catch(() => []),
  });

  const { data: lotesAlerta = [], isLoading: loadingLotes } = useQuery({
    queryKey: ["lotes-alertas-widget", diasAlerta],
    queryFn: () => lotesService.getAlertas(diasAlerta).catch(() => []),
    enabled: diasAlerta > 0,
  });

  const isLoading = loadingProductos || loadingLotes;

  // Stock critico: productos activos con stockActual <= stockMinimo
  const stockCritico = (productos as any[]).filter(
    (p) => !p.deletedAt && p.stockActual <= p.stockMinimo
  );

  // Lotes por vencer: ya vienen filtrados del endpoint /alertas/por-vencer (60 dias)
  const lotesPorVencer = (lotesAlerta as any[]).map((l) => {
    const dias = Math.floor(
      (new Date(l.fechaVencimiento).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return { ...l, diasRestantes: dias };
  });

  const totalAlertas = stockCritico.length + lotesPorVencer.length;

  return (
    <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
      <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas de suministros
            </CardTitle>
            <CardDescription>
              Productos e insumos que requieren atencion inmediata.
            </CardDescription>
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : totalAlertas > 0 ? (
            <Badge variant="destructive" className="animate-pulse py-1 px-2.5 rounded-full font-bold">
              {totalAlertas} {totalAlertas === 1 ? "alerta" : "alertas"}
            </Badge>
          ) : (
            <Badge className="bg-emerald-500 text-white flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Todo al dia
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm">Cargando alertas...</p>
          </div>
        ) : totalAlertas === 0 ? (
          <div className="py-8 text-center text-muted-foreground space-y-2">
            <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-foreground">Sin problemas de abastecimiento</p>
            <p className="text-xs">Todos los productos y lotes estan en niveles optimos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* STOCK CRITICO */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                Stock critico ({stockCritico.length})
              </h4>
              {stockCritico.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin productos con bajo stock.</p>
              ) : (
                <div className="space-y-2.5">
                  {stockCritico.slice(0, 5).map((p: any) => {
                    const ratio = Math.min(100, (p.stockActual / p.stockMinimo) * 100);
                    return (
                      <div key={p.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase font-bold text-destructive tracking-wide">
                              {p.categoria?.nombre ?? "Sin categoria"}
                            </p>
                            <p className="text-xs font-semibold text-foreground truncate">{p.nombre}</p>
                          </div>
                          <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 text-[10px] shrink-0">
                            {p.stockActual} / min {p.stockMinimo}
                          </Badge>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-destructive rounded-full transition-all"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {stockCritico.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{stockCritico.length - 5} mas
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* LOTES POR VENCER */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                Vencen en {diasAlerta}d ({lotesPorVencer.length})
              </h4>
              {lotesPorVencer.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin lotes proximos a vencer.</p>
              ) : (
                <div className="space-y-2.5">
                  {lotesPorVencer.slice(0, 5).map((l: any) => (
                    <div key={l.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide truncate">
                            {l.numeroLote ?? "—"}
                          </p>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {l.producto?.nombre ?? "Producto"}
                          </p>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${
                          l.diasRestantes <= 0
                            ? "bg-destructive text-white"
                            : l.diasRestantes <= 30
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}>
                          {l.diasRestantes <= 0
                            ? "Vencido"
                            : `${l.diasRestantes}d`}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 shrink-0" />
                        Vence: {l.fechaVencimiento}
                      </p>
                    </div>
                  ))}
                  {lotesPorVencer.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{lotesPorVencer.length - 5} mas
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Link href="/admin/inventario">
            <Button variant="ghost" size="sm" className="rounded-lg text-xs text-primary hover:bg-primary/10 gap-1">
              Gestionar inventario <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
