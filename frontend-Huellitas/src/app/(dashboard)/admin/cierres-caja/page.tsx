"use client";

import React, { useState } from "react";
import { DollarSign, Loader2, Search, Eye, Receipt, CreditCard, Banknote, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";
import { cierresCajaService, CierreCaja } from "@/domains/billing/services/cierres-caja.service";

function StatCard({ icon: Icon, label, value, color = "primary" }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    green:   "bg-emerald-500/10 text-emerald-600",
    blue:    "bg-blue-500/10 text-blue-500",
    purple:  "bg-purple-500/10 text-purple-500",
  };
  return (
    <Card className="rounded-3xl border-border/50 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${map[color]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CierresCajaPage() {
  const [busqueda, setBusqueda]         = useState("");
  const [selected, setSelected]        = useState<CierreCaja | null>(null);

  const { data: cierres = [], isLoading } = useQuery<CierreCaja[]>({
    queryKey: ["cierres-caja"],
    queryFn: () => cierresCajaService.getAll().catch(() => []),
  });

  const filtrados = cierres.filter((c) =>
    c.cajero ? `${c.cajero.nombres} ${c.cajero.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) : true
  );

  const totalGeneral = cierres.reduce((s, c) => s + Number(c.total_general ?? 0), 0);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground animate-in fade-in">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-semibold">Cargando cierres de caja...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Auditoría Financiera</Badge>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">Cierres de Caja</h1>
        <p className="text-muted-foreground mt-1">Historial inmutable de arqueos por cajero y turno.</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Receipt}    label="Total Cierres"     value={String(cierres.length)}                  color="primary" />
        <StatCard icon={DollarSign} label="Recaudación Total" value={`${totalGeneral.toFixed(2)} Bs`}         color="green"   />
        <StatCard icon={Banknote}   label="Turnos Mañana"     value={String(cierres.filter(c => c.turno === "Mañana").length)}  color="blue"   />
        <StatCard icon={CreditCard} label="Turnos Tarde/Noche" value={String(cierres.filter(c => c.turno !== "Mañana").length)} color="purple" />
      </div>

      {/* TABLA */}
      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Historial de Cierres</CardTitle>
              <CardDescription>Registros inmutables — no se pueden modificar una vez generados</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cajero..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9 bg-background rounded-xl" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="py-4 px-6 font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Cajero</TableHead>
                <TableHead className="font-semibold">Turno</TableHead>
                <TableHead className="font-semibold text-right">Efectivo</TableHead>
                <TableHead className="font-semibold text-right">QR</TableHead>
                <TableHead className="font-semibold text-right">Tarjeta</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold text-center">Transac.</TableHead>
                <TableHead className="text-right px-6 font-semibold">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Sin cierres registrados.</TableCell></TableRow>
              ) : filtrados.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="py-4 px-6 font-mono text-sm">{format(new Date(c.fecha_turno + "T12:00:00"), "dd MMM yyyy", { locale: es })}</TableCell>
                  <TableCell className="font-semibold">{c.cajero ? `${c.cajero.nombres} ${c.cajero.apellidos}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{c.turno}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{Number(c.total_efectivo ?? 0).toFixed(2)} Bs</TableCell>
                  <TableCell className="text-right font-mono">{Number(c.total_qr ?? 0).toFixed(2)} Bs</TableCell>
                  <TableCell className="text-right font-mono">{Number(c.total_tarjeta ?? 0).toFixed(2)} Bs</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">{Number(c.total_general ?? 0).toFixed(2)} Bs</TableCell>
                  <TableCell className="text-center font-mono">{c.total_transacciones}</TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="icon" onClick={() => setSelected(c)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DETALLE */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Cierre</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Cajero</span>
                <span className="font-semibold">{selected.cajero ? `${selected.cajero.nombres} ${selected.cajero.apellidos}` : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Fecha</span>
                <span className="font-mono text-sm">{format(new Date(selected.fecha_turno + "T12:00:00"), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Turno</span>
                <Badge variant="outline">{selected.turno}</Badge>
              </div>
              <Separator />
              {[
                { icon: Banknote,   label: "Efectivo",           value: selected.total_efectivo },
                { icon: QrCode,     label: "QR / Transferencia", value: selected.total_qr },
                { icon: CreditCard, label: "Tarjeta",            value: selected.total_tarjeta },
                { icon: DollarSign, label: "Descuentos",         value: selected.total_descuentos },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <row.icon className="h-4 w-4" />{row.label}
                  </div>
                  <span className="font-mono font-bold">{Number(row.value ?? 0).toFixed(2)} Bs</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">Total General</span>
                <span className="font-black text-2xl text-primary">{Number(selected.total_general ?? 0).toFixed(2)} Bs</span>
              </div>
              <div className="text-center text-xs text-muted-foreground">{selected.total_transacciones} transacciones procesadas</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
