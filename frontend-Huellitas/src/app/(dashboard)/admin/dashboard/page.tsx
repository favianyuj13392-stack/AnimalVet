"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon, Clock, Activity, Users, Plus,
  Search, Bell, Download, FileText, CheckCircle2, AlertCircle,
  HeartPulse, Syringe, TrendingUp, TrendingDown, Stethoscope,
  ChevronRight, Loader2, PawPrint, XCircle, Bed,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer,
} from "recharts";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar } from "@/shared/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { Separator } from "@/shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { toast } from "sonner";

import { citasService } from "@/domains/appointments/services/citas.service";
import { reportesService } from "@/domains/admin/services/reportes.service";
import { hospitalizacionesService } from "@/domains/clinical/services/hospitalizaciones.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { usuariosService } from "@/domains/users/services/usuarios.service";
import { vacunasAplicadasService } from "@/domains/clinical/services/vacunas-aplicadas.service";
import { productosService } from "@/domains/inventory/services/productos.service";
import { InventoryAlertsWidget } from "@/domains/inventory/components/inventory-alerts-widget";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_HOSP: Record<string, string> = {
  Observacion: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  Estable:     "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
  Grave:       "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
  Alta:        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
};

const ESTADO_CITA: Record<string, { label: string; cls: string }> = {
  Pendiente_Confirmacion: { label: "Pendiente",  cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400" },
  Confirmada:             { label: "Confirmada", cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
  Pendiente:              { label: "Pendiente",  cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400" },
  En_Curso:               { label: "En curso",   cls: "border-primary/30 bg-primary/10 text-primary" },
  Completada:             { label: "Completada", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
  Cancelada:              { label: "Cancelada",  cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" },
};

const chartConfigIngresos  = { efectivo: { label: "Efectivo (Bs)", color: "hsl(var(--chart-1))" }, qr: { label: "QR/Transferencia (Bs)", color: "hsl(var(--chart-2))" }, tarjeta: { label: "Tarjeta (Bs)", color: "hsl(var(--chart-3))" } };
const chartConfigAtenciones = { cantidad: { label: "Citas", color: "hsl(var(--primary))" } };

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [modalUrgencia, setModalUrgencia] = useState(false);

  // Urgencia form state
  const [urgNombre, setUrgNombre]     = useState("");
  const [urgEspecie, setUrgEspecie]   = useState("");
  const [urgContacto, setUrgContacto] = useState("");
  const [urgTelefono, setUrgTelefono] = useState("");
  const [urgVetId, setUrgVetId]       = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: hospitalizaciones = [], isLoading: loadingHosp } = useQuery({
    queryKey: ["hospitalizaciones-dashboard"],
    queryFn: () => hospitalizacionesService.getAll().catch(() => []),
  });

  const { data: citasHoy = [], isLoading: loadingCitasHoy } = useQuery({
    queryKey: ["citas-hoy-dashboard"],
    queryFn: () => citasService.getAll({ fecha: today }).catch(() => []),
  });

  const { data: mascotas = [], isLoading: loadingMascotas } = useQuery({
    queryKey: ["mascotas-dashboard"],
    queryFn: () => mascotasService.getAll().catch(() => []),
  });

  const { data: personal = [] } = useQuery({
    queryKey: ["personal"],
    queryFn: () => usuariosService.getPersonal().catch(() => []),
  });

  const { data: alertasVacunas = [] } = useQuery({
    queryKey: ["alertas-vacunas-dashboard"],
    queryFn: () => vacunasAplicadasService.getAlertas().catch(() => []),
  });

  const { data: productosStockCritico = [] } = useQuery({
    queryKey: ["productos-stock-critico"],
    queryFn: async () => {
      const todos = await productosService.getAll().catch(() => []);
      return (todos as any[]).filter(p => !p.deletedAt && p.stockActual <= p.stockMinimo);
    },
  });

  const { data: annualReport, isLoading: loadingReport } = useQuery({
    queryKey: ["annual-report", selectedYear],
    queryFn: () => citasService.getReporteAnual(selectedYear),
  });

  const { data: reporteFinanciero } = useQuery({
    queryKey: ["dashboard-financiero"],
    queryFn: () => reportesService.getFinanciero().catch(() => null),
  });

  const { data: reporteCitas } = useQuery({
    queryKey: ["dashboard-citas"],
    queryFn: () => reportesService.getCitas().catch(() => null),
  });

  // ── Derivados ─────────────────────────────────────────────────────────────

  const veterinarios = (personal as any[]).filter(u => Number(u.id_rol_fk) === 2);

  // Hospitalizaciones activas (sin alta)
  const hospActivas = (hospitalizaciones as any[]).filter(h => h.estado_actual !== "Alta");

  // Citas de hoy por estado
  const citasHoyArr = citasHoy as any[];
  const statsCitas = {
    total:      citasHoyArr.length,
    pendientes: citasHoyArr.filter(c => c.estado === "Pendiente_Confirmacion" || c.estado === "Pendiente" || c.estado === "Confirmada").length,
    enCurso:    citasHoyArr.filter(c => c.estado === "En_Curso").length,
    completadas: citasHoyArr.filter(c => c.estado === "Completada").length,
  };

  // Próximas citas del día
  const proximas = citasHoyArr
    .filter(c => c.estado !== "Cancelada" && c.estado !== "No_Asistio" && c.estado !== "Completada")
    .slice(0, 5);

  // Mascotas filtradas
  const mascotasFiltradas = (mascotas as any[])
    .filter(m => !m.deletedAt)
    .filter(m =>
      busquedaPaciente === "" ||
      m.nombre?.toLowerCase().includes(busquedaPaciente.toLowerCase()) ||
      m.dueno?.nombres?.toLowerCase().includes(busquedaPaciente.toLowerCase())
    )
    .slice(0, 8);

  // Alertas totales para la campana
  const totalAlertas = (alertasVacunas as any[]).length + (productosStockCritico as any[]).length;

  // Gráficos
  const ingresosData = reporteFinanciero ? [
    { metodo: "Efectivo",    efectivo: reporteFinanciero.metodos_pago?.efectivo ?? 0, qr: 0, tarjeta: 0 },
    { metodo: "QR/Transfer", efectivo: 0, qr: reporteFinanciero.metodos_pago?.qr_transferencia ?? 0, tarjeta: 0 },
    { metodo: "Tarjeta",     efectivo: 0, qr: 0, tarjeta: reporteFinanciero.metodos_pago?.tarjeta ?? 0 },
  ] : [];

  const atencionesSemana = reporteCitas ? [
    { dia: "Completadas", cantidad: reporteCitas.detalle_estados?.Completada ?? 0 },
    { dia: "Canceladas",  cantidad: reporteCitas.detalle_estados?.Cancelada  ?? 0 },
    { dia: "No Asistio",  cantidad: reporteCitas.detalle_estados?.No_Asistio ?? 0 },
    { dia: "Pendientes",  cantidad: (reporteCitas.detalle_estados?.Pendiente ?? 0) + (reporteCitas.detalle_estados?.Pendiente_Confirmacion ?? 0) },
  ] : [];

  // ── Urgencia mutation ─────────────────────────────────────────────────────

  const { mutateAsync: registrarUrgencia, isPending: registrandoUrgencia } = useMutation({
    mutationFn: (payload: any) => mascotasService.preRegistroUrgencia(payload),
    onSuccess: (res: any) => {
      toast.success("Urgencia registrada", {
        description: `Paciente: ${urgNombre || "Desconocido"} · QR: ${res.hashQr}`,
      });
      queryClient.invalidateQueries({ queryKey: ["citas-hoy-dashboard"] });
      setUrgNombre(""); setUrgEspecie(""); setUrgContacto(""); setUrgTelefono(""); setUrgVetId("");
      setModalUrgencia(false);
    },
  });

  const handleUrgencia = async () => {
    if (!urgEspecie)   { toast.warning("Indica la especie del paciente"); return; }
    if (!urgContacto)  { toast.warning("Indica el nombre del contacto");  return; }
    if (!urgTelefono)  { toast.warning("Indica el teléfono de contacto"); return; }
    if (!urgVetId)     { toast.warning("Selecciona un veterinario");      return; }

    await registrarUrgencia({
      nombre:            urgNombre.trim() || undefined,
      especie_nombre:    urgEspecie,
      contacto_nombre:   urgContacto.trim(),
      contacto_telefono: urgTelefono.trim(),
      id_veterinario:    urgVetId,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-card/50 p-6 rounded-3xl border border-border/50 shadow-sm">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
            Panel de control
          </Badge>
          <h1 className="text-4xl font-black tracking-tight bg-linear-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent pb-1">
            Centro de Comando
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Supervision clinica, agenda, inventario y reportes en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente o dueño..."
              value={busquedaPaciente}
              onChange={e => setBusquedaPaciente(e.target.value)}
              className="pl-10 rounded-xl bg-background"
            />
          </div>

          {/* Bell — alertas reales */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 relative">
                <Bell className="h-4 w-4" />
                {totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
                    {totalAlertas > 9 ? "9+" : totalAlertas}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Centro de alertas</SheetTitle>
                <SheetDescription>Alertas activas del sistema.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {(productosStockCritico as any[]).slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex gap-3 p-3 bg-destructive/5 rounded-xl border border-destructive/15">
                    <Syringe className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock critico: {p.stockActual} / min {p.stockMinimo}
                      </p>
                    </div>
                  </div>
                ))}
                {(alertasVacunas as any[]).slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/15">
                    <HeartPulse className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {a.mascota?.nombre}: {a.vacuna?.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.dias_restantes <= 0
                          ? `Vencida hace ${Math.abs(a.dias_restantes)} dias`
                          : `Refuerzo en ${a.dias_restantes} dias`}
                      </p>
                    </div>
                  </div>
                ))}
                {totalAlertas === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sin alertas activas.
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Urgencia */}
          <Dialog open={modalUrgencia} onOpenChange={setModalUrgencia}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Urgencia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-destructive" /> Ingreso de urgencia
                </DialogTitle>
                <DialogDescription>
                  Pre-registro express. Se crea la cita y se genera el QR del paciente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Nombre de la mascota</Label>
                    <Input
                      placeholder="Desconocido si no se sabe"
                      value={urgNombre}
                      onChange={e => setUrgNombre(e.target.value)}
                      className="rounded-lg h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Especie <span className="text-destructive">*</span></Label>
                    <Select value={urgEspecie} onValueChange={setUrgEspecie}>
                      <SelectTrigger className="rounded-lg h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Perro">Perro</SelectItem>
                        <SelectItem value="Gato">Gato</SelectItem>
                        <SelectItem value="Ave">Ave</SelectItem>
                        <SelectItem value="Exotico">Exotico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Nombre del contacto <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Propietario o acompañante"
                      value={urgContacto}
                      onChange={e => setUrgContacto(e.target.value)}
                      className="rounded-lg h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Telefono <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Ej: 72345678"
                      value={urgTelefono}
                      onChange={e => setUrgTelefono(e.target.value)}
                      className="rounded-lg h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Veterinario <span className="text-destructive">*</span></Label>
                  <Select value={urgVetId} onValueChange={setUrgVetId}>
                    <SelectTrigger className="rounded-lg h-10">
                      <SelectValue placeholder="Seleccionar veterinario" />
                    </SelectTrigger>
                    <SelectContent>
                      {veterinarios.map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.nombres} {v.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setModalUrgencia(false)} className="rounded-lg" disabled={registrandoUrgencia}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleUrgencia}
                  disabled={registrandoUrgencia}
                  className="rounded-lg gap-1.5"
                >
                  {registrandoUrgencia ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</> : "Registrar urgencia"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="uci" className="w-full">
        <TabsList className="h-12 bg-muted/50 p-1 rounded-2xl w-full md:w-auto overflow-x-auto justify-start mb-6">
          <TabsTrigger value="uci"      className="rounded-xl px-5 gap-2"><HeartPulse className="h-4 w-4" /> UCI e Internados</TabsTrigger>
          <TabsTrigger value="clinica"  className="rounded-xl px-5 gap-2"><Stethoscope className="h-4 w-4" /> Directorio Clinico</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-5 gap-2"><Activity className="h-4 w-4" /> Analytics</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: UCI ─────────────────────────────────────────────────────── */}
        <TabsContent value="uci" className="space-y-6">

          {/* Stats reales del dia */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Citas hoy",    value: statsCitas.total,      icon: CalendarIcon, color: "text-primary bg-primary/10" },
              { title: "Pendientes",   value: statsCitas.pendientes,  icon: Clock,        color: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
              { title: "En curso",     value: statsCitas.enCurso,     icon: Activity,     color: "text-blue-600 bg-blue-500/10 dark:text-blue-400" },
              { title: "Completadas",  value: statsCitas.completadas, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
            ].map((s, i) => (
              <Card key={i} className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${s.color} shrink-0`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-black text-foreground">
                      {loadingCitasHoy ? <Loader2 className="h-5 w-5 animate-spin inline text-primary" /> : s.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alertas de inventario */}
          <InventoryAlertsWidget />

          {/* Pacientes internados reales */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bed className="h-5 w-5 text-destructive" />
                Pacientes internados
                {!loadingHosp && hospActivas.length > 0 && (
                  <Badge variant="destructive" className="rounded-full text-xs">
                    {hospActivas.length}
                  </Badge>
                )}
              </h2>
              <Link href="/vet/hospitalizacion">
                <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-muted-foreground hover:text-primary text-xs h-8">
                  Ver pizarra <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {loadingHosp ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Cargando internados...</span>
              </div>
            ) : hospActivas.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <Bed className="h-8 w-8 mx-auto text-muted-foreground/25 mb-2" />
                <p className="text-sm text-muted-foreground">Sin pacientes internados actualmente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {hospActivas.map((h: any) => (
                  <Card key={h.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all group">
                    <div className={`h-1 w-full rounded-t-2xl ${
                      h.estado_actual === "Grave" ? "bg-destructive" :
                      h.estado_actual === "Observacion" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {h.mascota?.nombre?.charAt(0).toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{h.mascota?.nombre ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{h.mascota?.raza?.nombre ?? "Mascota"}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${ESTADO_HOSP[h.estado_actual] ?? "border-border bg-muted text-muted-foreground"}`}>
                          {h.estado_actual}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{h.motivo_ingreso}</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                        <span className="text-muted-foreground">
                          {h.fecha_ingreso ? format(parseISO(h.fecha_ingreso), "d MMM", { locale: es }) : "—"}
                        </span>
                        {h.veterinario && (
                          <span className="text-muted-foreground truncate max-w-[120px]">
                            {h.veterinario.nombres} {h.veterinario.apellidos}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 pt-0">
                      <Link href={`/vet/hospitalizacion/${h.id}`} className="w-full">
                        <Button variant="ghost" size="sm" className="w-full rounded-lg h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Ver detalle <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: DIRECTORIO CLINICO ─────────────────────────────────────── */}
        <TabsContent value="clinica" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Directorio de mascotas real */}
            <Card className="xl:col-span-2 rounded-2xl border-border/50 shadow-md overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Directorio de pacientes</CardTitle>
                    <CardDescription>
                      {loadingMascotas ? "Cargando..." : `${(mascotas as any[]).filter(m => !m.deletedAt).length} pacientes registrados`}
                    </CardDescription>
                  </div>
                  <Link href="/admin/mascotas">
                    <Button variant="outline" size="sm" className="rounded-lg gap-1 text-xs">
                      Ver todos <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingMascotas ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="py-3 px-6 font-semibold">Paciente</TableHead>
                        <TableHead className="font-semibold">Propietario</TableHead>
                        <TableHead className="font-semibold">Especie</TableHead>
                        <TableHead className="text-right px-6 font-semibold">Expediente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mascotasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            No se encontraron pacientes.
                          </TableCell>
                        </TableRow>
                      ) : mascotasFiltradas.map((m: any) => (
                        <TableRow key={m.id} className="hover:bg-muted/30 transition-colors border-b border-border/30 group">
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {m.nombre?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="font-semibold text-sm text-foreground">{m.nombre}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.dueno ? `${m.dueno.nombres} ${m.dueno.apellidos}` : "Sin dueño"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {m.raza?.especie?.nombre ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <Link href={`/vet/expediente/${m.id}`}>
                              <Button variant="ghost" size="sm" className="rounded-lg h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
                                <FileText className="h-3.5 w-3.5" /> Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Citas proximas del dia reales */}
            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" /> Citas de hoy
                </CardTitle>
                <CardDescription>
                  {format(new Date(), "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingCitasHoy ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : proximas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sin citas pendientes para hoy.
                  </p>
                ) : proximas.map((cita: any) => {
                  const cfg = ESTADO_CITA[cita.estado] ?? { label: cita.estado, cls: "border-border bg-muted text-muted-foreground" };
                  return (
                    <div key={cita.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-muted/60 flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-foreground leading-none">
                          {cita.fecha_hora_inicio ? format(parseISO(String(cita.fecha_hora_inicio)), "HH") : "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-none">
                          {cita.fecha_hora_inicio ? format(parseISO(String(cita.fecha_hora_inicio)), "mm") : ""}h
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {cita.mascota?.nombre ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {cita.servicio?.nombre ?? "Consulta"}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.cls}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
              {proximas.length > 0 && (
                <CardFooter className="pt-0 pb-4">
                  <Link href="/admin/citas" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full rounded-lg text-xs gap-1 text-muted-foreground hover:text-primary">
                      Ver agenda completa <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 3: ANALYTICS (datos reales, sin cambios) ─────────────────── */}
        <TabsContent value="analytics" className="space-y-6">

          <div className="flex justify-between items-center bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm">
            <div>
              <h3 className="font-bold text-lg text-foreground">Reportes consolidados</h3>
              <p className="text-xs text-muted-foreground">Estadisticas e informes anuales</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-muted-foreground">Año:</Label>
              <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-28 rounded-xl h-9 bg-background">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader>
                <CardTitle>Salud financiera</CardTitle>
                <CardDescription>
                  Ingresos por metodo de pago — Total:{" "}
                  <strong>Bs. {reporteFinanciero?.resumen?.ventas_totales ?? 0}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ingresosData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Cargando...
                  </div>
                ) : (
                  <ChartContainer config={chartConfigIngresos} className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ingresosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="metodo" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} content={<ChartTooltipContent />} />
                        <Bar dataKey="efectivo" fill="var(--color-efectivo)" radius={[4,4,0,0]} barSize={40} />
                        <Bar dataKey="qr"       fill="var(--color-qr)"       radius={[4,4,0,0]} barSize={40} />
                        <Bar dataKey="tarjeta"  fill="var(--color-tarjeta)"  radius={[4,4,0,0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader>
                <CardTitle>Estado de citas</CardTitle>
                <CardDescription>Distribucion total por estado — datos en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                {atencionesSemana.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Cargando...
                  </div>
                ) : (
                  <ChartContainer config={chartConfigAtenciones} className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={atencionesSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <ChartTooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} content={<ChartTooltipContent />} />
                        <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={[4,4,0,0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" /> Tasa de absentismo
                </CardTitle>
                <CardDescription>Citas perdidas vs programadas en {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-6">
                {loadingReport ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
                  <div className="text-center">
                    <div className="text-5xl font-black text-destructive">
                      {annualReport?.absentismo?.tasaAbsentismoPorcentaje?.toFixed(1) || "0.0"}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {annualReport?.absentismo?.citasNoAsistio || 0} de {annualReport?.absentismo?.totalCitas || 0} citas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Productividad medica
                </CardTitle>
                <CardDescription>Atenciones por veterinario en {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent className="h-48 overflow-y-auto">
                {loadingReport ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : !annualReport?.productividadMedica?.length ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sin datos.</p>
                ) : annualReport.productividadMedica.map((m: any) => (
                  <div key={m.veterinarioId} className="flex justify-between items-center p-2 bg-muted/20 rounded-xl border border-border/40 mb-2">
                    <span className="text-sm font-semibold truncate">{m.nombreCompleto}</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold shrink-0">
                      {m.citasAtendidas}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" /> Motivos de cancelacion
                </CardTitle>
                <CardDescription>Razones declaradas en {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent className="h-48 overflow-y-auto">
                {loadingReport ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : !annualReport?.cancelaciones?.length ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sin cancelaciones.</p>
                ) : annualReport.cancelaciones.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-muted/20 rounded-xl border border-border/40 mb-2">
                    <span className="text-sm font-semibold truncate max-w-[150px]">{c.motivo}</span>
                    <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/5 font-bold shrink-0">
                      {c.cantidad}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
