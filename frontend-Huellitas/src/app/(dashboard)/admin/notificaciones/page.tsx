"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, XCircle, Clock, Loader2, Search, Eye, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { notificacionesService, Notificacion } from "@/domains/admin/services/notificaciones.service";

const ESTADO_MAP: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  enviado:  { label: "Enviado",  class: "bg-emerald-500 text-white", icon: CheckCircle2 },
  error:    { label: "Error",    class: "bg-destructive text-white", icon: XCircle },
  fallido:  { label: "Fallido",  class: "bg-destructive text-white", icon: XCircle },
  pendiente:{ label: "Pendiente",class: "bg-amber-500 text-white",   icon: Clock },
};

export default function NotificacionesPage() {
  const [busqueda, setBusqueda]       = useState("");
  const [filtroEstado, setFiltro]     = useState("todos");
  const [selected, setSelected]       = useState<Notificacion | null>(null);
  const [reenviando, setReenviando]   = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery<Notificacion[]>({
    queryKey: ["notificaciones", filtroEstado],
    queryFn: () => notificacionesService.getAll(filtroEstado === "todos" ? undefined : filtroEstado).catch(() => []),
  });

  // Excluir notificaciones de QR — esas se ven en la pantalla de Escaneos QR
  const TIPOS_QR = ["QR_ESCANEADO", "MASCOTA_ENCONTRADA"];
  const sinQr = notifs.filter((n) => !TIPOS_QR.includes(n.tipoNotificacion));

  const filtradas = sinQr.filter((n) =>
    n.cuerpoMensaje?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.tipoNotificacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.usuario?.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.mascota?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalEnviadas   = sinQr.filter((n) => n.estadoEnvio?.toLowerCase() === "enviado").length;
  const totalError      = sinQr.filter((n) => ["error", "fallido"].includes(n.estadoEnvio?.toLowerCase())).length;
  const totalPendientes = sinQr.filter((n) => n.estadoEnvio?.toLowerCase() === "pendiente").length;

  const handleReenviar = async (id: string) => {
    setReenviando(id);
    try {
      await notificacionesService.reenviar(id);
      toast.success("Notificación reenviada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      setSelected(null);
    } catch {
      toast.error("Error al reenviar la notificación.");
    } finally {
      setReenviando(null);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground animate-in fade-in">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-semibold">Cargando notificaciones...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Comunicaciones</Badge>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">Centro de Notificaciones</h1>
        <p className="text-muted-foreground mt-1">Log de recordatorios enviados a clientes vía WhatsApp y correo.</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle2, label: "Enviadas",   value: totalEnviadas,   color: "bg-emerald-500/10 text-emerald-600" },
          { icon: XCircle,      label: "Con Error",  value: totalError,      color: "bg-red-500/10 text-red-500" },
          { icon: Clock,        label: "Pendientes", value: totalPendientes, color: "bg-amber-500/10 text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABLA */}
      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Registro de Notificaciones</CardTitle>
              <CardDescription>Historial completo de comunicaciones automatizadas</CardDescription>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9 bg-background rounded-xl" />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltro}>
                <SelectTrigger className="w-40 bg-background rounded-xl">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="py-4 px-6 font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Canal</TableHead>
                <TableHead className="font-semibold">Mensaje</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="text-right px-6 font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Sin notificaciones.</TableCell></TableRow>
              ) : filtradas.map((n) => {
                const estadoKey = n.estadoEnvio?.toLowerCase() ?? "";
                const estadoInfo = ESTADO_MAP[estadoKey] ?? { label: n.estadoEnvio, class: "bg-muted", icon: Bell };
                const puedeReenviar = ["error", "fallido", "pendiente"].includes(estadoKey);
                const destinatario = n.usuario
                  ? `${n.usuario.nombres} ${n.usuario.apellidos}`
                  : n.mascota?.nombre ?? "—";
                return (
                  <TableRow key={n.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                    <TableCell className="py-4 px-6 font-mono text-xs text-muted-foreground">
                      {format(new Date(n.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell><Badge variant="outline">{n.tipoNotificacion}</Badge></TableCell>
                    <TableCell className="text-sm">{destinatario}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm">{n.cuerpoMensaje}</TableCell>
                    <TableCell>
                      <Badge className={estadoInfo.class}>
                        <estadoInfo.icon className="h-3 w-3 mr-1" />{estadoInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        {puedeReenviar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReenviar(n.id)}
                            disabled={reenviando === n.id}
                            className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600"
                            title="Reenviar"
                          >
                            {reenviando === n.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <RefreshCw className="h-4 w-4" />
                            }
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setSelected(n)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader><DialogTitle>Detalle de Notificación</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Tipo</span>
                <Badge variant="outline">{selected.tipoNotificacion}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Estado</span>
                <Badge className={ESTADO_MAP[selected.estadoEnvio?.toLowerCase()]?.class ?? "bg-muted"}>{selected.estadoEnvio}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Canal</span>
                <span className="font-semibold text-sm">{selected.canalEnvio ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Destinatario</span>
                <span className="font-semibold text-sm">
                  {selected.usuario ? `${selected.usuario.nombres} ${selected.usuario.apellidos}` : selected.mascota?.nombre ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Fecha</span>
                <span className="font-mono text-sm">{format(new Date(selected.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4 text-sm whitespace-pre-wrap">{selected.cuerpoMensaje}</div>
              {["error", "fallido", "pendiente"].includes(selected.estadoEnvio?.toLowerCase()) && (
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  onClick={() => handleReenviar(selected.id)}
                  disabled={reenviando === selected.id}
                >
                  {reenviando === selected.id
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Reenviando...</>
                    : <><RefreshCw className="h-4 w-4 mr-2" />Reenviar notificación</>
                  }
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
