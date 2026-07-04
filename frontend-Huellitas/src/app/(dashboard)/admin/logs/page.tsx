"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, Activity, Package, DollarSign, Database, 
  Search, RefreshCw, Loader2, CalendarClock, Fingerprint
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";

// Importa tu instancia de axios configurada
import api from '@/shared/lib/axios'; // (Ajusta la ruta según tu proyecto)

// Opcional: Define la interfaz para autocompletado en React
export interface LogSistema {
  id: string;
  accion: string;
  categoria: string;
  tablaAfectada: string | null;
  registroId: string | null;
  detalles: any;
  createdAt: string;
  usuario?: {
    nombres: string;
    apellidos: string;
    rol: { nombre: string };
  };
}

export const logsService = {
  // Función personalizada que soporta la categoría y el límite
  obtenerLogs: async (categoria: string, limite: string): Promise<LogSistema[]> => {
    
    // Si queremos "TODAS", usamos la ruta base, si no, usamos la de categoría
    const endpoint = categoria === "TODAS" 
      ? `/logs-sistema` 
      : `/logs-sistema/categoria/${categoria}`;
    
    // Pasamos el límite como query param (?limite=X)
    const { data } = await api.get<LogSistema[]>(endpoint, {
      params: { limite }
    });
    
    return data;
  }
};

// ─── DICCIONARIOS VISUALES PARA LOS LOGS ───
const CATEGORIA_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  SEGURIDAD:  { color: "text-red-600", bg: "bg-red-500/10 border-red-500/20", icon: ShieldAlert },
  CLINICO:    { color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20", icon: Activity },
  INVENTARIO: { color: "text-orange-600", bg: "bg-orange-500/10 border-orange-500/20", icon: Package },
  FINANZAS:   { color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20", icon: DollarSign },
  SISTEMA:    { color: "text-purple-600", bg: "bg-purple-500/10 border-purple-500/20", icon: Database },
};

export default function AuditoriaLogsPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [limite, setLimite] = useState("50");

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["logs-auditoria", categoria, limite],
    queryFn: () => logsService.obtenerLogs(categoria, limite),
  });

  // Filtro de texto local para búsqueda rápida
  const logsFiltrados = logs.filter((log: any) => {
    const texto = `${log.accion} ${log.tablaAfectada || ""} ${log.usuario?.nombres || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-sm text-white">
        <Badge variant="outline" className="mb-2 bg-white/10 text-slate-200 border-white/20 rounded-full">
          Centro de Control
        </Badge>
        <h1 className="text-4xl font-black tracking-tight">
          Auditoría de Sistema
        </h1>
        <p className="text-slate-400 mt-1 max-w-2xl">
          Registro inmutable de actividades. Monitorea acciones críticas, movimientos financieros y accesos del personal en tiempo real.
        </p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <Fingerprint className="absolute -right-6 -bottom-6 h-48 w-48 text-white/5 rotate-12" />
      </div>

      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        
        {/* ── BARRA DE FILTROS ── */}
        <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por acción, tabla o usuario..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                className="pl-9 bg-background rounded-xl" 
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-[160px] bg-background rounded-xl">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las áreas</SelectItem>
                  <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                  <SelectItem value="CLINICO">Clínico</SelectItem>
                  <SelectItem value="INVENTARIO">Inventario</SelectItem>
                  <SelectItem value="FINANZAS">Finanzas</SelectItem>
                  <SelectItem value="SISTEMA">Sistema</SelectItem>
                </SelectContent>
              </Select>

              <Select value={limite} onValueChange={setLimite}>
                <SelectTrigger className="w-[100px] bg-background rounded-xl">
                  <SelectValue placeholder="Mostrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 reg.</SelectItem>
                  <SelectItem value="100">100 reg.</SelectItem>
                  <SelectItem value="200">200 reg.</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-xl bg-background" 
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* ── TABLA DE DATOS ── */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="font-semibold">Desencriptando registros de auditoría...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="py-4 px-6 font-semibold w-[180px]">Fecha y Hora</TableHead>
                    <TableHead className="font-semibold w-[160px]">Categoría</TableHead>
                    <TableHead className="font-semibold">Acción Registrada</TableHead>
                    <TableHead className="font-semibold">Usuario</TableHead>
                    <TableHead className="font-semibold text-right pr-6">Detalles Técnicos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                        <Database className="h-10 w-10 opacity-20 mx-auto mb-3" />
                        No se encontraron registros de auditoría que coincidan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logsFiltrados.map((log: any) => {
                      // Configuración visual por defecto en caso de categoría no mapeada
                      const conf = CATEGORIA_CONFIG[log.categoria] || { 
                        color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: Database 
                      };
                      const Icono = conf.icon;

                      return (
                        <TableRow key={log.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                          
                          {/* FECHA */}
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {log.createdAt ? format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: es }) : "—"}
                            </div>
                          </TableCell>

                          {/* CATEGORÍA BADGE */}
                          <TableCell>
                            <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-lg border ${conf.bg} ${conf.color}`}>
                              <Icono className="h-3.5 w-3.5" />
                              {log.categoria}
                            </Badge>
                          </TableCell>

                          {/* ACCIÓN */}
                          <TableCell>
                            <p className="font-semibold text-sm">{log.accion}</p>
                            {log.tablaAfectada && (
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                Tabla: {log.tablaAfectada}
                              </p>
                            )}
                          </TableCell>

                          {/* USUARIO */}
                          <TableCell>
                            {log.usuario ? (
                              <div>
                                <p className="text-sm font-medium">{log.usuario.nombres} {log.usuario.apellidos}</p>
                                <p className="text-[10px] text-muted-foreground">{log.usuario.rol?.nombre ?? "Usuario"}</p>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">Sistema Automático</Badge>
                            )}
                          </TableCell>

                          {/* DETALLES (JSON) */}
                          <TableCell className="text-right pr-6">
                            {log.registroId && (
                              <p className="text-[10px] font-mono text-muted-foreground mb-1">
                                ID: {log.registroId.slice(0, 8)}...
                              </p>
                            )}
                            {log.detalles && Object.keys(log.detalles).length > 0 ? (
                              <div className="inline-block text-left bg-muted/40 p-2 rounded-lg border border-border/50 text-[10px] font-mono text-muted-foreground max-w-[200px] truncate">
                                {JSON.stringify(log.detalles)}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}