"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  ArrowRight,
  FileText,
  Activity,
  Smile,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCrud } from "@/shared/hooks/useCrud";
import { Cita } from "@/domains/appointments/appointments.types";
import { VetStatsCard } from "@/domains/clinical/components/VetStatsCard";
import { citasService } from "@/domains/appointments/services/citas.service";
import { useAuthStore } from "@/shared/store/useAuthStore";

interface CitaUI {
  id: string;
  id_mascota_fk?: string;
  mascota: string;
  foto_url?: string | null;
  especie: string;
  raza: string;
  dueno: string;
  servicio: string;
  fecha: string; // YYYY-MM-DD
  hora: string;
  motivo: string;
  estado: "Pendiente" | "En_Curso" | "Completada" | "Cancelada";
}

const ESTADO_COLOR: Record<string, string> = {
  Pendiente: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  En_Curso: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
  Completada: "bg-green-500/10 text-green-500 border-green-500/20",
  Cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function VetAgendaPersonalPage() {
  const { user } = useAuthStore();

  const vetCalendarService = {
    ...citasService,
    getAll: () => citasService.getAll({ veterinarioId: user?.id })
  };

  const { data: appointments, loading: loadingCitas, createItem: createCita, refetch: refetchCitas } = useCrud<Cita>(
    vetCalendarService,
    `citas-vet-calendar-${user?.id}`,
    { refetchInterval: 30000 }
  );

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const loading = loadingCitas;

const router = useRouter();

// Añadimos 'estadoActual' como segundo parámetro
const handleIniciarConsulta = async (citaId: string, estadoActual: string) => {
  console.log("🩺 citaId:", citaId, "estado:", estadoActual);
  try {
    // Solo le avisamos al backend si la cita es nueva ("Pendiente")
    if (estadoActual === "Pendiente") {
      await citasService.updateEstado(citaId, "En_Curso");
      await refetchCitas(); 
    }

    // Siempre redirigimos, sin importar si apenas la iniciamos o si ya estaba "En_Curso"
    router.push(`/vet/consulta/${citaId}`);
    
  } catch (error) {
    console.error(error);
    toast.error("Error al acceder a la consulta médica.");
  }
};

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getCalendarDays = () => {
    const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    const cells: { day: number; month: number; year: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      cells.push({ day: d, month: m, year: y, dateStr: `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: currentMonth, year: currentYear, dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, isCurrentMonth: true });
    }
    const remaining = 42 - cells.length;
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: nextM, year: nextY, dateStr: `${nextY}-${String(nextM + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, isCurrentMonth: false });
    }
    return cells;
  };

  const days = getCalendarDays();

  const getCitaDateStr = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const formatHora = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "09:00";
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const mappedCitas: CitaUI[] = (appointments ?? [])
  // 1. Corrección del filtro: usar c.veterinario?.id en lugar de id_veterinario_fk
  // Nota: Si tu endpoint ya filtra por veterinarioId (como se ve en Swagger), este filtro en el front podría ser redundante.
  .filter((c) => String(c.veterinario?.id) === String(user?.id))
  .map((c) => {
    const dateStr = getCitaDateStr(c.fecha_hora_inicio);
    const horaStr = formatHora(c.fecha_hora_inicio);
    const mascotaName = c.mascota?.nombre || "Paciente";
    
    // 2. Estos datos no vienen del backend actualmente, así que seguirán usando los fallbacks
    // hasta que el endpoint incluya las relaciones.
    const breedName = c.mascota?.raza?.nombre || "Mestizo";
    const especieName = c.mascota?.raza?.especie?.nombre || "Perro";
    const duenoName = c.mascota?.dueno ? `${c.mascota.dueno.nombres} ${c.mascota.dueno.apellidos}` : "Cliente General";
    
    const serviceName = c.servicio?.nombre || "Consulta General";
    const motivoStr = c.motivo_cita || "Revisión general";

    let estadoUI: "Pendiente" | "En_Curso" | "Completada" | "Cancelada" = "Pendiente";
    if (c.estado === "Completada") estadoUI = "Completada";
    else if (c.estado === "En_Curso") estadoUI = "En_Curso";
    else if (c.estado === "Cancelada") estadoUI = "Cancelada";

    return {
      id: c.id,
      id_mascota_fk: c.mascota?.id,
      mascota: mascotaName,
      foto_url: (c.mascota as any)?.foto_url ?? null,
      especie: especieName,
      raza: breedName,
      dueno: duenoName,
      servicio: serviceName,
      fecha: dateStr,
      hora: horaStr,
      motivo: motivoStr,
      estado: estadoUI,
    };
  });

  const selectedDateCitas = mappedCitas
    .filter((c) => c.fecha === selectedDateStr)
    .filter((c) => filtroEstado === "todos" || c.estado === filtroEstado)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  // Stats dinámicas del mes visible
  const mesPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const mesLabel = new Date(currentYear, currentMonth).toLocaleDateString("es", { month: "long", year: "numeric" });
  const totalCitasMes    = mappedCitas.filter(c => c.fecha.startsWith(mesPrefix)).length;
  const completadasMes   = mappedCitas.filter(c => c.fecha.startsWith(mesPrefix) && c.estado === "Completada").length;
  const pendientesHoy    = mappedCitas.filter(c => c.fecha === todayStr && c.estado === "Pendiente").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando agenda médica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-sm shadow-sm">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 flex w-fit items-center gap-1">
            <Activity className="h-3 w-3 text-primary animate-pulse" /> Agenda de Trabajo Profesional
          </Badge>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
            Agenda Médica - Dr/a. {user?.nombres} {user?.apellidos}
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta y organiza tus citas médicas mensuales, gestiona la agenda y atiende a los pacientes programados en sala de espera.
          </p>
        </div>
      </div>

      {/* SCORECARD DE ESTADÍSTICAS MENSUALES */}
      <VetStatsCard />

      {/* METRICAS RAPIDAS DE LA DOCTORA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-border/50 shadow-sm bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground capitalize">Citas Totales ({mesLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalCitasMes} Pacientes</div>
            <p className="text-xs text-muted-foreground mt-1">Programados para el mes visible</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">{completadasMes} Atendidos</div>
            <p className="text-xs text-muted-foreground mt-1">Historial clínico y recetas generadas</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes para Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500">{pendientesHoy} Restantes</div>
            <p className="text-xs text-muted-foreground mt-1">Pacientes esperando en Sala de Espera</p>
          </CardContent>
        </Card>
      </div>

      {/* SECCION CENTRAL: CALENDARIO E INTERACCION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* CALENDARIO GIGANTE MENSUAL (2/3) */}
        <Card className="xl:col-span-2 rounded-3xl border-border/50 shadow-md bg-card/25 backdrop-blur-md overflow-hidden flex flex-col justify-between">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg capitalize">
                  {new Date(currentYear, currentMonth).toLocaleDateString("es", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs"
                  onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDateStr(todayStr); }}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 flex-1">
            {/* Grid Header (S, M, T, W, T, F, S) */}
            <div className="grid grid-cols-7 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground/80 pb-3">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((dayObj, index) => {
                const dayCitas = mappedCitas.filter((c) => c.fecha === dayObj.dateStr);
                const isSelected = selectedDateStr === dayObj.dateStr;
                const isToday = dayObj.dateStr === todayStr;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDateStr(dayObj.dateStr)}
                    className={`min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:border-primary/50 hover:bg-muted/10 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-inner"
                        : dayObj.isCurrentMonth
                        ? "border-border/40 bg-card/30"
                        : "border-border/10 bg-card/5 opacity-40 text-muted-foreground"
                    } ${isToday && !isSelected ? "ring-2 ring-primary/45 bg-primary/5 border-primary/25" : ""}`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-black font-mono ${
                        isToday ? "h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold" : ""
                      }`}>
                        {dayObj.day}
                      </span>
                      {dayCitas.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-bold font-mono">
                          {dayCitas.length} {dayCitas.length === 1 ? "cita" : "citas"}
                        </span>
                      )}
                    </div>

                    {/* Tiny badges for appointments */}
                    <div className="space-y-1 mt-1.5 overflow-hidden max-h-[55px]">
                      {dayCitas.slice(0, 2).map((cita) => (
                        <div
                          key={cita.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold truncate border flex items-center gap-1 ${
                            cita.estado === "Completada"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : cita.estado === "En_Curso"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          <span className="font-mono font-semibold">{cita.hora}</span>
                          <span className="truncate">{cita.mascota}</span>
                        </div>
                      ))}
                      {dayCitas.length > 2 && (
                        <div className="text-[8px] text-muted-foreground font-semibold text-center mt-0.5">
                          + {dayCitas.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* TIMELINE DE CITAS DEL DÍA SELECCIONADO (1/3) */}
        <Card className="rounded-3xl border-border/50 shadow-md bg-card/25 backdrop-blur-md flex flex-col overflow-hidden h-[620px]">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10 shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Citas Programadas</CardTitle>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-36 h-8 rounded-xl text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="En_Curso">En Curso</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription className="text-xs">
              Detalle para el: <span className="font-bold text-foreground capitalize">
                {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("es", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto flex-1 space-y-4">
            {selectedDateCitas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                <Smile className="h-10 w-10 text-muted-foreground/60" />
                <div>
                  <p className="text-sm font-semibold">No tienes consultas agendadas</p>
                  <p className="text-xs mt-1">Disfruta de tu descanso o agenda un paciente manualmente para esta fecha.</p>
                </div>
              </div>
            ) : (
              selectedDateCitas.map((cita) => (
                <div
                  key={cita.id}
                  className="p-4 rounded-2xl border border-border/40 hover:bg-muted/10 transition-all flex flex-col gap-3 relative overflow-hidden bg-card/10"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9 border border-border/60">
                        <AvatarImage src={cita.foto_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cita.mascota}`} />
                        <AvatarFallback>{cita.mascota.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground leading-snug">{cita.mascota}</h4>
                        <p className="text-xs text-muted-foreground">{cita.especie} ({cita.raza}) • Dueño: {cita.dueno}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] font-bold ${ESTADO_COLOR[cita.estado]}`}>
                      {cita.estado.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground border-t border-border/30 pt-2.5">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="h-3.5 w-3.5 text-primary" /> <strong>Agendada: {cita.hora} Hrs</strong>
                    </div>
                    {(() => {
                      const citaRaw = (appointments ?? []).find((a) => a.id === cita.id);
                      if (cita.estado === "Completada" && citaRaw?.updatedAt) {
                        return (
                          <div className="flex items-center gap-1.5 font-mono text-green-600 dark:text-green-400">
                            <Clock className="h-3.5 w-3.5" />
                            <strong>Atendida: {new Date(citaRaw.updatedAt).toLocaleString("es-BO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                          </div>
                        );
                      }
                      if (cita.estado === "Cancelada" && citaRaw?.updatedAt) {
                        return (
                          <div className="flex items-center gap-1.5 font-mono text-destructive">
                            <Clock className="h-3.5 w-3.5" />
                            <strong>Cancelada: {new Date(citaRaw.updatedAt).toLocaleString("es-BO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" /> <strong>{cita.servicio}</strong>
                    </div>
                    <p className="text-xs bg-muted/30 p-2 rounded-xl text-card-foreground/90 mt-1 italic">
                      "{cita.motivo}"
                    </p>
                  </div>

                  {/* Acciones clínicas */}
                  <div className="flex justify-end gap-2 pt-1">
                    {cita.estado === "Completada" ? (
                      <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 text-primary hover:bg-primary/10" asChild>
                        <Link href={`/vet/expediente?id=${cita.id_mascota_fk || ''}`}>
                          <FileText className="h-3.5 w-3.5 mr-1" /> Expediente
                        </Link>
                      </Button>
                    ) : cita.estado === "Cancelada" ? null : (
                      <Button
                        size="sm"
                        className="rounded-xl text-xs h-8 shadow-sm"
                        onClick={() => handleIniciarConsulta(cita.id, cita.estado)}
                      >
                        {cita.estado === "En_Curso" ? "Retomar Consulta" : "Atender"}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
