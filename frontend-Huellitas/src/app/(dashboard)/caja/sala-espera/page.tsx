"use client";

import { useEffect } from "react";
import { Monitor, PawPrint, Clock, RefreshCw, Loader2, Stethoscope } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { citasService } from "@/domains/appointments/services/citas.service";

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  Confirmada: { label: "En espera",   color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  En_Curso:   { label: "En consulta", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
};

export default function SalaEsperaPage() {
  const queryClient = useQueryClient();
  const hoy = format(new Date(), "yyyy-MM-dd");

  const { data: citas = [], isLoading, refetch } = useQuery({
    queryKey: ["sala-espera", hoy],
    queryFn: () => citasService.getAll({ fecha: hoy }),
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  const enSala = (citas as any[]).filter(
    (c) => c.estado === "Confirmada" || c.estado === "En_Curso"
  ).sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime());

  const enEspera   = enSala.filter((c) => c.estado === "Confirmada");
  const enConsulta = enSala.filter((c) => c.estado === "En_Curso");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Recepción</Badge>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Sala de Espera
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {format(new Date(), "EEEE d 'de' MMMM · HH:mm", { locale: es })} — actualización automática cada 30s
            </p>
          </div>
          <Button variant="outline" className="rounded-2xl gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "En espera",    value: enEspera.length,   color: "text-amber-600 bg-amber-500/10" },
          { label: "En consulta",  value: enConsulta.length, color: "text-blue-600 bg-blue-500/10" },
          { label: "Total en sala", value: enSala.length,    color: "text-primary bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black rounded-xl py-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : enSala.length === 0 ? (
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Monitor className="h-12 w-12 opacity-20" />
            <p className="text-sm">La sala de espera está vacía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enSala.map((cita: any) => {
            const cfg = ESTADO_CONFIG[cita.estado] ?? { label: cita.estado, color: "bg-muted text-muted-foreground" };
            const hora = format(parseISO(String(cita.fecha_hora_inicio)), "HH:mm");
            return (
              <Card key={cita.id} className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <PawPrint className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base">{cita.mascota?.nombre ?? "—"}</p>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {cita.mascota?.dueno
                        ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}`
                        : "Sin dueño"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {hora}
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        {cita.veterinario
                          ? `Dr. ${cita.veterinario.nombres} ${cita.veterinario.apellidos}`
                          : "—"}
                      </span>
                    </div>
                    {(cita as any).createdAt && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Agendada el {format(new Date((cita as any).createdAt), "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
