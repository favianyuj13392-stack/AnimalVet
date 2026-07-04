"use client";

import { useState } from "react";
import { Package, Search, Loader2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { productosService } from "@/domains/inventory/services/productos.service";

export default function CajaInventarioPage() {
  const [busqueda, setBusqueda] = useState("");

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["inventario-cajero"],
    queryFn: () => productosService.getAll(),
  });

  const activos = (productos as any[]).filter((p) => !p.deletedAt);
  const filtrados = activos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stockBajo = activos.filter((p) => Number(p.stockActual) <= Number(p.stockMinimo ?? 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Inventario</Badge>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
            Inventario
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Consulta de stock y precios — solo lectura</p>
        </div>
      </div>

      {/* ALERTA STOCK BAJO */}
      {stockBajo.length > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-bold">{stockBajo.length} producto{stockBajo.length !== 1 ? "s" : ""}</span> con stock bajo o agotado.
              Notifica al administrador o encargado de inventario.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Productos activos",  value: activos.length,       color: "text-primary bg-primary/10" },
          { label: "Stock bajo",         value: stockBajo.length,     color: "text-amber-600 bg-amber-500/10" },
          { label: "Agotados",           value: activos.filter((p) => Number(p.stockActual) === 0).length, color: "text-destructive bg-destructive/10" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black rounded-xl py-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABLA */}
      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar producto o categoría..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 rounded-xl h-9" />
            </div>
            <Badge variant="outline" className="ml-auto text-xs">{filtrados.length} resultados</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Package className="h-10 w-10 opacity-20" />
              <p className="text-sm">Sin resultados</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-3 px-6">Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock actual</TableHead>
                  <TableHead className="text-right px-6">Precio venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p: any) => {
                  const stockActual = Number(p.stockActual ?? 0);
                  const stockMin    = Number(p.stockMinimo ?? 0);
                  const agotado     = stockActual === 0;
                  const bajo        = !agotado && stockActual <= stockMin;
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/30 border-b border-border/30">
                      <TableCell className="py-3 px-6">
                        <p className="font-semibold text-sm">{p.nombre}</p>
                        {p.descripcion && <p className="text-xs text-muted-foreground truncate max-w-xs">{p.descripcion}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{p.categoria?.nombre ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold text-sm ${agotado ? "text-destructive" : bajo ? "text-amber-600" : "text-foreground"}`}>
                          {stockActual}
                        </span>
                        {(agotado || bajo) && (
                          <AlertTriangle className={`h-3 w-3 inline ml-1 ${agotado ? "text-destructive" : "text-amber-500"}`} />
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6 font-bold text-primary">
                        Bs {Number(p.precioVenta ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
