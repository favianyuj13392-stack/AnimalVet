"use client";

import {
  PawPrint, CalendarPlus, History, ChevronRight,
  Loader2, Clock, CheckCircle2, XCircle, Plus,
  CalendarDays, Stethoscope, Syringe, AlertTriangle, Ban, Receipt,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { citasService } from "@/domains/appointments/services/citas.service";
import { vacunasAplicadasService } from "@/domains/clinical/services/vacunas-aplicadas.service";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

const ESTADO: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  Pendiente_Confirmacion: {
    label: "Pendiente",
    cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
    icon: Clock,
  },
  Confirmada: {
    label: "Confirmada",
    cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
    icon: CheckCircle2,
  },
  En_Curso: {
    label: "En Curso",
    cls: "border-primary/30 bg-primary/10 text-primary",
    icon: Clock,
  },
  Completada: {
    label: "Completada",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Cancelada: {
    label: "Cancelada",
    cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
    icon: XCircle,
  },
  No_Asistio: {
    label: "No asistio",
    cls: "border-border bg-muted text-muted-foreground",
    icon: XCircle,
  },
};

export default function ClienteInicioPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();

  const { data: mascotas = [], isLoading: loadMascotas } = useQuery({
    queryKey: ["mis-mascotas", user?.id],
    queryFn: () => mascotasService.getMisMascotas(user!.id).catch(() => []),
    enabled: !!user?.id,
  });

  const { data: citas = [], isLoading: loadCitas } = useQuery({
    queryKey: ["mis-citas-cliente", user?.id],
    queryFn: () => citasService.getAll({ clienteId: user!.id }).catch(() => []),
    enabled: !!user?.id,
  });

  const cancelarMut = useMutation({
    mutationFn: (id: string) =>
      citasService.updateEstado(id, "Cancelada", "Cancelada por el cliente"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-citas-cliente"] });
    },
  });

  const { data: alertasVacunas = [] } = useQuery({
    queryKey: ["alertas-vacunas-cliente"],
    queryFn: () => vacunasAplicadasService.getAlertas().catch(() => []),
  });

  const ahora = new Date();

  // Próxima cita: pendientes/confirmadas ordenadas ASC → la más cercana primero
  const proximaCita = (citas as any[])
    .filter((c: any) =>
      (c.estado === "Pendiente_Confirmacion" || c.estado === "Confirmada" || c.estado === "Pendiente") &&
      new Date(c.fecha_hora_inicio) >= ahora
    )
    .sort((a: any, b: any) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime())[0] ?? null;

  // Todas las citas ordenadas DESC (más recientes primero)
  const todasLasCitas = (citas as any[])
    .sort((a: any, b: any) => new Date(b.fecha_hora_inicio).getTime() - new Date(a.fecha_hora_inicio).getTime());

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos dias" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  if (loadMascotas || loadCitas) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-muted-foreground animate-in fade-in">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">

      {/* ── GREETING ──────────────────────────────────────────────────────────── */}
      <div className="pt-1">
        <p className="text-sm text-muted-foreground">
          {saludo},{" "}
          <span className="text-foreground font-medium">{user?.nombres ?? "bienvenido"}</span>
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })
            .replace(/^\w/, (c) => c.toUpperCase())}
        </h1>
      </div>

      {/* ── ALERTAS DE VACUNAS ───────────────────────────────────────────────── */}
      {(alertasVacunas as any[]).length > 0 && (
        <div className="space-y-2">
          {(alertasVacunas as any[]).slice(0, 3).map((alerta: any) => {
            const vencida = alerta.dias_restantes !== null && alerta.dias_restantes < 0;
            const proxima = alerta.dias_restantes !== null && alerta.dias_restantes <= 7;
            return (
              <Link key={alerta.id} href={`/cliente/mascotas/${alerta.mascota?.id}`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                  vencida
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
                }`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    vencida ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                  }`}>
                    {vencida
                      ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      : <Syringe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      vencida ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      {alerta.mascota?.nombre}: {alerta.vacuna?.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vencida
                        ? `Vencida hace ${Math.abs(alerta.dias_restantes)} dia${Math.abs(alerta.dias_restantes) !== 1 ? 's' : ''}`
                        : alerta.dias_restantes === 0
                        ? 'Refuerzo hoy'
                        : `Refuerzo en ${alerta.dias_restantes} dia${alerta.dias_restantes !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── GRID PRINCIPAL ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── COLUMNA IZQUIERDA (3/5) ─────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* PRÓXIMA CITA — elemento protagonista */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Proxima cita</h2>
              <Link href="/cliente/agendar">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg gap-1 text-muted-foreground hover:text-primary">
                  <CalendarPlus className="h-3.5 w-3.5" /> Agendar
                </Button>
              </Link>
            </div>

            {proximaCita ? (
              <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                {/* Barra de color superior */}
                <div className="h-1.5 w-full bg-linear-to-r from-primary to-primary/40" />
                <div className="p-5 flex gap-5 items-start">
                  {/* Fecha destacada */}
                  <div className="shrink-0 text-center bg-primary/5 border border-primary/15 rounded-xl p-3 min-w-[60px]">
                    <p className="text-2xl font-black text-primary leading-none">
                      {format(parseISO(String(proximaCita.fecha_hora_inicio)), "dd")}
                    </p>
                    <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mt-1">
                      {format(parseISO(String(proximaCita.fecha_hora_inicio)), "MMM", { locale: es })}
                    </p>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-foreground leading-tight">
                        {proximaCita.servicio?.nombre ?? "Consulta"}
                      </p>
                      {(() => {
                        const cfg = ESTADO[proximaCita.estado] ?? { label: proximaCita.estado, cls: "border-border bg-muted text-muted-foreground", icon: Clock };
                        return (
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.cls}`}>
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <PawPrint className="h-3 w-3" />
                        {proximaCita.mascota?.nombre ?? "—"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(String(proximaCita.fecha_hora_inicio)), "HH:mm")}h
                      </span>
                      {proximaCita.veterinario && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Stethoscope className="h-3 w-3" />
                          {proximaCita.veterinario.nombres} {proximaCita.veterinario.apellidos}
                        </span>
                      )}
                    </div>
                    {proximaCita.motivo_cita && (
                      <p className="text-xs text-muted-foreground mt-2.5 italic line-clamp-1">
                        "{proximaCita.motivo_cita}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-foreground">Sin citas programadas</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Agenda una consulta para cualquiera de tus mascotas
                </p>
                <Link href="/cliente/agendar">
                  <Button size="sm" className="rounded-lg gap-1.5 h-8 text-xs">
                    <CalendarPlus className="h-3.5 w-3.5" /> Agendar cita
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* TODAS LAS CITAS */}
          {todasLasCitas.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Mis citas
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({todasLasCitas.length} en total)
                  </span>
                </h2>
                <Link href="/cliente/historial">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg gap-1 text-muted-foreground hover:text-primary">
                    Ver historial <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="rounded-xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
                {todasLasCitas.map((cita: any) => {
                  const cfg = ESTADO[cita.estado] ?? { label: cita.estado, cls: "border-border bg-muted text-muted-foreground", icon: Clock };
                  const Icon = cfg.icon;
                  const cancelable = (cita.estado === "Pendiente_Confirmacion" || cita.estado === "Pendiente" || cita.estado === "Confirmada") && new Date(cita.fecha_hora_inicio) > ahora;
                  const fechaProg = format(parseISO(String(cita.fecha_hora_inicio)), "d MMM yyyy · HH:mm", { locale: es });
                  const fechaInfo = cita.estado === "Completada" && cita.updatedAt
                    ? `Atendida el ${format(new Date(cita.updatedAt), "d MMM yyyy · HH:mm", { locale: es })}`
                    : cita.estado === "Cancelada" && cita.updatedAt
                    ? `Cancelada el ${format(new Date(cita.updatedAt), "d MMM yyyy · HH:mm", { locale: es })}`
                    : null;
                  return (
                    <div key={cita.id} className="px-4 py-3.5 flex items-start gap-3">
                      {/* Ícono de estado */}
                      <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${cfg.cls}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {cita.servicio?.nombre ?? "Consulta"}
                          </p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.cls}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <PawPrint className="inline h-3 w-3 mr-1 -mt-0.5" />{cita.mascota?.nombre ?? "—"}
                          {cita.veterinario && (
                            <> · <Stethoscope className="inline h-3 w-3 mr-1 -mt-0.5" />{cita.veterinario.nombres} {cita.veterinario.apellidos}</>
                          )}
                        </p>
                        {/* Fechas */}
                        <div className="flex flex-col gap-0.5 mt-1.5">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            <span className="font-medium">Programada:</span> {fechaProg}
                          </p>
                          {fechaInfo && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                              {fechaInfo}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botón cancelar */}
                      {cancelable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-0.5"
                          disabled={cancelarMut.isPending}
                          onClick={() => openConfirm({
                            title: "Cancelar cita",
                            description: `¿Seguro que deseas cancelar tu cita de ${cita.servicio?.nombre ?? "consulta"} del ${fechaProg}?`,
                            variant: "warning",
                            confirmLabel: "Sí, cancelar",
                            onConfirm: () => cancelarMut.mutate(cita.id),
                          })}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" /> Cancelar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA (2/5) ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* MIS MASCOTAS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Mis mascotas</h2>
              <Link href="/cliente/mascotas">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-lg gap-1 text-muted-foreground hover:text-primary">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {(mascotas as any[]).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                <PawPrint className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs font-medium text-foreground">Sin mascotas</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                  Registra tu primera mascota
                </p>
                <Link href="/cliente/mascotas/registro">
                  <Button size="sm" className="rounded-lg h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Registrar
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                {(mascotas as any[]).slice(0, 4).map((m: any, i: number) => (
                  <div key={m.id}>
                    <Link href={`/cliente/mascotas/${m.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          {m.foto_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.foto_url} alt={m.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary">
                              {m.nombre.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{m.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.raza?.especie?.nombre ?? "Mascota"}
                            {m.raza?.nombre ? ` · ${m.raza.nombre}` : ""}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </Link>
                    {i < Math.min((mascotas as any[]).length, 4) - 1 && <Separator />}
                  </div>
                ))}
                {(mascotas as any[]).length > 4 && (
                  <>
                    <Separator />
                    <Link href="/cliente/mascotas">
                      <div className="px-4 py-2.5 text-center">
                        <p className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          +{(mascotas as any[]).length - 4} mascotas mas
                        </p>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ACCIONES */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Acciones</h2>
            <div className="space-y-2">
              <Link href="/cliente/agendar" className="block">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Agendar cita</p>
                    <p className="text-[11px] text-muted-foreground">Reserva un turno veterinario</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>

              <Link href="/cliente/historial" className="block">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card shadow-sm hover:border-emerald-400/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Historial medico</p>
                    <p className="text-[11px] text-muted-foreground">Consultas, vacunas y recetas</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>
              </Link>

              <Link href="/cliente/mascotas" className="block">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card shadow-sm hover:border-violet-400/40 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <PawPrint className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Mis mascotas</p>
                    <p className="text-[11px] text-muted-foreground">Perfiles, QR y expedientes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-violet-500 transition-colors shrink-0" />
                </div>
              </Link>

              <Link href="/cliente/pagos" className="block">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card shadow-sm hover:border-amber-400/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Mis pagos</p>
                    <p className="text-[11px] text-muted-foreground">Comprobantes y facturas</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-amber-500 transition-colors shrink-0" />
                </div>
              </Link>

              <Link href="/cliente/servicios" className="block">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card shadow-sm hover:border-blue-400/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Nuestros servicios</p>
                    <p className="text-[11px] text-muted-foreground">Consultas, vacunacion, estetica y mas</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}
