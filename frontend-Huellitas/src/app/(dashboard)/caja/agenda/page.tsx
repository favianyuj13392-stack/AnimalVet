"use client";

import React, { useState } from "react";
import {
  CalendarDays, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, UserX, RefreshCw,
  PawPrint, UserPlus, Receipt, BanknoteIcon, Phone, Stethoscope,
  CalendarClock, Ban, Wallet, Link2, Eye,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays, isToday, isTomorrow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";

import { citasService } from "@/domains/appointments/services/citas.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { servicesService } from "@/domains/billing/services/services.service";
import { usuariosService } from "@/domains/users/services/usuarios.service";
import { horariosAtencionService } from "@/domains/users/services/horarios-atencion.service";
import { historialClinicoService } from "@/domains/clinical/services/historial-clinico.service";
import { transaccionesService } from "@/domains/billing/services/transacciones.service";
import { Cita } from "@/domains/appointments/appointments.types";
import { Mascota } from "@/domains/pets/pets.types";
import { Usuario } from "@/domains/users/users.types";
import { UrgenciaModal } from "@/domains/pets/components/UrgenciaModal";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { Download } from "lucide-react";
import { NuevoPacienteDialog } from "@/domains/users/components/nuevo-paciente-dialog";
import { ClientePerfilModal } from "@/domains/users/components/cliente-perfil-modal";

// ─── Configuración de estados ─────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  Pendiente:   { label: "Pendiente",   badge: "bg-amber-500 text-white",         icon: Clock },
  Confirmada:  { label: "Confirmada",  badge: "bg-blue-500 text-white",          icon: CheckCircle2 },
  En_Curso:    { label: "En Curso",    badge: "bg-primary text-white",           icon: RefreshCw },
  Completada:  { label: "Completada",  badge: "bg-emerald-500 text-white",       icon: CheckCircle2 },
  Cancelada:   { label: "Cancelada",   badge: "bg-destructive text-white",       icon: XCircle },
  No_Asistio:  { label: "No Asistió",  badge: "bg-muted-foreground text-white",  icon: UserX },
};

const NEXT_ESTADOS: Record<string, string[]> = {
  Pendiente:  ["Confirmada", "Cancelada", "No_Asistio"],
  Confirmada: ["En_Curso", "Cancelada", "No_Asistio"],
  En_Curso:   ["Completada", "Cancelada"],
  Completada: [],
  Cancelada:  [],
  No_Asistio: [],
};

const EMPTY_FORM = {
  clienteId: "", id_mascota_fk: "", id_veterinario_fk: "", id_servicio_fk: "",
  fecha: "", hora: "", motivo_cita: "",
};

