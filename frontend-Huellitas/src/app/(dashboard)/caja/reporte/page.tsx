"use client";

import { useState } from "react";
import {
  TrendingUp, Banknote, CreditCard, QrCode, RefreshCw,
  Loader2, Receipt, Search, Download, BanknoteIcon, HeartPulse, Stethoscope, ShoppingBag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { reportesService } from "@/domains/admin/services/reportes.service";
import { transaccionesService } from "@/domains/billing/services/transacciones.service";

export default function CajaReportePage() {
  const { user } = useAuthStore();

  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin]       = useState(format(new Date(), "yyyy-MM-dd"));
  const [busquedaTx, setBusquedaTx]   = useState("");

  const { data: reporte, isLoading: loadReporte, refetch } = useQuery({
    queryKey: ["reporte-cajero", user?.id, fechaInicio, fechaFin],
    queryFn: () => reportesService.getFinancieroPorCajero(user!.id, { fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
    enabled: !!user?.id,
  });

  const { data: transacciones = [], isLoading: loadTx } = useQuery({
    queryKey: ["mis-transacciones", user?.id],
    queryFn: () => transaccionesService.getAll({ cajeroId: user?.id }),
    enabled: !!user?.id,
  });

  const resumen    = reporte?.resumen;
  const cierres: any[] = reporte?.cierres_de_turno ?? [];

  const txFiltradas = (transacciones as any[]).filter((t) => {
    if (!t?.id) return false;
    // Filtro por rango de fechas
    const fechaTx = t.fechaTransaccion ?? t.createdAt;
    if (fechaTx) {
      const d = new Date(fechaTx);
      const ini = new Date(`${fechaInicio}T00:00:00`);
      const fin = new Date(`${fechaFin}T23:59:59`);
      if (d < ini || d > fin) return false;
    }
    const q = busquedaTx.toLowerCase();
    if (!q) return true;
    const cliente = t.cliente ? `${t.cliente.nombres} ${t.cliente.apellidos}` : "";
    return (
      cliente.toLowerCase().includes(q) ||
      t.metodoPago?.toLowerCase().includes(q) ||
      t.estadoTransaccion?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Caja</Badge>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
            Mi Reporte
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user?.nombres} {user?.apellidos}
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="rounded-3xl border-border/50 shadow-sm">
        <CardContent className="p-5 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Desde</Label>
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-xl h-10 w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Hasta</Label>
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-xl h-10 w-44" />
          </div>
          <Button variant="outline" className="rounded-xl gap-2 h-10" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
        </CardContent>
      </Card>

      {loadReporte ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : resumen ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total recaudado",  value: `Bs ${Number(resumen.total_general).toFixed(2)}`,      color: "text-primary bg-primary/10",                             icon: TrendingUp },
              { label: "Efectivo",         value: `Bs ${Number(resumen.efectivo).toFixed(2)}`,            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",  icon: Banknote },
              { label: "QR / Transf.",     value: `Bs ${Number(resumen.qr_transferencia).toFixed(2)}`,   color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",           icon: QrCode },
              { label: "Tarjeta",          value: `Bs ${Number(resumen.tarjeta).toFixed(2)}`,            color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30",     icon: CreditCard },
            ].map((s) => (
              <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${s.color}`}>
                    <p className="font-black text-base">{s.value}</p>
                    <s.icon className="h-5 w-5 opacity-70" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 px-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-primary">{resumen.total_transacciones}</p>
                <p className="text-xs text-muted-foreground mt-1">Transacciones completadas</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-destructive">-Bs {Number(resumen.total_descuentos).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Descuentos aplicados</p>
              </CardContent>
            </Card>
          </div>

          {/* TABS: Transacciones / Cierres */}
          <Tabs defaultValue="transacciones">
            <TabsList className="rounded-2xl bg-muted/50 p-1 border border-border/40 h-11">
              <TabsTrigger value="transacciones" className="rounded-xl text-xs font-semibold gap-1.5">
                <BanknoteIcon className="h-3.5 w-3.5" /> Mis Transacciones
              </TabsTrigger>
              <TabsTrigger value="cierres" className="rounded-xl text-xs font-semibold gap-1.5">
                <Receipt className="h-3.5 w-3.5" /> Cierres de Turno
              </TabsTrigger>
            </TabsList>

            {/* TAB: TRANSACCIONES INDIVIDUALES */}
            <TabsContent value="transacciones" className="mt-4">
              <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por cliente o método..."
                        value={busquedaTx} onChange={(e) => setBusquedaTx(e.target.value)}
                        className="pl-9 rounded-xl h-9" />
                    </div>
                    <Badge variant="outline" className="ml-auto text-xs">{txFiltradas.length} registros</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadTx ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : txFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Sin transacciones en este período</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="py-3 px-6">Fecha y hora</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Descuento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right px-6">Comprobante</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txFiltradas.map((tx: any) => (
                          <TableRow key={tx.id} className="hover:bg-muted/30 border-b border-border/30">
                            <TableCell className="py-3 px-6 text-sm font-mono">
                              {tx.createdAt
                                ? format(parseISO(tx.createdAt), "dd MMM · HH:mm", { locale: es })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm font-semibold">
                              {tx.cliente ? `${tx.cliente.nombres} ${tx.cliente.apellidos}` : "—"}
                            </TableCell>
                            <TableCell>
                              {tx.id_hospitalizacion_fk
                                ? <Badge className="gap-1 text-xs bg-violet-500/10 text-violet-600 border-violet-200 hover:bg-violet-500/10"><HeartPulse className="h-3 w-3" />Hospitalización</Badge>
                                : tx.id_historial_fk
                                  ? <Badge className="gap-1 text-xs bg-sky-500/10 text-sky-600 border-sky-200 hover:bg-sky-500/10"><Stethoscope className="h-3 w-3" />Consulta</Badge>
                                  : <Badge className="gap-1 text-xs bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/10"><ShoppingBag className="h-3 w-3" />Venta directa</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1 text-xs">
                                {tx.metodoPago === "Efectivo" && <BanknoteIcon className="h-3 w-3" />}
                                {tx.metodoPago === "QR_Transferencia" && <QrCode className="h-3 w-3" />}
                                {tx.metodoPago === "Tarjeta" && <CreditCard className="h-3 w-3" />}
                                {tx.metodoPago}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {Number(tx.descuento) > 0
                                ? <span className="text-destructive font-semibold">-Bs {Number(tx.descuento).toFixed(2)}</span>
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline"
                                className={tx.estadoTransaccion === "Anulada"
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-200"}>
                                {tx.estadoTransaccion}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              Bs {Number(tx.totalCobrado).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right px-6">
                              <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs gap-1.5"
                                onClick={() => transaccionesService.descargarComprobante(tx.id)}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: CIERRES DE TURNO */}
            <TabsContent value="cierres" className="mt-4">
              <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-border/40">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Cierres de turno
                    <Badge variant="outline" className="ml-auto text-xs">{cierres.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {cierres.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Sin cierres en este período</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="py-3 px-6">Fecha</TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Transacciones</TableHead>
                          <TableHead>Efectivo</TableHead>
                          <TableHead>QR</TableHead>
                          <TableHead>Tarjeta</TableHead>
                          <TableHead className="text-right px-6">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cierres.map((c: any) => (
                          <TableRow key={c.id} className="hover:bg-muted/30 border-b border-border/30">
                            <TableCell className="py-3 px-6 font-semibold text-sm">
                              {c.fecha_turno
                                ? new Date(c.fecha_turno + "T12:00:00").toLocaleDateString("es")
                                : "—"}
                            </TableCell>
                            <TableCell><Badge variant="outline">{c.turno}</Badge></TableCell>
                            <TableCell className="text-sm">{c.total_transacciones}</TableCell>
                            <TableCell className="text-sm">Bs {Number(c.total_efectivo).toFixed(2)}</TableCell>
                            <TableCell className="text-sm">Bs {Number(c.total_qr).toFixed(2)}</TableCell>
                            <TableCell className="text-sm">Bs {Number(c.total_tarjeta).toFixed(2)}</TableCell>
                            <TableCell className="text-right px-6 font-bold text-primary">
                              Bs {Number(c.total_general).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
