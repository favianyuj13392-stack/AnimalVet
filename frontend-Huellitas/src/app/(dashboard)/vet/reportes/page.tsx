"use client";

import React, { useState } from "react";
import { CalendarCheck, Syringe, Loader2, BarChart2, PawPrint, Clock, Stethoscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { reportesService } from "@/domains/admin/services/reportes.service";
import { useAuthStore } from "@/shared/store/useAuthStore";

const PERIODOS = [
  { label: "Este mes",       value: "mes" },
  { label: "Últimos 3 meses", value: "trimestre" },
  { label: "Últimos 6 meses", value: "semestre" },
  { label: "Este año",       value: "anio" },
];

function getPeriodoFechas(periodo: string) {
  const hoy = new Date();
  const inicio = new Date();
  const fin = new Date();
  fin.setFullYear(fin.getFullYear() + 1); // siempre incluir citas futuras
  if (periodo === "mes")       inicio.setMonth(hoy.getMonth() - 1);
  if (periodo === "trimestre") inicio.setMonth(hoy.getMonth() - 3);
  if (periodo === "semestre")  inicio.setMonth(hoy.getMonth() - 6);
  if (periodo === "anio")      inicio.setFullYear(hoy.getFullYear() - 1);
  return {
    fecha_inicio: inicio.toISOString().split("T")[0],
    fecha_fin:    fin.toISOString().split("T")[0],
  };
}

export default function VetReportesPage() {
  const { user } = useAuthStore();
  const [periodo, setPeriodo] = useState("anio");
  const fechas = getPeriodoFechas(periodo);

  const { data: citas, isLoading: loadCitas } = useQuery({
    queryKey: ["vet-reporte-citas", user?.id, periodo],
    queryFn: () => reportesService.getCitas({
      veterinarioId: user?.id,
      ...fechas,
    }).catch(() => null),
    enabled: !!user?.id,
  });

  const { data: vacunasPendientes = [], isLoading: loadVacunas } = useQuery({
    queryKey: ["vet-reporte-vacunas"],
    queryFn: () => reportesService.getVacunasPendientes("365")
      .then(res => res?.vacunas_pendientes ?? res ?? [])
      .catch(() => []),
  });

  const citasData = citas?.detalle_estados
    ? Object.entries(citas.detalle_estados).map(([name, value]) => ({ name: name.replace("_", " "), value: Number(value) })).filter(d => d.value > 0)
    : [];

  // Pacientes más frecuentes
  const pacientesFrecuentes: { nombre: string; especie: string; visitas: number }[] =
    citas?.pacientes_frecuentes ?? [];

  // Diagnósticos más comunes
  const diagnosticosFrecuentes: { diagnostico: string; cantidad: number }[] =
    citas?.diagnosticos_frecuentes ?? [];

  // Tiempo promedio de consulta
  const tiempoPromedio: number = citas?.tiempo_promedio_minutos ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Reportes Veterinario</Badge>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Mis Reportes
            </h1>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44 rounded-xl h-10 bg-card/60 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground mt-1">Resumen de citas atendidas y vacunas pendientes de refuerzo.</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CalendarCheck, label: "Completadas",  value: citas?.detalle_estados?.Completada ?? "—",  color: "bg-emerald-500/10 text-emerald-600" },
          { icon: CalendarCheck, label: "Pendientes",   value: (citas?.detalle_estados?.Pendiente ?? 0) + (citas?.detalle_estados?.Pendiente_Confirmacion ?? 0) || "—", color: "bg-amber-500/10 text-amber-600" },
          { icon: CalendarCheck, label: "Canceladas",   value: citas?.detalle_estados?.Cancelada ?? "—",   color: "bg-red-500/10 text-red-500" },
          { icon: Syringe,       label: "Vacunas pend.", value: Array.isArray(vacunasPendientes) ? vacunasPendientes.length : "—", color: "bg-primary/10 text-primary" },
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

      {/* GRÁFICO CITAS */}
      <Card className="rounded-3xl border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Citas por Estado</CardTitle>
          <CardDescription>Distribución general de mis citas</CardDescription>
        </CardHeader>
        <CardContent>
          {loadCitas ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : citasData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <CalendarCheck className="h-10 w-10 opacity-20" />
              <p className="text-sm">Sin datos de citas disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={citasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* STATS EXTRA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tiempo promedio */}
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Tiempo prom. consulta</p>
              <p className="text-2xl font-black">{tiempoPromedio > 0 ? `${tiempoPromedio} min` : "—"}</p>
            </div>
          </CardContent>
        </Card>
        {/* Total pacientes únicos */}
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600"><PawPrint className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Pacientes distintos</p>
              <p className="text-2xl font-black">{citas?.total_pacientes_unicos ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        {/* Diagnósticos */}
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600"><Stethoscope className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Tipos de diagnóstico</p>
              <p className="text-2xl font-black">{diagnosticosFrecuentes.length > 0 ? diagnosticosFrecuentes.length : "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PACIENTES MÁS FRECUENTES */}
      {pacientesFrecuentes.length === 0 && !loadCitas && (
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
            <PawPrint className="h-6 w-6 opacity-30" />
            <p className="text-sm">Sin datos de pacientes frecuentes para este período. Completa más consultas para ver estadísticas.</p>
          </CardContent>
        </Card>
      )}
      {pacientesFrecuentes.length > 0 && (
        <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/30">
            <CardTitle className="flex items-center gap-2"><PawPrint className="h-5 w-5 text-primary" /> Mis Pacientes Más Frecuentes</CardTitle>
            <CardDescription>Mascotas que más veces me han visitado</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-3 px-6 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Mascota</TableHead>
                  <TableHead className="font-semibold">Especie</TableHead>
                  <TableHead className="font-semibold text-right px-6">Visitas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientesFrecuentes.slice(0, 5).map((p, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/30 border-b border-border/30">
                    <TableCell className="py-3 px-6 text-muted-foreground font-mono">#{idx + 1}</TableCell>
                    <TableCell className="font-semibold">{p.nombre}</TableCell>
                    <TableCell><Badge variant="outline">{p.especie}</Badge></TableCell>
                    <TableCell className="text-right px-6 font-black text-primary">{p.visitas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* DIAGNÓSTICOS MÁS COMUNES */}
      {diagnosticosFrecuentes.length === 0 && !loadCitas && (
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
            <Stethoscope className="h-6 w-6 opacity-30" />
            <p className="text-sm">Sin diagnósticos registrados para este período. Los diagnósticos aparecen aquí al cerrar consultas.</p>
          </CardContent>
        </Card>
      )}
      {diagnosticosFrecuentes.length > 0 && (
        <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/30">
            <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Diagnósticos Más Frecuentes</CardTitle>
            <CardDescription>Diagnósticos que más he registrado en consultas</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {diagnosticosFrecuentes.slice(0, 5).map((d, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono w-5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{d.diagnostico}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(d.cantidad / diagnosticosFrecuentes[0].cantidad) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-black text-primary shrink-0">{d.cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABLA VACUNAS PENDIENTES */}
      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/30">
          <CardTitle className="flex items-center gap-2"><Syringe className="h-5 w-5 text-primary" /> Vacunas Pendientes de Refuerzo</CardTitle>
          <CardDescription>Mascotas con próxima dosis en los próximos 30 días</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadVacunas ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-4 px-6 font-semibold">Mascota</TableHead>
                  <TableHead className="font-semibold">Vacuna</TableHead>
                  <TableHead className="font-semibold">Próxima Dosis</TableHead>
                  <TableHead className="font-semibold">Dueño</TableHead>
                  <TableHead className="font-semibold">Teléfono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(vacunasPendientes) && vacunasPendientes.length > 0 ? (
                  vacunasPendientes.map((v: any) => (
                    <TableRow key={v.id_vacuna_aplicada} className="hover:bg-muted/30 border-b border-border/30">
                      <TableCell className="py-4 px-6 font-semibold">{v.mascota?.nombre ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{v.vacuna ?? v.vacuna?.nombre ?? "—"}</Badge></TableCell>
                      <TableCell><Badge className="bg-orange-500 text-white">{v.fecha_proxima_dosis ?? "—"}</Badge></TableCell>
                      <TableCell>{v.dueno ? `${v.dueno.nombres} ${v.dueno.apellidos}` : "—"}</TableCell>
                      <TableCell className="font-mono">{v.dueno?.telefono ?? "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Sin vacunas pendientes 🎉</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
