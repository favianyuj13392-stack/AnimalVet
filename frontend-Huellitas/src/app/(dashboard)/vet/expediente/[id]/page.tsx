"use client";

import React, { useState, use } from "react";
import { usePdfViewer } from "@/shared/hooks/usePdfViewer";
import { FileViewer } from "@/shared/components/ui/file-viewer";
import {
  FileText,
  User,
  Calendar,
  Stethoscope,
  Plus,
  Syringe,
  ShieldAlert,
  Paperclip,
  Download,
  Loader2,
  Activity,
  ArrowLeft,
  BedDouble,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { AlertTriangle } from "lucide-react";

// Servicios
import { expedientesService } from "@/domains/clinical/services/expedientes.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";

const safeDateString = (dateVal: any): string => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return "—";
  }
};

export default function DetalleExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;
  const { pdf, loading: loadingPdf, openPdf, closePdf } = usePdfViewer();

  // 1. Obtener datos de la mascota
  const { data: mascota, isLoading: loadingMascota } = useQuery({
    queryKey: ["mascota", id],
    queryFn: () => mascotasService.getOne(id),
    enabled: !!id,
  });

  // 2. Obtener el Expediente Clínico con todo su árbol
  const { 
    data: expediente, 
    isLoading: loadingExpediente, 
    error: errorExpediente, 
    refetch: refetchExpediente 
  } = useQuery({
    queryKey: ["expediente-clinico", id],
    queryFn: () => expedientesService.getByMascota(id),
    enabled: !!id,
    retry: false,
  });

  // 3. Mutación para abrir el expediente por primera vez
  const createExpedienteMutation = useMutation({
    mutationFn: () => expedientesService.create({
      id_mascota_fk: id,
      notas_generales: "Apertura inicial de expediente clínico."
    }),
    onSuccess: () => {
      toast.success("Expediente clínico abierto exitosamente");
      refetchExpediente();
    },
    onError: () => {
      toast.error("Error al abrir el expediente clínico.");
    }
  });

  if (loadingMascota || loadingExpediente) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Desencriptando historial médico...</p>
      </div>
    );
  }

  const is404 = !!(errorExpediente && (errorExpediente as any).response?.status === 404);
  const noTieneExpediente = !expediente || is404;

  const historiales = expediente?.historiales || [];
  
  // Extraer todas las vacunas de consultas y hospitalizaciones
  const todasVacunas = historiales.flatMap(h => {
    const vacsHistorial = (h.vacunas_aplicadas || []).map((v: any) => ({ ...v, origen: 'Consulta', veterinario: h.veterinario }));
    const vacsHosp = (h.hospitalizacion?.vacunas_aplicadas || []).map((v: any) => ({ ...v, origen: 'Hospitalización', veterinario: h.veterinario }));
    return [...vacsHistorial, ...vacsHosp];
  });

  // Extraer todos los archivos adjuntos
  const todosArchivos = historiales.flatMap(h => {
    const archsHistorial = (h.archivos_adjuntos || []).map((a: any) => ({ ...a, origen: 'Consulta', fecha: h.fecha_consulta }));
    const archsHosp = (h.hospitalizacion?.archivos || []).map((a: any) => ({ ...a, origen: 'Hospitalización', fecha: h.hospitalizacion?.fecha_ingreso }));
    return [...archsHistorial, ...archsHosp];
  });

  return (
    <>
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* BOTÓN VOLVER */}
      <div>
        <Button variant="ghost" asChild className="mb-4 text-muted-foreground hover:text-primary rounded-xl -ml-4">
          <Link href="/vet/expedientes">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Directorio
          </Link>
        </Button>

        {/* CABECERA CON ALERTA GLOBAL INTEGRADA */}
        <div className="border border-border/40 p-6 rounded-3xl bg-card/40 backdrop-blur-md shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1">
            <Avatar className="h-20 w-20 border-4 border-background shadow-md shrink-0">
              <AvatarImage src={mascota?.foto_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${mascota?.nombre || 'Pet'}`} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {mascota?.nombre?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-foreground">{mascota?.nombre}</h1>
                <Badge variant="secondary" className="font-mono bg-muted/50">{mascota?.hash_qr_identidad || 'Sin QR'}</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                <User className="inline h-4 w-4 mr-1 mb-0.5" /> 
                Propietario: <strong className="text-foreground">{mascota?.dueno?.nombres} {mascota?.dueno?.apellidos}</strong>
              </p>
              <div className="flex gap-2 text-[11px] font-bold text-muted-foreground pt-1 flex-wrap">
                <span className="bg-background/60 px-2 py-0.5 rounded border border-border/40">{mascota?.raza?.especie?.nombre}</span>
                <span className="bg-background/60 px-2 py-0.5 rounded border border-border/40">{mascota?.raza?.nombre}</span>
                <span className="bg-background/60 px-2 py-0.5 rounded border border-border/40">{mascota?.sexo === 'M' ? 'Macho' : 'Hembra'}</span>
              </div>
            </div>
          </div>

          {/* 👇 AQUÍ SE MUESTRAN LAS NOTAS GENERALES COMO ALERTA PERSISTENTE */}
          {expediente?.notas_generales && expediente.notas_generales !== "Apertura inicial de expediente clínico." && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl max-w-md w-full lg:w-auto shadow-inner">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="block font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Alertas y Observaciones Médicas</span>
                <p className="font-semibold leading-relaxed">{expediente.notas_generales}</p>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="shrink-0 w-full lg:w-auto">
              <Button asChild size="lg" className="w-full lg:w-auto rounded-2xl font-bold shadow-md" disabled={noTieneExpediente}>
                <Link href={noTieneExpediente ? "#" : `/vet/consulta/nueva?mascota=${id}`}>
                  <Plus className="h-5 w-5 mr-2" /> Nueva Consulta
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl items-center font-semibold text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Modo Auditor: Detalles de diagnóstico y recetas sensibles están ofuscados por política de privacidad.</span>
        </div>
      )}

      {/* ÁREA DE CONTENIDO */}
      {noTieneExpediente ? (
        <Card className="rounded-3xl border-border/50 shadow-sm bg-card/25 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-5 bg-primary/10 rounded-full mb-6"><FileText className="h-16 w-16 text-primary" /></div>
            <h2 className="text-2xl font-black text-foreground mb-2">Expediente No Inicializado</h2>
            <p className="text-muted-foreground max-w-md mb-8">Esta mascota está registrada en el padrón, pero no tiene un expediente clínico abierto todavía.</p>
            <Button size="lg" className="rounded-2xl font-bold px-8 shadow-md" onClick={() => createExpedienteMutation.mutate()} disabled={createExpedienteMutation.isPending || isAdmin}>
              {createExpedienteMutation.isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin"/> : <FolderOpen className="h-5 w-5 mr-2"/>}
              Aperturar Expediente Médico
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="timeline" className="w-full">
          {/* 👇 OPTIMIZADO A 3 COLUMNAS LÍMPIAS */}
          <TabsList className="grid grid-cols-3 w-full lg:w-[450px] mb-6 rounded-2xl bg-muted/20 p-1">
            <TabsTrigger value="timeline" className="rounded-xl font-bold"><Activity className="w-4 h-4 mr-2"/> Timeline</TabsTrigger>
            <TabsTrigger value="vacunas" className="rounded-xl font-bold"><Syringe className="w-4 h-4 mr-2"/> Vacunas</TabsTrigger>
            <TabsTrigger value="archivos" className="rounded-xl font-bold"><Paperclip className="w-4 h-4 mr-2"/> Archivos</TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: TIMELINE DE HISTORIALES */}
          <TabsContent value="timeline" className="space-y-6">
            {historiales.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground bg-card/20 rounded-3xl border border-border/40">
                <Stethoscope className="h-12 w-12 mx-auto opacity-20 mb-3"/>
                <p className="font-semibold">El expediente está limpio.</p>
                <p className="text-sm">No se han registrado consultas médicas todavía.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/30 ml-4 pl-8 space-y-10">
                {historiales.map((h: any) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[41px] top-4 h-5 w-5 rounded-full bg-primary border-4 border-background shadow-sm" />
                    
                    <Card className="rounded-3xl border-border/40 shadow-sm bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3 border-b border-border/20 bg-muted/10 p-5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-primary/20 text-primary border-0 font-black">{safeDateString(h.fecha_consulta)}</Badge>
                              <Badge variant="outline" className="font-bold">{h.tipo_atencion}</Badge>
                            </div>
                            <CardTitle className="text-xl font-black text-foreground">{h.motivo_consulta}</CardTitle>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-card-foreground">Dr(a). {h.veterinario?.apellidos}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">Estado: {h.estado}</p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-5 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Peso</span>
                            <p className="font-black text-foreground mt-1">{h.peso_actual_kg} kg</p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Temp</span>
                            <p className="font-black text-foreground mt-1">{h.temperatura_c} °C</p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">F. Cardíaca</span>
                            <p className="font-black text-foreground mt-1">{h.frecuencia_cardiaca} lpm</p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">F. Resp</span>
                            <p className="font-black text-foreground mt-1">{h.frecuencia_respiratoria} rpm</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {!isAdmin && h.sintomas && (
                            <div>
                              <span className="text-xs font-black uppercase text-muted-foreground tracking-wider block mb-1">Síntomas Reportados</span>
                              <p className="text-sm leading-relaxed text-card-foreground">{h.sintomas}</p>
                            </div>
                          )}
                          {!isAdmin && (
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                              <span className="text-xs font-black uppercase text-primary tracking-wider block mb-1">Diagnóstico Médico</span>
                              <p className="text-sm font-semibold leading-relaxed">{h.diagnostico}</p>
                            </div>
                          )}
                          {isAdmin && (
                            <div className="bg-muted p-3 rounded-xl border border-border/40 text-xs text-muted-foreground italic flex items-center">
                              <ShieldAlert className="w-4 h-4 mr-2"/> Detalles clínicos protegidos en vista de Auditoría.
                            </div>
                          )}
                        </div>

                        {/* Hospitalización Anidada */}
                        {h.hospitalizacion && (
                          <div className="mt-6 border-2 border-rose-500/20 bg-rose-500/5 rounded-3xl overflow-hidden">
                            <div className="bg-rose-500/10 px-5 py-3 border-b border-rose-500/20 flex items-center gap-2">
                              <BedDouble className="w-5 h-5 text-rose-600" />
                              <h4 className="font-black text-rose-700">Derivación a Hospitalización</h4>
                              <Badge className="ml-auto bg-rose-600 hover:bg-rose-700">{h.hospitalizacion.estado_actual}</Badge>
                            </div>
                            <div className="p-5 space-y-3">
                              <p className="text-sm"><strong>Motivo de Ingreso:</strong> {h.hospitalizacion.motivo_ingreso}</p>
                              <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                                <span>Ingreso: {safeDateString(h.hospitalizacion.fecha_ingreso)}</span>
                                {h.hospitalizacion.fecha_alta && <span>Alta: {safeDateString(h.hospitalizacion.fecha_alta)}</span>}
                              </div>
                              
                              {h.hospitalizacion.insumos?.length > 0 && (
                                <div className="pt-3 border-t border-rose-500/10">
                                  <span className="text-[10px] font-bold uppercase text-rose-600 block mb-2">Insumos y Servicios Utilizados</span>
                                  <div className="flex flex-wrap gap-2">
                                    {h.hospitalizacion.insumos.map((ins: any) => (
                                      <Badge key={ins.id} variant="outline" className="bg-background/50 text-xs">
                                        {ins.cantidad}x {ins.nombre_item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recetas */}
                        {!isAdmin && h.recetas && h.recetas.length > 0 && (
                          <div className="pt-4 border-t border-border/30">
                            <span className="text-[10px] font-black uppercase text-muted-foreground block mb-2">Recetas Emitidas</span>
                            {h.recetas.map((receta: any) => (
                              <div key={receta.id} className="mb-3">
                                <ul className="text-sm space-y-1 list-disc pl-4 marker:text-primary mb-2">
                                  {(receta.detalles || []).map((det: any) => (
                                    <li key={det.id}>{det.producto?.nombre || det.medicamento_texto} - {det.dosis} ({det.frecuencia})</li>
                                  ))}
                                </ul>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl text-xs h-8 gap-1.5"
                                  disabled={loadingPdf}
                                  onClick={() => openPdf(`/recetas/${receta.id}/pdf`, `Receta-${receta.id.slice(-6).toUpperCase()}.pdf`)}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  {loadingPdf ? "Cargando..." : "Ver Receta PDF"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PESTAÑA 2: VACUNAS HISTÓRICAS */}
          <TabsContent value="vacunas">
            <Card className="rounded-3xl border-border/40 shadow-sm bg-card/25 backdrop-blur-md overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/30">
                <CardTitle className="flex items-center gap-2"><Syringe className="w-5 h-5 text-primary"/> Registro Global de Inmunización</CardTitle>
                <CardDescription>Vacunas aplicadas en consultas y hospitalizaciones.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {todasVacunas.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No hay registro de vacunas aplicadas.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/5 border-b border-border/20 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-4 font-bold">Vacuna</th>
                        <th className="p-4 font-bold">Fecha</th>
                        <th className="p-4 font-bold">Próxima Dosis</th>
                        <th className="p-4 font-bold">Aplicada En</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {todasVacunas.map((v: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/5">
                          <td className="p-4 font-bold text-primary">{v.vacuna?.nombre || v.nombre_vacuna || 'Inmunización'}</td>
                          <td className="p-4 font-mono">{safeDateString(v.fecha_aplicacion)}</td>
                          <td className="p-4 font-mono">{v.fecha_proxima_dosis ? safeDateString(v.fecha_proxima_dosis) : 'N/A'}</td>
                          <td className="p-4"><Badge variant="outline">{v.origen}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 3: ARCHIVOS ADJUNTOS */}
          <TabsContent value="archivos">
            <Card className="rounded-3xl border-border/40 shadow-sm bg-card/25 backdrop-blur-md">
              <CardHeader className="bg-muted/10 border-b border-border/30">
                <CardTitle className="flex items-center gap-2"><Paperclip className="w-5 h-5 text-primary"/> Repositorio de Estudios</CardTitle>
                <CardDescription>Todos los documentos anexados a lo largo del historial del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {todosArchivos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No hay documentos ni estudios adjuntos.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todosArchivos.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-4 border border-border/50 rounded-2xl bg-background/50 hover:border-primary/50 transition-colors">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0"><FileText className="w-6 h-6" /></div>
                        <div className="overflow-hidden flex-1">
                          <p className="font-bold text-sm truncate">{a.nombre_archivo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.tipo_estudio} • {safeDateString(a.fecha)}</p>
                        </div>
                        <Button variant="ghost" size="icon" asChild className="shrink-0 hover:bg-primary/10 hover:text-primary">
                          <a href={a.url_archivo} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      )}
    </div>

    {/* VISOR PDF — Portal global */}
    {pdf && (
      <FileViewer
        url={pdf.url}
        nombre={pdf.nombre}
        tipo="application/pdf"
        onClose={closePdf}
      />
    )}
  </>
  );
}