export default function CajaAgendaPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab]       = useState("agenda");
  const [fecha, setFecha]               = useState(new Date());
  const [busqueda, setBusqueda]         = useState("");
  const [busquedaTx, setBusquedaTx]     = useState("");
  const [anularModal, setAnularModal]   = useState<any>(null);
  const [estadoModal, setEstadoModal]   = useState<{ cita: Cita; nuevoEstado: string } | null>(null);
  const [motivoCancelacion, setMotivo]  = useState("");
  const [urgenciaOpen, setUrgenciaOpen] = useState(false);
  const [nuevaCitaOpen, setNuevaCitaOpen] = useState(false);
  const [nuevoPacienteOpen, setNuevoPacienteOpen] = useState(false);
  const [citaForm, setCitaForm]         = useState(EMPTY_FORM);

  // ── Urgencias vinculación ────────────────────────────────────────────
  const [vincularModal, setVincularModal] = useState<{ mascotaTemp: any } | null>(null);
  const [busqClienteVinc, setBusqClienteVinc] = useState("");
  const [clienteVincSel, setClienteVincSel]   = useState<any>(null);
  const [mascotaRealSel, setMascotaRealSel]   = useState<any>(null);

  // ── Perfil rápido ────────────────────────────────────────────────────
  const [perfilCliente, setPerfilCliente] = useState<any>(null);
  const [perfilOpen, setPerfilOpen]       = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");

  // Clientes para buscar en el modal
  const { data: todosClientes = [] } = useQuery<Usuario[]>({
    queryKey: ["clientes-modal"],
    queryFn: () => usuariosService.getClientes(),
    enabled: nuevaCitaOpen,
  });

  const clientesFiltrados = busquedaCliente.trim().length >= 2
    ? (todosClientes as any[]).filter((c: any) =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        c.telefono?.includes(busquedaCliente)
      )
    : [];

  // Mascotas del cliente seleccionado
  const { data: mascotasCliente = [] } = useQuery<Mascota[]>({
    queryKey: ["mascotas-cliente-modal", citaForm.clienteId],
    queryFn: () => mascotasService.getMisMascotas(citaForm.clienteId),
    enabled: !!citaForm.clienteId,
  });

  // Días de la semana que trabaja el veterinario seleccionado
  const { data: horariosVet = [] } = useQuery({
    queryKey: ["horarios-vet", citaForm.id_veterinario_fk],
    queryFn: () => horariosAtencionService.getAllActive(citaForm.id_veterinario_fk),
    enabled: !!citaForm.id_veterinario_fk,
  });

  // Días de semana activos del vet (0=Dom...6=Sáb)
  const diasTrabaja = new Set((horariosVet as any[]).filter((h: any) => h.activo).map((h: any) => Number(h.dia_semana)));

  // Fecha mínima = hoy
  const hoyStr = format(new Date(), "yyyy-MM-dd");

  // Horarios disponibles según veterinario + fecha
  const { data: horariosDisponibles = [], isLoading: loadingHorarios } = useQuery({
    queryKey: ["disponibilidad", citaForm.id_veterinario_fk, citaForm.fecha],
    queryFn: () => citasService.getDisponibilidad(citaForm.id_veterinario_fk, citaForm.fecha),
    enabled: !!citaForm.id_veterinario_fk && !!citaForm.fecha,
  });

  const fechaStr = format(fecha, "yyyy-MM-dd");

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: citas = [], isLoading, refetch } = useQuery<Cita[]>({
    queryKey: ["citas-caja", fechaStr],
    queryFn: () => citasService.getAll({ fecha: fechaStr }).catch(() => []),
  });

  const { data: mascotas = [] } = useQuery<Mascota[]>({
    queryKey: ["mascotas"],
    queryFn: () => mascotasService.getAll(),
    enabled: nuevaCitaOpen,
  });

  const { data: personal = [] } = useQuery<Usuario[]>({
    queryKey: ["personal"],
    queryFn: () => usuariosService.getPersonal(),
    enabled: nuevaCitaOpen,
  });

  const { data: servicios = [] } = useQuery({
    queryKey: ["servicios"],
    queryFn: () => servicesService.getAll(),
    enabled: nuevaCitaOpen,
  });

  const veterinarios = personal.filter((u) => Number(u.id_rol_fk) === 2);

  // ─── Queries adicionales ──────────────────────────────────────────────────
  const mananaStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const { data: citasManana = [], isLoading: loadManana } = useQuery<Cita[]>({
    queryKey: ["citas-manana"],
    queryFn: () => citasService.getAll({ fecha: mananaStr }).catch(() => []),
    enabled: activeTab === "manana",
  });

  const { data: pendientesCobro = [], isLoading: loadPendientes, refetch: refetchPendientes } = useQuery<any[]>({
    queryKey: ["pendientes-cobro"],
    queryFn: () => historialClinicoService.getPendientesCobro(),
    enabled: activeTab === "cobro",
  });

  const { data: transacciones = [], isLoading: loadTx, refetch: refetchTx } = useQuery<any[]>({
    queryKey: ["transacciones-hoy"],
    queryFn: () => transaccionesService.getAll({ cajeroId: user?.id }),
    enabled: activeTab === "transacciones",
  });

  const txHoy = (transacciones as any[]).filter((t) => { try { return isToday(parseISO(t.createdAt)); } catch { return false; } });
  const txFiltradas = txHoy.filter((t) =>
    busquedaTx === "" ||
    `${t.cliente?.nombres} ${t.cliente?.apellidos}`.toLowerCase().includes(busquedaTx.toLowerCase()) ||
    t.metodoPago?.toLowerCase().includes(busquedaTx.toLowerCase())
  );

  // Resumen del día
  const resumenDia = {
    ef:    txHoy.filter((t) => t.metodoPago === "Efectivo").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0),
    qr:    txHoy.filter((t) => t.metodoPago === "QR_Transferencia").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0),
    tj:    txHoy.filter((t) => t.metodoPago === "Tarjeta").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0),
    total: txHoy.reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0),
    count: txHoy.length,
  };

  // ─── Query: mascotas temporales de urgencia ───────────────────────────────
  const { data: todasMascotas = [], refetch: refetchUrgencias } = useQuery<any[]>({
    queryKey: ["mascotas-urgencia"],
    queryFn: () => mascotasService.getAll(),
    enabled: activeTab === "urgencias",
    select: (data) => data.filter((m: any) => m.dueno?.email === "urgencias@huellitas.com"),
  });

  // ─── Query: mascotas del cliente a vincular ───────────────────────────────
  const { data: mascotasClienteVinc = [] } = useQuery<any[]>({
    queryKey: ["mascotas-vinc", clienteVincSel?.id],
    queryFn: () => mascotasService.getMisMascotas(clienteVincSel!.id),
    enabled: !!clienteVincSel?.id,
  });

  const clientesVincFiltrados = busqClienteVinc.trim().length >= 2
    ? (todosClientes as any[]).filter((c: any) =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busqClienteVinc.toLowerCase()) ||
        c.telefono?.includes(busqClienteVinc)
      )
    : [];

  // ─── Mutations ────────────────────────────────────────────────────────────
  const anularMut = useMutation({
    mutationFn: (id: string) => transaccionesService.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacciones-hoy"] });
      toast.success("Transacción anulada");
      setAnularModal(null);
    },
  });

  const vincularMut = useMutation({
    mutationFn: ({ idTemp, idReal }: { idTemp: string; idReal: string }) =>
      mascotasService.vincularDuplicado(idTemp, idReal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mascotas-urgencia"] });
      toast.success("Mascota vinculada correctamente al cliente real.");
      setVincularModal(null);
      setBusqClienteVinc("");
      setClienteVincSel(null);
      setMascotaRealSel(null);
    },
    onError: () => toast.error("No se pudo vincular la mascota."),
  });

  // ─── Mutations citas ──────────────────────────────────────────────────────
  const estadoMut = useMutation({
    mutationFn: ({ id, estado, motivo }: { id: string; estado: string; motivo?: string }) =>
      citasService.updateEstado(id, estado, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citas-caja", fechaStr] });
      toast.success("Estado de cita actualizado");
      setEstadoModal(null);
      setMotivo("");
    },
  });

  const crearCitaMut = useMutation({
    mutationFn: () =>
      citasService.create({
        fecha_hora_inicio: `${citaForm.fecha}T${citaForm.hora}:00`,
        motivo_cita: citaForm.motivo_cita.trim(),
        origen_reserva: "RECEPCION",
        id_mascota_fk: citaForm.id_mascota_fk,
        id_veterinario_fk: citaForm.id_veterinario_fk,
        id_servicio_fk: parseInt(citaForm.id_servicio_fk),
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citas-caja", fechaStr] });
      toast.success("Cita agendada correctamente");
      setNuevaCitaOpen(false);
      setCitaForm(EMPTY_FORM);
    },
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const citasFiltradas = citas.filter((c) => {
    if (!c?.id) return false;
    const q       = busqueda.toLowerCase();
    const mascota = c.mascota?.nombre ?? "";
    const vet     = c.veterinario ? `${c.veterinario.nombres} ${c.veterinario.apellidos}` : "";
    const dueno   = c.mascota?.dueno ? `${c.mascota.dueno.nombres} ${c.mascota.dueno.apellidos}` : "";
    return (
      mascota.toLowerCase().includes(q) ||
      vet.toLowerCase().includes(q) ||
      dueno.toLowerCase().includes(q)
    );
  });

  const citasValidas = citas.filter((c) => c?.id);
  const stats = {
    total:       citasValidas.length,
    pendientes:  citasValidas.filter((c) => c.estado === "Pendiente" || c.estado === "Confirmada").length,
    enCurso:     citasValidas.filter((c) => c.estado === "En_Curso").length,
    completadas: citasValidas.filter((c) => c.estado === "Completada").length,
    ausentes:    citasValidas.filter((c) => c.estado === "No_Asistio" || c.estado === "Cancelada").length,
  };

  const handleCambiarEstado = (cita: Cita, nuevoEstado: string) => {
    if (nuevoEstado === "Cancelada" || nuevoEstado === "No_Asistio") {
      setEstadoModal({ cita, nuevoEstado });
    } else {
      estadoMut.mutate({ id: cita.id, estado: nuevoEstado });
    }
  };

  const confirmarCambio = () => {
    if (!estadoModal?.cita?.id) return;
    estadoMut.mutate({ id: estadoModal.cita.id, estado: estadoModal.nuevoEstado, motivo: motivoCancelacion || undefined });
  };

  const handleCrearCita = () => {
    if (!citaForm.id_mascota_fk)    return toast.error("Selecciona una mascota");
    if (!citaForm.id_veterinario_fk) return toast.error("Selecciona un veterinario");
    if (!citaForm.id_servicio_fk)   return toast.error("Selecciona un servicio");
    if (!citaForm.fecha)            return toast.error("Selecciona una fecha");
    if (!citaForm.hora)             return toast.error("Selecciona una hora");
    if (!citaForm.motivo_cita.trim()) return toast.error("Escribe el motivo");
    crearCitaMut.mutate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Recepción</Badge>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Agenda del Día
            </h1>
            <p className="text-muted-foreground mt-1">Gestiona citas, confirmaciones e inasistencias.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="rounded-2xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setNuevoPacienteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Nuevo Paciente
            </Button>
            <Button variant="outline" className="rounded-2xl gap-2" onClick={() => setNuevaCitaOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva Cita
            </Button>
            <Button className="rounded-2xl gap-2 shadow-md shadow-destructive/20 bg-destructive hover:bg-destructive/90"
              onClick={() => setUrgenciaOpen(true)}>
              <AlertTriangle className="h-4 w-4" /> Urgencia
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total",       value: stats.total,       color: "bg-primary/10 text-primary" },
          { label: "Por atender", value: stats.pendientes,  color: "bg-amber-500/10 text-amber-600" },
          { label: "En consulta", value: stats.enCurso,     color: "bg-blue-500/10 text-blue-500" },
          { label: "Completadas", value: stats.completadas, color: "bg-emerald-500/10 text-emerald-600" },
          { label: "Ausentes",    value: stats.ausentes,    color: "bg-muted-foreground/20 text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black rounded-xl py-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── NAVEGACIÓN DE FECHA ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-2xl p-1">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => setFecha((d) => subDays(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button onClick={() => setFecha(new Date())}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-muted/50 transition-colors min-w-[175px] text-center capitalize">
            {isToday(fecha) ? "Hoy — " : ""}
            {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
          </button>
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => setFecha((d) => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar mascota o veterinario..." value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)} className="pl-9 bg-background rounded-xl" />
        </div>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ── TABLA DE CITAS ── */}
      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Cargando citas...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-4 px-6 font-semibold">Hora</TableHead>
                  <TableHead className="font-semibold">Mascota</TableHead>
                  <TableHead className="font-semibold">Veterinario</TableHead>
                  <TableHead className="font-semibold">Servicio</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="text-right px-6 font-semibold">Cambiar Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Sin citas para este día.</p>
                    </TableCell>
                  </TableRow>
                ) : citasFiltradas.map((cita) => {
                  const estado: string = cita.estado ?? "";
                  const cfg  = ESTADO_CONFIG[estado] ?? { label: estado, badge: "bg-muted", icon: Clock };
                  const next = NEXT_ESTADOS[estado] ?? [];
                  const hora = format(parseISO(String(cita.fecha_hora_inicio)), "HH:mm");
                  return (
                    <TableRow key={cita.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                      <TableCell className="py-4 px-6 font-mono font-bold text-lg">{hora}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <PawPrint className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{cita.mascota?.nombre ?? "—"}</p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-muted-foreground">
                                {cita.mascota?.dueno
                                  ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}`
                                  : "Sin dueño"}
                              </p>
                              {cita.mascota?.dueno && (
                                <button
                                  onClick={() => { setPerfilCliente(cita.mascota!.dueno); setPerfilOpen(true); }}
                                  className="text-primary hover:text-primary/70 transition-colors ml-0.5">
                                  <Eye className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-sm">
                          {cita.veterinario
                            ? `${cita.veterinario.nombres} ${cita.veterinario.apellidos}`
                            : "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cita.servicio?.nombre ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.badge} gap-1`}>
                          <cfg.icon className="h-3 w-3" /> {cfg.label}
                        </Badge>
                        {cita.estado === "Completada" && cita.updatedAt ? (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Atendida {format(parseISO(String(cita.updatedAt)), "d MMM HH:mm", { locale: es })}
                          </p>
                        ) : cita.estado === "Cancelada" && cita.updatedAt ? (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Cancelada {format(parseISO(String(cita.updatedAt)), "d MMM HH:mm", { locale: es })}
                          </p>
                        ) : cita.createdAt ? (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Agendada {format(parseISO(String(cita.createdAt)), "d MMM", { locale: es })}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        {next.length > 0 ? (
                          <Select onValueChange={(v) => handleCambiarEstado(cita, v)}>
                            <SelectTrigger className="w-40 h-8 rounded-xl text-xs bg-background">
                              <SelectValue placeholder="Cambiar a..." />
                            </SelectTrigger>
                            <SelectContent>
                              {next.map((e) => (
                                <SelectItem key={e} value={e}>{ESTADO_CONFIG[e]?.label ?? e}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">Finalizado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL: NUEVA CITA ── */}
      <Dialog open={nuevaCitaOpen} onOpenChange={(v) => { setNuevaCitaOpen(v); if (!v) { setCitaForm(EMPTY_FORM); setBusquedaCliente(""); } }}>
        <DialogContent className="rounded-3xl sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">

          {/* Header fijo */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Agendar Nueva Cita
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Completa los pasos en orden para registrar la cita.</p>
          </div>

          {/* Contenido con scroll */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

            {/* ── SECCIÓN 1: PACIENTE ── */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-black">1</span>
                Paciente
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Buscar cliente */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Buscar cliente *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="rounded-xl h-10 pl-9"
                      placeholder="Nombre o teléfono (mín. 2 caracteres)..."
                      value={busquedaCliente}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setCitaForm({ ...citaForm, clienteId: "", id_mascota_fk: "" });
                      }}
                    />
                  </div>
                  {busquedaCliente.trim().length >= 2 && clientesFiltrados.length > 0 && !citaForm.clienteId && (
                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      {clientesFiltrados.slice(0, 5).map((c: any) => (
                        <button key={c.id} type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 text-sm"
                          onClick={() => { if (!c?.id) return; setCitaForm({ ...citaForm, clienteId: c.id.toString(), id_mascota_fk: "" }); setBusquedaCliente(`${c.nombres} ${c.apellidos}`); }}>
                          <span className="font-medium">{c.nombres} {c.apellidos}</span>
                          {c.telefono && <span className="text-xs text-muted-foreground ml-2">· {c.telefono}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {busquedaCliente.trim().length >= 2 && clientesFiltrados.length === 0 && !citaForm.clienteId && (
                    <p className="text-xs text-muted-foreground px-1">No se encontró ningún cliente.</p>
                  )}
                </div>

                {/* Mascota */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Mascota *</Label>
                  {!citaForm.clienteId ? (
                    <div className="rounded-xl h-10 border border-dashed border-border bg-muted/20 flex items-center px-3 text-xs text-muted-foreground">
                      Selecciona un cliente primero
                    </div>
                  ) : (
                    <Select value={citaForm.id_mascota_fk} onValueChange={(v) => setCitaForm({ ...citaForm, id_mascota_fk: v })}>
                      <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Seleccionar mascota" /></SelectTrigger>
                      <SelectContent>
                        {(mascotasCliente as any[]).length === 0
                          ? <SelectItem value="_none" disabled>Este cliente no tiene mascotas</SelectItem>
                          : (mascotasCliente as any[]).filter((m: any) => !!m?.id).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* ── SECCIÓN 2: CONSULTA ── */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-black">2</span>
                Consulta
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Veterinario *</Label>
                  <Select value={citaForm.id_veterinario_fk} onValueChange={(v) => setCitaForm({ ...citaForm, id_veterinario_fk: v, hora: "", fecha: "" })}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {veterinarios.filter((v) => !!v?.id).map((v) => (
                        <SelectItem key={v.id} value={v.id.toString()}>Dr(a). {v.nombres} {v.apellidos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Servicio *</Label>
                  <Select value={citaForm.id_servicio_fk} onValueChange={(v) => setCitaForm({ ...citaForm, id_servicio_fk: v })}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {(servicios as any[]).filter((s) => !!s?.id).map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Motivo *</Label>
                  <Textarea className="rounded-xl resize-none" rows={2} placeholder="Describe el motivo de la consulta..."
                    value={citaForm.motivo_cita} onChange={(e) => setCitaForm({ ...citaForm, motivo_cita: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* ── SECCIÓN 3: FECHA Y HORA ── */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-black">3</span>
                Fecha y hora
              </p>

              {!citaForm.id_veterinario_fk ? (
                <div className="rounded-xl p-4 border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground">
                  Selecciona un veterinario para ver su disponibilidad
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Fecha */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Fecha *</Label>
                    <Input className="rounded-xl h-10" type="date" min={hoyStr} value={citaForm.fecha}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) { setCitaForm({ ...citaForm, fecha: "", hora: "" }); return; }
                        const dia = new Date(val + "T12:00:00").getDay();
                        if (diasTrabaja.size > 0 && !diasTrabaja.has(dia)) {
                          toast.error("El veterinario no atiende ese día");
                          return;
                        }
                        setCitaForm({ ...citaForm, fecha: val, hora: "" });
                      }}
                    />
                    {diasTrabaja.size > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((dia, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                            diasTrabaja.has(i)
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-muted/40 text-muted-foreground/30 line-through"
                          }`}>{dia}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Horarios */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Hora *</Label>
                    {!citaForm.fecha ? (
                      <div className="rounded-xl h-10 border border-dashed border-border bg-muted/20 flex items-center px-3 text-xs text-muted-foreground">
                        Selecciona una fecha primero
                      </div>
                    ) : loadingHorarios ? (
                      <div className="rounded-xl h-10 border border-border bg-muted/20 flex items-center gap-2 px-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando...
                      </div>
                    ) : horariosDisponibles.length === 0 ? (
                      <div className="rounded-xl h-10 border border-border bg-muted/20 flex items-center px-3 text-xs text-muted-foreground">
                        Sin horarios para este día
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl p-2.5 bg-muted/10 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(horariosDisponibles as any[]).map((h: any) => {
                            const ocupado = h.ocupado;
                            const sel = citaForm.hora === h.hora;
                            return (
                              <button key={h.hora} type="button" disabled={ocupado}
                                onClick={() => !ocupado && setCitaForm({ ...citaForm, hora: h.hora })}
                                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                                  sel ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : ocupado ? "bg-destructive/10 text-destructive/40 border-destructive/20 line-through cursor-not-allowed"
                                    : "bg-background text-foreground border-border hover:border-primary hover:text-primary"
                                }`}>
                                {h.hora}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-3 pt-1 border-t border-border/40">
                          {[["bg-background border-border","Libre"],["bg-destructive/10 border-destructive/20","Ocupado"],["bg-primary","Seleccionado"]].map(([cls, lbl]) => (
                            <span key={lbl} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className={`w-2 h-2 rounded-sm border inline-block ${cls}`} />{lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer fijo */}
          <div className="px-6 py-4 border-t border-border/50 shrink-0 flex justify-end gap-2 bg-muted/10">
            <Button variant="outline" className="rounded-xl" onClick={() => setNuevaCitaOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl px-6" onClick={handleCrearCita} disabled={crearCitaMut.isPending}>
              {crearCitaMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Agendar Cita
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* ── MODAL: CANCELAR / NO ASISTIÓ ── */}
      <Dialog open={!!estadoModal} onOpenChange={() => { setEstadoModal(null); setMotivo(""); }}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {estadoModal?.nuevoEstado === "Cancelada" ? "Cancelar Cita" : "Registrar Inasistencia"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mascota: <span className="font-semibold text-foreground">{estadoModal?.cita?.mascota?.nombre ?? "—"}</span>
            </p>
            <div className="space-y-2">
              <Label>Motivo {estadoModal?.nuevoEstado === "Cancelada" ? "(requerido)" : "(opcional)"}</Label>
              <Textarea placeholder="Describe el motivo..." value={motivoCancelacion}
                onChange={(e) => setMotivo(e.target.value)} className="rounded-xl" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setEstadoModal(null); setMotivo(""); }}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmarCambio}
              disabled={(estadoModal?.nuevoEstado === "Cancelada" && !motivoCancelacion) || estadoMut.isPending}>
              {estadoMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── TABS ADICIONALES ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 rounded-2xl bg-muted/50 p-1 border border-border/40 h-11">
          <TabsTrigger value="agenda" className="rounded-xl text-xs font-semibold gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Agenda
          </TabsTrigger>
          <TabsTrigger value="cobro" className="rounded-xl text-xs font-semibold gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Cobros
            {(pendientesCobro as any[]).length > 0 && (
              <span className="ml-1 bg-destructive text-white text-[9px] rounded-full px-1.5 py-0.5 font-black">
                {(pendientesCobro as any[]).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="urgencias" className="rounded-xl text-xs font-semibold gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Urgencias
            {todasMascotas.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-black">
                {todasMascotas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="manana" className="rounded-xl text-xs font-semibold gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Mañana
          </TabsTrigger>
          <TabsTrigger value="transacciones" className="rounded-xl text-xs font-semibold gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Caja
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: AGENDA (ya existe arriba, ocultamos el contenido duplicado) ── */}
        <TabsContent value="agenda" className="mt-4 outline-none">
          {/* contenido ya renderizado arriba */}
        </TabsContent>

        {/* ── TAB: PENDIENTES DE COBRO ── */}
        <TabsContent value="cobro" className="mt-4 outline-none">
          <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Consultas listas para cobrar
              </CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => refetchPendientes()}>
                <RefreshCw className="h-3.5 w-3.5" /> Actualizar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadPendientes ? (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (pendientesCobro as any[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Sin consultas pendientes de cobro</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="py-3 px-6">Mascota / Dueño</TableHead>
                      <TableHead>Veterinario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right px-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pendientesCobro as any[]).filter((h) => h?.id).map((h) => (
                      <TableRow key={h.id} className="hover:bg-muted/30 border-b border-border/30">
                        <TableCell className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <PawPrint className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{h.mascota?.nombre ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">
                                {h.dueno ? `${h.dueno.nombres} ${h.dueno.apellidos}` : "—"}
                                {h.dueno?.telefono && <span className="ml-1">· {h.dueno.telefono}</span>}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {h.veterinario ? `Dr. ${h.veterinario.nombres} ${h.veterinario.apellidos}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{h.tipo_atencion ?? "Consulta"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {h.fecha_consulta ? format(parseISO(h.fecha_consulta), "dd MMM HH:mm", { locale: es }) : "—"}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button size="sm" className="rounded-xl h-8 text-xs gap-1.5"
                            onClick={() => window.location.href = `/caja/pos`}>
                            <BanknoteIcon className="h-3.5 w-3.5" /> Cobrar en POS
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

        {/* ── TAB: URGENCIAS / PACIENTES TEMPORALES ── */}
        <TabsContent value="urgencias" className="mt-4 outline-none">
          <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Pacientes Temporales de Urgencia
              </CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => refetchUrgencias()}>
                <RefreshCw className="h-3.5 w-3.5" /> Actualizar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {todasMascotas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Sin pacientes temporales pendientes de vincular</p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-200/50">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Estas mascotas fueron registradas en una urgencia sin dueño. Vincúlalas a un cliente real para completar su expediente.
                    </p>
                  </div>
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="py-3 px-6">Mascota temporal</TableHead>
                        <TableHead>Especie / Raza</TableHead>
                        <TableHead>Registrada</TableHead>
                        <TableHead className="text-right px-6">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todasMascotas.map((m: any) => (
                        <TableRow key={m.id} className="hover:bg-muted/30 border-b border-border/30">
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <PawPrint className="h-4 w-4 text-amber-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{m.nombre}</p>
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 mt-0.5">Temporal</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.especie?.nombre ?? "—"}{m.raza ? ` · ${m.raza.nombre}` : ""}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.createdAt ? format(parseISO(m.createdAt), "dd MMM · HH:mm", { locale: es }) : "—"}
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <Button size="sm" className="rounded-xl h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => {
                                setVincularModal({ mascotaTemp: m });
                                setBusqClienteVinc("");
                                setClienteVincSel(null);
                                setMascotaRealSel(null);
                              }}>
                              <Link2 className="h-3.5 w-3.5" /> Vincular cliente
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: CITAS DE MAÑANA ── */}
        <TabsContent value="manana" className="mt-4 outline-none">
          <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Citas del {format(addDays(new Date(), 1), "EEEE d 'de' MMMM", { locale: es })}
                <Badge variant="outline" className="ml-auto text-xs">{(citasManana as any[]).length} citas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadManana ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (citasManana as any[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Sin citas programadas para mañana</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {(citasManana as any[])
                    .sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime())
                    .filter((cita) => !!cita?.id)
                    .map((cita) => {
                      const cfg = ESTADO_CONFIG[cita.estado] ?? { label: cita.estado, badge: "bg-muted", icon: Clock };
                      return (
                        <div key={cita.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                          <div className="text-center shrink-0 w-12">
                            <p className="text-lg font-black text-primary leading-none">
                              {format(parseISO(String(cita.fecha_hora_inicio)), "HH:mm")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <PawPrint className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{cita.mascota?.nombre ?? "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {cita.mascota?.dueno ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}` : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground shrink-0 hidden md:block">
                            {cita.veterinario ? `Dr. ${cita.veterinario.nombres}` : "—"}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`${cfg.badge} text-[10px]`}>{cfg.label}</Badge>
                            {cita.mascota?.dueno?.telefono && (
                              <a href={`tel:${cita.mascota.dueno.telefono}`}>
                                <Button variant="outline" size="sm" className="rounded-xl h-7 w-7 p-0">
                                  <Phone className="h-3 w-3" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: TRANSACCIONES DEL DÍA ── */}
        <TabsContent value="transacciones" className="mt-4 outline-none space-y-4">

          {/* Resumen del día */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Transacciones", value: resumenDia.count, suffix: "", color: "text-primary bg-primary/10" },
              { label: "Efectivo",      value: resumenDia.ef,    suffix: "Bs", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
              { label: "QR",            value: resumenDia.qr,    suffix: "Bs", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
              { label: "Total del día", value: resumenDia.total, suffix: "Bs", color: "text-primary bg-primary/10" },
            ].map((s) => (
              <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-black rounded-xl py-1 ${s.color}`}>
                    {s.suffix} {typeof s.value === "number" && s.suffix ? s.value.toFixed(2) : s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por cliente o método de pago..."
                  value={busquedaTx} onChange={(e) => setBusquedaTx(e.target.value)}
                  className="pl-9 rounded-xl h-9" />
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => refetchTx()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadTx ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : txFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Receipt className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Sin transacciones hoy</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="py-3 px-6">Cliente</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right px-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txFiltradas.filter((tx) => tx?.id).map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/30 border-b border-border/30">
                        <TableCell className="py-3 px-6 font-semibold text-sm">
                          {tx.cliente ? `${tx.cliente.nombres} ${tx.cliente.apellidos}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {tx.metodoPago === "Efectivo" && <BanknoteIcon className="h-3 w-3" />}
                            {tx.metodoPago}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-primary">Bs {Number(tx.totalCobrado).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tx.createdAt ? format(parseISO(tx.createdAt), "HH:mm") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={tx.estadoTransaccion === "Anulada"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          } variant="outline">
                            {tx.estadoTransaccion}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="outline" size="sm"
                              className="rounded-xl h-8 text-xs gap-1.5"
                              onClick={() => transaccionesService.descargarComprobante(tx.id)}>
                              <Download className="h-3 w-3" /> Comprobante
                            </Button>
                            {tx.estadoTransaccion !== "Anulada" && (
                              <Button variant="outline" size="sm"
                                className="rounded-xl h-8 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                                onClick={() => setAnularModal(tx)}>
                                <Ban className="h-3 w-3" /> Anular
                              </Button>
                            )}
                          </div>
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

      {/* ── MODAL: ANULAR TRANSACCIÓN ── */}
      <Dialog open={!!anularModal} onOpenChange={() => setAnularModal(null)}>
        {anularModal && (
          <DialogContent className="rounded-3xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" /> Anular Transacción
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">¿Seguro que deseas anular esta transacción?</p>
              <div className="rounded-xl border border-border/50 p-3 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Cliente:</span> <span className="font-semibold">{anularModal.cliente ? `${anularModal.cliente.nombres} ${anularModal.cliente.apellidos}` : "—"}</span></p>
                <p><span className="text-muted-foreground">Total:</span> <span className="font-semibold text-primary">Bs {Number(anularModal.totalCobrado ?? 0).toFixed(2)}</span></p>
                <p><span className="text-muted-foreground">Método:</span> <span className="font-semibold">{anularModal.metodoPago}</span></p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setAnularModal(null)}>Cancelar</Button>
              <Button variant="destructive" className="rounded-xl" onClick={() => anularMut.mutate(anularModal.id)} disabled={anularMut.isPending}>
                {anularMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar Anulación
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── MODAL: VINCULAR MASCOTA TEMPORAL ── */}
      <Dialog open={!!vincularModal} onOpenChange={(v) => { if (!v) setVincularModal(null); }}>
        {vincularModal && (
          <DialogContent className="rounded-3xl sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
            <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Link2 className="h-5 w-5 text-amber-500" />
                Vincular "{vincularModal.mascotaTemp.nombre}" a cliente real
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Busca el cliente dueño y selecciona la mascota real a la que pertenece, o crea una mascota nueva en su perfil.
              </p>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {/* Paso 1: buscar cliente */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">1. Buscar cliente (mín. 2 caracteres)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 rounded-xl h-10"
                    placeholder="Nombre o teléfono..."
                    value={busqClienteVinc}
                    onChange={(e) => { setBusqClienteVinc(e.target.value); setClienteVincSel(null); setMascotaRealSel(null); }}
                  />
                </div>
                {busqClienteVinc.trim().length >= 2 && !clienteVincSel && clientesVincFiltrados.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    {clientesVincFiltrados.slice(0, 5).map((c: any) => (
                      <button key={c.id} type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 text-sm"
                        onClick={() => { setClienteVincSel(c); setBusqClienteVinc(`${c.nombres} ${c.apellidos}`); }}>
                        <span className="font-medium">{c.nombres} {c.apellidos}</span>
                        {c.telefono && <span className="text-xs text-muted-foreground ml-2">· {c.telefono}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {clienteVincSel && (
                  <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-4 py-2 border border-primary/20">
                    <span className="text-sm font-semibold flex-1">{clienteVincSel.nombres} {clienteVincSel.apellidos}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg"
                      onClick={() => { setClienteVincSel(null); setBusqClienteVinc(""); setMascotaRealSel(null); }}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Paso 2: seleccionar mascota real */}
              {clienteVincSel && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">2. Seleccionar mascota real</Label>
                  {(mascotasClienteVinc as any[]).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Este cliente no tiene mascotas registradas. Puedes vincular el historial creando una desde su perfil.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(mascotasClienteVinc as any[]).map((m: any) => (
                        <button key={m.id} type="button"
                          onClick={() => setMascotaRealSel(m)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                            mascotaRealSel?.id === m.id
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:border-primary/40 bg-background"
                          }`}>
                          <PawPrint className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold text-sm">{m.nombre}</p>
                            <p className="text-xs text-muted-foreground">{m.especie?.nombre ?? ""}{m.raza ? ` · ${m.raza.nombre}` : ""}</p>
                          </div>
                          {mascotaRealSel?.id === m.id && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border/50 shrink-0 flex justify-end gap-2 bg-muted/10">
              <Button variant="outline" className="rounded-xl" onClick={() => setVincularModal(null)}>Cancelar</Button>
              <Button className="rounded-xl px-6 bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!mascotaRealSel || vincularMut.isPending}
                onClick={() => vincularMut.mutate({ idTemp: vincularModal.mascotaTemp.id, idReal: mascotaRealSel.id })}>
                {vincularMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar Vinculación
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── MODAL: PERFIL RÁPIDO DEL CLIENTE ── */}
      <ClientePerfilModal
        cliente={perfilCliente}
        open={perfilOpen}
        onOpenChange={setPerfilOpen}
      />

      {/* ── MODALS EXTERNOS ── */}
      <UrgenciaModal open={urgenciaOpen} onOpenChange={setUrgenciaOpen} />
      <NuevoPacienteDialog open={nuevoPacienteOpen} onOpenChange={setNuevoPacienteOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["mascotas"] })} />
    </div>
  );
}
