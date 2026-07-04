"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HistorialDrawer } from "@/domains/clinical/components/historial-drawer";
import { useQuery } from "@tanstack/react-query";
import {
  HeartPulse,
  AlertTriangle,
  User,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  Search,
  X,
  ClipboardList,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useAuthStore } from "@/shared/store/useAuthStore";

// Services
import { hospitalizacionesService } from "@/domains/clinical/services/hospitalizaciones.service";
import { monitoreoDiarioService } from "@/domains/clinical/services/monitoreo-diario.service";

// Horas sin monitoreo para disparar alerta
const HORAS_ALERTA = 8;

export default function HospitalizacionPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;
  const router = useRouter();

  // Fetch hospitalizaciones
  const { data: hospitalizaciones, isLoading } = useQuery({
    queryKey: ["hospitalizaciones"],
    queryFn: () => hospitalizacionesService.getAll(),
  });

  // Filtrar activas (excluir Alta)
  const activeHospitalizations = useMemo(() => {
    if (!hospitalizaciones) return [];
    return hospitalizaciones.filter(h => h.estado_actual !== 'Alta');
  }, [hospitalizaciones]);

  // Fetch monitoreos de todos los internados activos
  const { data: todosMonitoreos = [] } = useQuery({
    queryKey: ["monitoreos-todos", activeHospitalizations.map(h => h.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        activeHospitalizations.map(h =>
          monitoreoDiarioService.getByHospitalizacion(h.id).catch(() => [])
        )
      );
      // Mapear: { [id_hosp]: ultimo_fecha_registro }
      const map: Record<string, string | null> = {};
      activeHospitalizations.forEach((h, idx) => {
        const monitoreos = results[idx] as any[];
        const ultimo = monitoreos.sort((a, b) =>
          new Date(b.fecha_registro || b.createdAt).getTime() -
          new Date(a.fecha_registro || a.createdAt).getTime()
        )[0];
        map[h.id] = ultimo?.fecha_registro || ultimo?.createdAt || null;
      });
      return map;
    },
    enabled: activeHospitalizations.length > 0,
    refetchInterval: 5 * 60 * 1000, // refresca cada 5 min
  });

  const horasSinMonitoreo = (hospId: string): number | null => {
    const ultima = todosMonitoreos[hospId];
    if (!ultima) return null;
    return Math.floor((Date.now() - new Date(ultima).getTime()) / (1000 * 60 * 60));
  };

  const [busqueda, setBusqueda] = useState("");
  const [historialMascota, setHistorialMascota] = useState<{ id: string; nombre: string } | null>(null);

  const hospitalizacionesFiltradas = activeHospitalizations.filter(h => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      h.mascota?.nombre?.toLowerCase().includes(term) ||
      h.mascota?.raza?.nombre?.toLowerCase().includes(term) ||
      h.estado_actual?.toLowerCase().includes(term) ||
      h.motivo_ingreso?.toLowerCase().includes(term)
    );
  });

  const sinAlerta = activeHospitalizations.filter(h => {
    const horas = horasSinMonitoreo(h.id);
    return horas !== null && horas >= HORAS_ALERTA;
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Grave": return "bg-destructive text-destructive-foreground animate-pulse";
      case "Observacion": return "bg-orange-500 text-white";
      case "Estable": return "bg-green-500 text-white";
      default: return "bg-secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando pizarra de internaciones...</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-sm shadow-sm">
        <div>
          <Badge variant="outline" className="mb-2 bg-destructive/10 text-destructive border-destructive/20 font-bold">
            UCI Hospitalizaciones
          </Badge>
          {sinAlerta > 0 && (
            <div className="flex items-center gap-2 mt-1 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 w-fit">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              {sinAlerta} paciente{sinAlerta > 1 ? "s" : ""} sin monitoreo hace más de {HORAS_ALERTA}h
            </div>
          )}
          <h1 className="text-4xl font-black tracking-tight bg-linear-to-r from-destructive via-orange-500 to-primary bg-clip-text text-transparent pb-1">
            Pizarra General de Internados
          </h1>
          <p className="text-muted-foreground mt-1">
            Vista general de pacientes activos. Selecciona un paciente para registrar signos vitales, insumos y aplicar tratamientos.
          </p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente, raza, estado o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-card/60"
        />
        {busqueda && (
          <button onClick={() => setBusqueda("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl items-center font-semibold text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
          <span>Modo de Vista: Como administrador, solo puedes visualizar el estado general. Ingresa al expediente para auditoría detallada.</span>
        </div>
      )}

      {/* GRID DE CARTAS DE PACIENTES */}
      {activeHospitalizations.length === 0 ? (
        <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-border/50 text-muted-foreground backdrop-blur-sm">
          <HeartPulse className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <h3 className="text-lg font-bold text-foreground">Sala Vacía</h3>
          <p className="text-sm">No hay pacientes hospitalizados en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hospitalizacionesFiltradas.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Search className="h-10 w-10 opacity-20" />
              <p className="text-sm">Sin resultados para "{busqueda}"</p>
            </div>
          ) : null}
          {hospitalizacionesFiltradas.map((h) => (
            <Card key={h.id} className={`rounded-3xl border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 bg-card/40 backdrop-blur-sm flex flex-col overflow-hidden group ${
              horasSinMonitoreo(h.id) !== null && (horasSinMonitoreo(h.id) ?? 0) >= HORAS_ALERTA
                ? "border-amber-500/40 ring-1 ring-amber-500/20"
                : ""
            }`}>
              <CardHeader className="border-b border-border/30 bg-muted/5 pb-4">
                {(() => {
                  const horas = horasSinMonitoreo(h.id);
                  if (horas === null) return (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-2">
                      <Clock className="h-3 w-3" /> Sin monitoreo registrado aún
                    </div>
                  );
                  if (horas >= HORAS_ALERTA) return (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-2 animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> ¡Sin monitoreo hace {horas}h!
                    </div>
                  );
                  return (
                    <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold mb-2">
                      <Clock className="h-3 w-3" /> Último monitoreo hace {horas}h
                    </div>
                  );
                })()}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={h.mascota?.foto_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${h.mascota?.nombre || "Paciente"}`}
                        alt={h.mascota?.nombre}
                        className="h-12 w-12 border-2 border-background rounded-full bg-card shadow-sm group-hover:scale-105 transition-transform"
                      />
                      {/* Puntito de estado sobre el avatar */}
                      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${getStatusColor(h.estado_actual).split(' ')[0]}`} />
                    </div>
  <div>
    <CardTitle className="text-xl font-bold flex items-center gap-2">
      {h.mascota?.nombre || "Paciente"}
      {/* Icono de sexo dinámico */}
      {h.mascota?.sexo === 'M' ? (
        <span className="text-blue-500 font-bold text-lg" title="Macho">♂</span>
      ) : h.mascota?.sexo === 'H' || h.mascota?.sexo === 'F' ? (
        <span className="text-pink-500 font-bold text-lg" title="Hembra">♀</span>
      ) : null}
    </CardTitle>
    <p className="text-xs text-muted-foreground font-medium mt-0.5">
      {h.mascota?.raza?.nombre || "Mestizo"}
    </p>
  </div>
                  </div>
                  <Badge className={`${getStatusColor(h.estado_actual)} text-[10px] py-1 px-2.5 rounded-lg font-bold border-none shadow-sm uppercase tracking-wider`}>
                    {h.estado_actual}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-5 flex-1 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Motivo de Ingreso
                  </p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-lg">
                    {h.motivo_ingreso}
                  </p>
                </div>

  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
    <div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Ingreso</p>
      <p className="text-xs font-mono font-bold text-primary">
        {h.fecha_ingreso ? new Date(h.fecha_ingreso).toLocaleDateString("es-BO") : "N/A"}
      </p>
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Médico</p>
      <p className="text-xs font-bold truncate">
        {h.veterinario ? `Dr. ${h.veterinario.apellidos}` : "No asignado"}
      </p>
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tarifa</p>
      <p className="text-xs font-bold text-green-600 dark:text-green-400">
        Bs. {h.costo_por_dia}
      </p>
    </div>
  </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl text-xs gap-1.5"
                  onClick={() => setHistorialMascota({ id: h.mascota?.id, nombre: h.mascota?.nombre ?? "Paciente" })}
                >
                  <ClipboardList className="h-3.5 w-3.5" /> Historial
                </Button>
                <Button
                  className="flex-1 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs gap-1.5"
                  onClick={() => router.push(`/vet/hospitalizacion/${h.id}`)}
                >
                  Expediente <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>

    {/* DRAWER HISTORIAL */}
    {historialMascota && (
      <HistorialDrawer
        mascotaId={historialMascota.id}
        mascotaNombre={historialMascota.nombre}
        onClose={() => setHistorialMascota(null)}
      />
    )}
    </>
  );
}