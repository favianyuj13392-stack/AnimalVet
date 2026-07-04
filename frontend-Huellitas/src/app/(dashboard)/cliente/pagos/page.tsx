"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Receipt, Download, Loader2, Search,
  BanknoteIcon, QrCode, CreditCard, HeartPulse,
  Stethoscope, ShoppingBag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { transaccionesService } from "@/domains/billing/services/transacciones.service";

export default function MisPagosPage() {
  const { user } = useAuthStore();

  const hoy = new Date();
  const [fechaInicio, setFechaInicio] = useState(
    format(subMonths(hoy, 3), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState(format(hoy, "yyyy-MM-dd"));
  const [busqueda, setBusqueda] = useState("");

  const { data: transacciones = [], isLoading } = useQuery({
    queryKey: ["mis-pagos-cliente", user?.id],
    queryFn: () =>
      transaccionesService.getAll({ clienteId: user?.id, estado: "Completada" }),
    enabled: !!user?.id,
  });

  const txFiltradas = (transacciones as any[]).filter((t) => {
    if (!t?.id) return false;
    // Rango de fechas
    const fechaTx = t.fechaTransaccion ?? t.createdAt;
    if (fechaTx) {
      const d = new Date(fechaTx);
      const ini = new Date(`${fechaInicio}T00:00:00`);
      const fin = new Date(`${fechaFin}T23:59:59`);
      if (d < ini || d > fin) return false;
    }
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      t.metodoPago?.toLowerCase().includes(q) ||
      String(t.totalCobrado).includes(q)
    );
  });

  const totalPagado = txFiltradas.reduce(
    (acc: number, t: any) => acc + Number(t.totalCobrado ?? 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8">

      {/* HEADER */}
      <div>
        <Link href="/cliente/inicio">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-3 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inicio
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis pagos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Historial de pagos y comprobantes
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="rounded-xl border-border/50 shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Desde</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg h-9 w-40 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Hasta</Label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-lg h-9 w-40 text-sm"
            />
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 rounded-lg h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI RESUMEN */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-xl border-border/50 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-primary">
              Bs {totalPagado.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total pagado en el periodo</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-foreground">{txFiltradas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Transacciones completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* TABLA */}
      <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="px-5 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Detalle de pagos</p>
            <Badge variant="outline" className="text-xs">{txFiltradas.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Cargando pagos...</span>
            </div>
          ) : txFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Receipt className="h-8 w-8 opacity-20" />
              <p className="text-sm">Sin pagos en este periodo</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-3 px-5">Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right px-5">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txFiltradas.map((tx: any) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/30 border-b border-border/30"
                  >
                    <TableCell className="py-3 px-5 text-sm font-mono text-muted-foreground">
                      {tx.createdAt
                        ? format(parseISO(tx.createdAt), "dd MMM yyyy · HH:mm", { locale: es })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {tx.id_hospitalizacion_fk ? (
                        <Badge className="gap-1 text-xs bg-violet-500/10 text-violet-600 border-violet-200 hover:bg-violet-500/10">
                          <HeartPulse className="h-3 w-3" /> Hospitalización
                        </Badge>
                      ) : tx.id_historial_fk ? (
                        <Badge className="gap-1 text-xs bg-sky-500/10 text-sky-600 border-sky-200 hover:bg-sky-500/10">
                          <Stethoscope className="h-3 w-3" /> Consulta
                        </Badge>
                      ) : (
                        <Badge className="gap-1 text-xs bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/10">
                          <ShoppingBag className="h-3 w-3" /> Venta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs">
                        {tx.metodoPago === "Efectivo" && <BanknoteIcon className="h-3 w-3" />}
                        {tx.metodoPago === "QR_Transferencia" && <QrCode className="h-3 w-3" />}
                        {tx.metodoPago === "Tarjeta" && <CreditCard className="h-3 w-3" />}
                        {tx.metodoPago}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      Bs {Number(tx.totalCobrado).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right px-5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 text-xs gap-1.5"
                        onClick={() => transaccionesService.descargarComprobante(tx.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
