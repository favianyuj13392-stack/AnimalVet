"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { ArrowLeft, History, Search, Loader2 } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { Mascota } from "@/domains/pets/pets.types";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { historialClinicoService } from "@/domains/clinical/services/historial-clinico.service";
import { OwnerHistoryTimeline } from "@/domains/clinical/components/owner-history-timeline";

export default function HistorialMascotasPage() {
  const user = useAuthStore((state) => state.user)

  const { data: misMascotas, isLoading: loadingMascotas } = useQuery<Mascota[]>({
    queryKey: ["mis-mascotas-historial", user?.id],
    queryFn: () => mascotasService.getMisMascotas(user!.id),
    enabled: !!user?.id,
  });

  const { data: historiales, isLoading: loadingHistorial } = useQuery<any[]>({
    queryKey: ["mis-historiales-cliente", misMascotas?.map((m) => m.id)],
    queryFn: async () => {
      if (!misMascotas || misMascotas.length === 0) return [];
      const expedientes = await Promise.all(
        misMascotas.map((m) => historialClinicoService.getByMiMascota(m.id))
      );
      return expedientes.flatMap((exp) => exp?.historiales ?? []);
    },
    enabled: !!misMascotas && misMascotas.length > 0,
  });

  const [mascotaFiltro, setMascotaFiltro] = useState("todas");
  const [tipoFiltro, setTipoFiltro]       = useState("todos");
  const [busqueda, setBusqueda]           = useState("");
  const [recetasAbiertas, setRecetasAbiertas] = useState<Record<string, boolean>>({});

  const toggleReceta = (idHistorial: string) =>
    setRecetasAbiertas((prev) => ({ ...prev, [idHistorial]: !prev[idHistorial] }));

  if (loadingMascotas || loadingHistorial) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground animate-in fade-in">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Cargando historial medico...</p>
      </div>
    );
  }

  const nombresMascotas = (misMascotas ?? []).map((m) => m.nombre);

  // Entradas de historial clínico (consultas, tratamientos, etc.)
  const entradasHistorial = (historiales ?? []).map((h: any) => {
    const primeraReceta = h.recetas && h.recetas.length > 0 ? h.recetas[0] : null;
    const recetaMapeada = primeraReceta
      ? {
          id: primeraReceta.id,
          detalles: (primeraReceta.detalles || []).map((d: any) => ({
            medicamento: d.producto?.nombre || d.medicamento_texto || "Medicamento",
            dosis:       d.dosis      || "No especificada",
            frecuencia:  d.frecuencia || "No especificada",
            duracion:    d.duracion_dias ? `${d.duracion_dias} dias` : "No especificada",
          })),
        }
      : null;

    return {
      id:             h.id,
      mascota:        h.mascota?.nombre || "Mascota",
      fecha:          h.fecha_consulta ? h.fecha_consulta.split("T")[0] : "—",
      fecha_agendada: h.fecha_agendada ?? null,
      tipo:           h.tipo_atencion || "Consulta",
      servicio:       h.tipo_atencion === "Consulta" ? "Consulta Medica" : h.tipo_atencion || "Atencion Veterinaria",
      veterinario:    h.veterinario || "—",
      diagnostico:    h.diagnostico,
      receta:         recetaMapeada,
    };
  });

  // Vacunas aplicadas dentro de cada historial → entradas separadas
  const entradasVacunas = (historiales ?? []).flatMap((h: any, hi: number) =>
    (h.vacunas_aplicadas ?? []).map((v: any, vi: number) => ({
      id:          `vac-${hi}-${vi}`,
      mascota:     h.mascota?.nombre || "Mascota",
      fecha:       v.fecha_aplicacion ? v.fecha_aplicacion.split("T")[0] : h.fecha_consulta?.split("T")[0] ?? "—",
      tipo:        "Vacunación",
      // el backend serializa vacuna como string (nombre), no como objeto
      servicio:    typeof v.vacuna === "string" ? v.vacuna : (v.vacuna?.nombre ?? "Vacunacion"),
      veterinario: h.veterinario || "—",
      diagnostico: v.peso_al_aplicar ? `Peso al aplicar: ${v.peso_al_aplicar} kg` : "Vacuna aplicada",
      receta:      null,
    }))
  );

  // Combinar y ordenar por fecha DESC
  const listadoHistorial = [...entradasHistorial, ...entradasVacunas]
    .sort((a, b) => {
      const da = a.fecha !== "—" ? new Date(a.fecha).getTime() : 0;
      const db = b.fecha !== "—" ? new Date(b.fecha).getTime() : 0;
      return db - da;
    });

  const historialFiltrado = listadoHistorial.filter((h) => {
    const okMascota  = mascotaFiltro === "todas" || h.mascota === mascotaFiltro;
    const okTipo     = tipoFiltro === "todos"    || h.tipo === tipoFiltro;
    const okBusqueda =
      busqueda === "" ||
      h.diagnostico?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.veterinario.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.servicio.toLowerCase().includes(busqueda.toLowerCase());
    return okMascota && okTipo && okBusqueda;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8">

      {/* ─── PAGE HEADER ─── */}
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
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Historial medico</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {historialFiltrado.length} registro{historialFiltrado.length !== 1 ? "s" : ""} encontrado{historialFiltrado.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ─── FILTROS ─── */}
      <Card className="rounded-xl border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por diagnostico o doctor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9 rounded-lg text-sm"
              />
            </div>

            {/* Mascota */}
            <Select value={mascotaFiltro} onValueChange={setMascotaFiltro}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue placeholder="Todas las mascotas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las mascotas</SelectItem>
                {nombresMascotas.map((nombre) => (
                  <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue placeholder="Tipo de atencion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los servicios</SelectItem>
                <SelectItem value="Consulta">Consulta Medica</SelectItem>
                <SelectItem value="Vacunación">Vacunacion</SelectItem>
                <SelectItem value="Desparasitacion">Desparasitacion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── TIMELINE ─── */}
      <OwnerHistoryTimeline
        historialFiltrado={historialFiltrado}
        recetasAbiertas={recetasAbiertas}
        onToggleReceta={toggleReceta}
      />
    </div>
  );
}
