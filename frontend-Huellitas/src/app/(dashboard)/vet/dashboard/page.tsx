"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  TrendingUp,
  Users,
  ClipboardList,
  HeartPulse,
  Package,
  AlertTriangle,
  Calendar,
  ChevronRight,
  TrendingDown,
  Activity,
  DollarSign,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { reportesService } from "@/domains/admin/services/reportes.service";
import { citasService } from "@/domains/appointments/services/citas.service";
import { hospitalizacionesService } from "@/domains/clinical/services/hospitalizaciones.service";

export default function DoctorDashboardPage() {
  const { user } = useAuthStore();
  const todayStr = new Date().toISOString().split("T")[0];

  // --- QUERIES ---
  const { data: financiero, refetch: refetchFinanciero } = useQuery({
    queryKey: ["vet-dashboard-financiero"],
    queryFn: async () => {
      return reportesService.getFinanciero({
        fecha_inicio: todayStr,
        fecha_fin: todayStr
      }).catch(() => ({ total_ingresos: 0, total_transacciones: 0, transacciones: [] }));
    },
    enabled: user?.rol?.id === 1
  });

  const { data: citas = [], refetch: refetchCitas } = useQuery({
    queryKey: ["vet-dashboard-citas"],
    queryFn: () => citasService.getAll({ fecha: todayStr }).catch(() => [])
  });

  const { data: hospitalizaciones = [], refetch: refetchHosp } = useQuery({
    queryKey: ["vet-dashboard-hosp"],
    queryFn: () => hospitalizacionesService.getAll().catch(() => [])
  });

  const { data: inventarioCritico } = useQuery({
    queryKey: ["vet-dashboard-inventario"],
    queryFn: () => reportesService.getInventario().catch(() => ({ productos_criticos: [] }))
  });

  const { data: lotesPorVencer } = useQuery({
    queryKey: ["vet-dashboard-lotes-vencer"],
    queryFn: () => reportesService.getLotesPorVencer("30").catch(() => ({ lotes_por_vencer: [] }))
  });

  // --- WEBSOCKET REAL-TIME SYNC ---
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("WebSocket conectado al dashboard del Doctor.");
    });

    socket.on("citaActualizada", () => {
      // Recargar datos en tiempo real cuando la esposa cobre o cambie una cita
      if (user?.rol?.id === 1) {
        refetchFinanciero();
      }
      refetchCitas();
      refetchHosp();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetchFinanciero, refetchCitas, refetchHosp]);

  const atencionesHoy = citas.filter((c: any) => c.estado === "Completada" || c.estado === "En_Curso").length;
  const pendientesHoy = citas.filter((c: any) => c.estado === "Pendiente" || c.estado === "En_Curso");
  const internadosActivos = hospitalizaciones.filter((h: any) => h.estadoActual !== "Alta");

  // Alertas de inventario
  const productosBajoStock = inventarioCritico?.productos_criticos || [];
  const lotesExpirando = lotesPorVencer?.lotes_por_vencer || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="bg-card/45 p-6 rounded-3xl border border-border/50 backdrop-blur-md shadow-sm">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          <LayoutDashboard className="h-10 w-10 text-primary" /> Panel de Control — Animal Vet
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Hola Dr. <strong>{user?.nombres} {user?.apellidos}</strong>. Este es el resumen del estado médico y financiero de la clínica para el día de hoy.
        </p>
      </div>

      {/* METRICS ROW */}
      <div className={`grid grid-cols-1 md:grid-cols-${user?.rol?.id === 1 ? 4 : 3} gap-6`}>
        
        {/* RECAUDACIÓN HOY */}
        {user?.rol?.id === 1 && (
          <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">Recaudación de Hoy</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-2xl">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {financiero?.total_ingresos ? Number(financiero.total_ingresos).toFixed(2) : "0.00"} <span className="text-lg font-medium">Bs</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cobrado en caja por {financiero?.total_transacciones || 0} transacciones.
              </p>
            </CardContent>
          </Card>
        )}

        {/* PACIENTES ATENDIDOS */}
        <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground">Pacientes Atendidos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-2xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {atencionesHoy} <span className="text-lg font-medium">/ {citas.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Mascotas ingresadas a consulta el día de hoy.
            </p>
          </CardContent>
        </Card>

        {/* INTERNADOS EN UCI */}
        <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground">Internados Activos</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-2xl">
              <HeartPulse className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {internadosActivos.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pacientes actualmente en monitoreo u hospitalización.
            </p>
          </CardContent>
        </Card>

        {/* ALERTAS DE STOCK */}
        <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground">Alertas Críticas</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground text-amber-600 dark:text-amber-400">
              {productosBajoStock.length + lotesExpirando.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {productosBajoStock.length} sin stock y {lotesExpirando.length} próximos a vencer.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* DETAILED DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLA DE PACIENTES PENDIENTES */}
        <Card className="lg:col-span-2 rounded-3xl border-border/45 bg-card/25 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Cola Médica de Hoy
            </CardTitle>
            <CardDescription>Pacientes esperando consulta o actualmente en atención.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {pendientesHoy.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay pacientes pendientes para hoy en la cola de atención.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Mascota</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendientesHoy.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6 font-bold">{c.mascota?.nombre || c.nombre_mascota}</TableCell>
                      <TableCell>{c.mascota?.dueno ? `${c.mascota.dueno.nombres} ${c.mascota.dueno.apellidos}` : "Sin dueño"}</TableCell>
                      <TableCell className="font-mono">
                        {new Date(c.fecha_hora_inicio).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.estado === "En_Curso" ? "default" : "secondary"}>
                          {c.estado === "En_Curso" ? "En Consulta" : "En Espera"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button size="sm" asChild className="rounded-lg font-bold">
                          <Link href={`/vet/consulta/${c.id}`}>
                            Atender <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* PANEL DE INVENTARIO CRÍTICO */}
        <Card className="rounded-3xl border-border/45 bg-card/25 backdrop-blur-sm shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" /> Alertas de Farmacia
            </CardTitle>
            <CardDescription>Productos e insumos que requieren reposición inmediata.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-4 max-h-[380px] pr-2">
            
            {/* BAJO STOCK */}
            {productosBajoStock.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Agotándose o Crítico</h4>
                {productosBajoStock.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <span className="text-sm font-semibold truncate max-w-[150px]">{p.nombre}</span>
                    <Badge variant="destructive" className="font-mono">
                      Stock: {p.stock_actual}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* EXPIRACIÓN */}
            {lotesExpirando.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Próximos a Vencer (30 días)</h4>
                {lotesExpirando.slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex justify-between items-center p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate max-w-[140px]">{l.producto?.nombre}</span>
                      <span className="text-[10px] text-muted-foreground">Lote: {l.numeroLote}</span>
                    </div>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5">
                      Vence: {new Date(l.fechaVencimiento).toLocaleDateString("es-BO")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {productosBajoStock.length === 0 && lotesExpirando.length === 0 && (
              <div className="text-center py-20 text-muted-foreground text-sm">
                No hay alertas críticas en inventario. ¡Todo al día!
              </div>
            )}

          </CardContent>
        </Card>

      </div>

    </div>
  );
}
