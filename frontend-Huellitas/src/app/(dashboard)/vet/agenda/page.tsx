"use client";

import React from "react";
import {
  Clock, Stethoscope, ArrowRight, FileText,
  CheckCircle2, Loader2, CalendarDays, Smile,
  Activity, AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { citasService } from "@/domains/appointments/services/citas.service";
import { useAuthStore } from "@/shared/store/useAuthStore";

const ESTADO_COLOR: Record<string, string> = {
  Pendiente:  "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Confirmada: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  En_Curso:   "bg-primary/10 text-primary border-primary/20 animate-pulse",
  Completada: "bg-green-500/10 text-green-500 border-green-500/20",
  Cancelada:  "bg-destructive/10 text-destructive border-destructive/20",
  No_Asistio: "bg-muted text-muted-foreground border-border",
};

const ESTADO_LABEL: Record<string, string> = {
  Pendiente:  "Pendiente",
  Confirmada: "Confirmada",
  En_Curso:   "En Curso",
  Completada: "Completada",
  Cancelada:  "Cancelada",
  No_Asistio: "No Asistió",
};

export default function AgendaDelDiaPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  const { data: citas = [], isLoading } = useQuery({
    queryKey: ["agenda-hoy", user?.id],
    queryFn: () => citasService.getAll({ veterinarioId: user?.id, fecha: todayStr }),
    enabled: !!user?.id,
    refetchInterval: 30_000, // refresca cada 30s automáticamente
  });

  // Ordenar por hora
  const citasHoy = [...citas].sort((a, b) =>
    new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime()
  );

  // Stats rápidas
  const total      = citasHoy.length;
  const completadas = citasHoy.filter(c => c.estado === "Completada").length;
  const enCurso    = citasHoy.filter(c => c.estado === "En_Curso").length;
  const pendientes = citasHoy.filter(c => ["Pendiente", "Confirmada"].includes(c.estado)).length;
  const progreso   = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const handleAtender = async (citaId: string, estado: string) => {
    try {
      if (estado === "Pendiente" || estado === "Confirmada") {
        await citasService.updateEstado(citaId, "En_Curso");
        qc.invalidateQueries({ queryKey: ["agenda-hoy", user?.id] });
      }
      router.push(`/vet/consulta/${citaId}`);
    } catch {
      toast.error("Error al acceder a la consulta.");
    }
  };

  const fechaHoy = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando agenda de hoy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 p-6 rounded-3xl border border-border/50 shadow-sm">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 flex w-fit items-center gap-1">
            <Activity className="h-3 w-3 animate-pulse" /> Agenda de Hoy
          </Badge>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent capitalize">
            {fechaHoy}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Dr/a. {user?.nombres} {user?.apellidos} — Pacientes programados para hoy
          </p>
        </div>
        <Link href="/vet/citas">
          <Button variant="outline" className="rounded-xl gap-2 shrink-0">
            <CalendarDays className="h-4 w-4" /> Ver todas mis citas
          </Button>
        </Link>
      </div>

      {/* STATS + BARRA PROGRESO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 shadow-sm bg-card/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total hoy</p>
            <p className="text-3xl font-black mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm bg-card/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Completadas</p>
            <p className="text-3xl font-black mt-1 text-green-500">{completadas}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm bg-card/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">En curso</p>
            <p className="text-3xl font-black mt-1 text-primary">{enCurso}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm bg-card/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Pendientes</p>
            <p className="text-3xl font-black mt-1 text-amber-500">{pendientes}</p>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DE PROGRESO DEL DÍA */}
      {total > 0 && (
        <Card className="rounded-2xl border-border/50 shadow-sm bg-card/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">Progreso del día</p>
              <p className="text-sm font-bold text-primary">{progreso}%</p>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {completadas} de {total} consultas completadas
            </p>
          </CardContent>
        </Card>
      )}

      {/* LISTA DE CITAS */}
      <Card className="rounded-3xl border-border/50 shadow-md bg-card/25 overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Pacientes de hoy
          </CardTitle>
          <CardDescription className="text-xs capitalize">{fechaHoy}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {citasHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Smile className="h-10 w-10 opacity-20" />
              <p className="text-sm font-semibold">No tienes citas para hoy</p>
              <p className="text-xs">Disfruta tu día o revisa tu agenda general.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {citasHoy.map((cita, idx) => {
                const hora = format(new Date(cita.fecha_hora_inicio), "HH:mm");
                const mascota = cita.mascota?.nombre ?? "Paciente";
                const dueno = cita.mascota?.dueno
                  ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}`
                  : "—";
                const especie = cita.mascota?.raza?.especie?.nombre ?? "";
                const raza = cita.mascota?.raza?.nombre ?? "";
                const servicio = cita.servicio?.nombre ?? "Consulta";
                const estado = cita.estado ?? "Pendiente";
                const completada = estado === "Completada";
                const cancelada = ["Cancelada", "No_Asistio"].includes(estado);

                return (
                  <div
                    key={cita.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/10 ${
                      completada ? "opacity-60" : cancelada ? "opacity-40" : ""
                    }`}
                  >
                    {/* Número + hora */}
                    <div className="flex flex-col items-center shrink-0 w-12 text-center">
                      <span className="text-xs text-muted-foreground font-mono font-bold">#{idx + 1}</span>
                      <span className="text-sm font-black font-mono text-foreground">{hora}</span>
                    </div>

                    {/* Línea vertical de estado */}
                    <div className={`w-1 h-12 rounded-full shrink-0 ${
                      estado === "Completada" ? "bg-green-500" :
                      estado === "En_Curso"   ? "bg-primary animate-pulse" :
                      estado === "Cancelada" || estado === "No_Asistio" ? "bg-destructive" :
                      "bg-amber-500"
                    }`} />

                    {/* Avatar mascota */}
                    <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                      <AvatarImage src={(cita as any).mascota?.foto_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${mascota}`} />
                      <AvatarFallback>{mascota.substring(0, 2)}</AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{mascota}</p>
                        <Badge className={`text-[10px] font-bold border ${ESTADO_COLOR[estado]}`}>
                          {ESTADO_LABEL[estado]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {especie}{raza ? ` · ${raza}` : ""} — Dueño: {dueno}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Stethoscope className="h-3 w-3 text-primary" /> {servicio}
                        </span>
                        {cita.motivo_cita && (
                          <span className="text-[11px] text-muted-foreground italic truncate max-w-[200px]">
                            "{cita.motivo_cita}"
                          </span>
                        )}
                      </div>
                      {estado === "Completada" && (cita as any).updatedAt ? (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Atendida el {format(new Date((cita as any).updatedAt), "d MMM yyyy HH:mm", { locale: es })}
                        </p>
                      ) : estado === "Cancelada" && (cita as any).updatedAt ? (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Cancelada el {format(new Date((cita as any).updatedAt), "d MMM yyyy HH:mm", { locale: es })}
                        </p>
                      ) : (cita as any).createdAt ? (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Agendada: {format(new Date((cita as any).createdAt), "d MMM yyyy", { locale: es })}
                        </p>
                      ) : null}
                    </div>

                    {/* Acción */}
                    <div className="shrink-0">
                      {completada ? (
                        <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 text-primary hover:bg-primary/10" asChild>
                          <Link href={`/vet/expediente?id=${cita.mascota?.id ?? ""}`}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> Expediente
                          </Link>
                        </Button>
                      ) : cancelada ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5" /> No disponible
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-xl text-xs h-8 shadow-sm gap-1"
                          onClick={() => handleAtender(cita.id, estado)}
                        >
                          {estado === "En_Curso" ? "Retomar" : "Atender"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
