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
  CheckCircle,
  Camera,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { AlertTriangle } from "lucide-react";
import api from "@/shared/lib/axios";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { FileDropzone } from "@/domains/clinical/components/file-dropzone";
import { historialClinicoService } from "@/domains/clinical/services/historial-clinico.service";
import { ZoosanitarioPanel } from "@/domains/clinical/components/ZoosanitarioPanel";

// Servicios
import { expedientesService } from "@/domains/clinical/services/expedientes.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";

const safeDateString = (dateVal: any): string => {
  if (!dateVal) return "—";
  try {
    if (typeof dateVal === 'string' && dateVal.length === 10 && dateVal.includes('-')) {
      const [year, month, day] = dateVal.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    const hasTime = typeof dateVal === 'string' ? dateVal.includes('T') || dateVal.includes(':') : true;
    if (hasTime) {
      return d.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    return "—";
  }
};

export default function DetalleExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;
  const { pdf, loading: loadingPdf, openPdf, closePdf } = usePdfViewer();

  // --- ESTADOS PARA SEGUIMIENTOS Y INFORMES ---
  const [isSeguimientoOpen, setIsSeguimientoOpen] = useState(false);
  const [isInformeOpen, setIsInformeOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  // Form Seguimiento
  const [segMotivo, setSegMotivo] = useState("");
  const [segSintomas, setSegSintomas] = useState("");
  const [segObservaciones, setSegObservaciones] = useState("");
  const [segTratamiento, setSegTratamiento] = useState("");
  const [segDiagnostico, setSegDiagnostico] = useState("");
  const [segRecomendaciones, setSegRecomendaciones] = useState("");
  const [segPeso, setSegPeso] = useState("");
  const [segTemperatura, setSegTemperatura] = useState("");
  const [segFc, setSegFc] = useState("");
  const [segFr, setSegFr] = useState("");
  const [segMucosas, setSegMucosas] = useState("");

  // Form Informe
  const [infTipo, setInfTipo] = useState<"ECOGRAFIA" | "RADIOGRAFIA" | "LABORATORIO" | "CITOLOGIA" | "HISTOPATOLOGIA" | "ELECTROCARDIOGRAMA" | "OTRO">("ECOGRAFIA");
  const [infTitulo, setInfTitulo] = useState("");
  const [infComentario, setInfComentario] = useState("");
  const [infConclusion, setInfConclusion] = useState("");
  const [infRecomendaciones, setInfRecomendaciones] = useState("");
  const [infImagenes, setInfImagenes] = useState<string[]>([]);
  const [infFiles, setInfFiles] = useState<any[]>([]);

  // Visualizador de Imágenes de Informe
  const [selectedReportImages, setSelectedReportImages] = useState<string[]>([]);
  const [selectedReportTitle, setSelectedReportTitle] = useState("");
  const [isReportImagesOpen, setIsReportImagesOpen] = useState(false);

  // Subiendo informe
  const [submittingSeguimiento, setSubmittingSeguimiento] = useState(false);
  const [submittingInforme, setSubmittingInforme] = useState(false);

  // Helper para descargar PDFs
  const downloadPdf = async (url: string, filename: string) => {
    const toastId = toast.loading("Generando y descargando PDF...");
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
      toast.success("PDF descargado exitosamente", { id: toastId });
    } catch (e) {
      toast.error("Error al descargar el PDF", { id: toastId });
    }
  };

  const handleCreateSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segMotivo) return toast.error("El motivo de consulta/seguimiento es obligatorio");

    setSubmittingSeguimiento(true);
    try {
      const payload = {
        id_historial_clinico_fk: selectedConsultationId,
        motivo: segMotivo,
        sintomas: segSintomas || null,
        observaciones: segObservaciones || null,
        tratamiento: segTratamiento || null,
        diagnostico_actual: segDiagnostico || null,
        recomendaciones: segRecomendaciones || null,
        peso_kg: segPeso ? parseFloat(segPeso) : null,
        temperatura_c: segTemperatura ? parseFloat(segTemperatura) : null,
        frecuencia_cardiaca: segFc ? parseInt(segFc, 10) : null,
        frecuencia_respiratoria: segFr ? parseInt(segFr, 10) : null,
        mucosas: segMucosas || null,
      };

      await historialClinicoService.crearSeguimiento(payload);
      toast.success("Seguimiento registrado exitosamente");
      setIsSeguimientoOpen(false);
      refetchExpediente();
      
      // Limpiar form
      setSegMotivo("");
      setSegSintomas("");
      setSegObservaciones("");
      setSegTratamiento("");
      setSegDiagnostico("");
      setSegRecomendaciones("");
      setSegPeso("");
      setSegTemperatura("");
      setSegFc("");
      setSegFr("");
      setSegMucosas("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error al crear el seguimiento clínico");
    } finally {
      setSubmittingSeguimiento(false);
    }
  };

  const handleCreateInforme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infTitulo) return toast.error("El título del estudio/informe es obligatorio");

    setSubmittingInforme(true);
    try {
      const payload = {
        id_mascota_fk: id,
        id_historial_fk: selectedConsultationId || undefined,
        tipo: infTipo,
        titulo: infTitulo,
        comentario_clinico: infComentario || null,
        conclusion: infConclusion || null,
        recomendaciones: infRecomendaciones || null,
        imagenes: infImagenes.length > 0 ? infImagenes : [],
        estado: "FINALIZADO",
      };

      await historialClinicoService.crearInforme(payload);
      toast.success("Informe de diagnóstico registrado exitosamente");
      setIsInformeOpen(false);
      refetchExpediente();

      // Limpiar form
      setInfTitulo("");
      setInfComentario("");
      setInfConclusion("");
      setInfRecomendaciones("");
      setInfImagenes([]);
      setInfFiles([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error al registrar el informe de diagnóstico");
    } finally {
      setSubmittingInforme(false);
    }
  };

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

  const historiales = expediente?.historiales || [];
  
  // Construir timeline unificado
  const timelineEvents = React.useMemo(() => {
    const events: any[] = [];
    for (const h of historiales) {
      // 1. Consulta
      events.push({
        id: h.id,
        tipo: "CONSULTA",
        fecha: new Date(h.fecha_consulta),
        titulo: "Atención de Consulta",
        veterinario: h.veterinario,
        data: h,
      });

      // 2. Vacunas/Desparasitaciones
      if (h.vacunas_aplicadas) {
        for (const v of h.vacunas_aplicadas) {
          const isDesparasitacion = v.vacuna?.nombre?.toLowerCase().includes("parasit") || v.vacuna?.nombre?.toLowerCase().includes("despar") || v.vacuna?.nombre?.toLowerCase().includes("antiparasitario");
          events.push({
            id: v.id,
            tipo: isDesparasitacion ? "DESPARASITACION" : "VACUNACION",
            fecha: new Date(v.fecha_aplicacion),
            titulo: isDesparasitacion ? "Aplicación de Antiparasitario" : "Inoculación de Vacuna",
            veterinario: h.veterinario,
            data: v,
          });
        }
      }

      // 3. Hospitalización
      if (h.hospitalizacion) {
        events.push({
          id: h.hospitalizacion.id,
          tipo: "HOSPITALIZACION",
          fecha: new Date(h.hospitalizacion.fecha_ingreso),
          titulo: "Ingreso a Hospitalización",
          veterinario: h.veterinario,
          data: h.hospitalizacion,
        });
      }

      // 4. Seguimientos
      if (h.seguimientos) {
        for (const s of h.seguimientos) {
          events.push({
            id: s.id,
            tipo: "SEGUIMIENTO",
            fecha: new Date(s.fecha + 'T' + (s.hora || '12:00:00')),
            titulo: "Seguimiento Clínico",
            veterinario: s.veterinario || h.veterinario,
            data: s,
          });
        }
      }

      // 5. Informes
      if (h.informes) {
        for (const inf of h.informes) {
          events.push({
            id: inf.id,
            tipo: "INFORME",
            fecha: new Date(inf.fecha),
            titulo: `Informe Diagnóstico: ${inf.titulo}`,
            veterinario: inf.veterinario || h.veterinario,
            data: inf,
          });
        }
      }
    }

    // Ordenar descendente
    return events.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [historiales]);

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
          <Link href="/vet/expediente">
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
            <TabsTrigger value="zoosanitario" className="rounded-xl font-bold"><ShieldAlert className="w-4 h-4 mr-2"/> Zoosanitario</TabsTrigger>
            <TabsTrigger value="archivos" className="rounded-xl font-bold"><Paperclip className="w-4 h-4 mr-2"/> Archivos</TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: TIMELINE DE HISTORIALES */}
          <TabsContent value="timeline" className="space-y-6">
            {timelineEvents.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground bg-card/20 rounded-3xl border border-border/40">
                <Stethoscope className="h-12 w-12 mx-auto opacity-20 mb-3"/>
                <p className="font-semibold">El expediente está limpio.</p>
                <p className="text-sm">No se han registrado eventos médicos todavía.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/30 ml-4 pl-8 space-y-10">
                {timelineEvents.map((event: any, eventIdx: number) => {
                  const evId = event.id;
                  const dateStr = safeDateString(event.fecha);
                  const vetName = event.veterinario ? `Dr(a). ${event.veterinario.nombres} ${event.veterinario.apellidos}` : "Veterinario";

                  // Render color-coded bullet point
                  let bulletColor = "bg-primary";
                  if (event.tipo === "SEGUIMIENTO") bulletColor = "bg-indigo-500";
                  if (event.tipo === "INFORME") bulletColor = "bg-purple-500";
                  if (event.tipo === "HOSPITALIZACION") bulletColor = "bg-rose-500";
                  if (event.tipo === "VACUNACION") bulletColor = "bg-teal-500";
                  if (event.tipo === "DESPARASITACION") bulletColor = "bg-emerald-500";

                  return (
                    <div key={`${event.tipo}-${evId}-${eventIdx}`} className="relative">
                      <div className={`absolute -left-[41px] top-4 h-5 w-5 rounded-full ${bulletColor} border-4 border-background shadow-sm`} />

                      {/* --- CARD CONSULTA --- */}
                      {event.tipo === "CONSULTA" && (() => {
                        const h = event.data;
                        const getInformeForExamen = (tipoExamen: string) => {
                          return timelineEvents.find(
                            ev => ev.tipo === "INFORME" &&
                                  ev.data.id_historial_fk === h.id &&
                                  ev.data.tipo === tipoExamen
                          );
                        };

                        return (
                          <Card className="rounded-3xl border-border/40 shadow-sm bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-3 border-b border-border/20 bg-muted/10 p-5">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div>
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <Badge className="bg-primary/20 text-primary border-0 font-black">{dateStr}</Badge>
                                    <Badge variant="outline" className="font-bold">{h.tipo_atencion || 'Consulta'}</Badge>
                                    {h.estado === 'BORRADOR' ? (
                                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">BORRADOR</Badge>
                                    ) : (
                                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-bold">FINALIZADA</Badge>
                                    )}
                                  </div>
                                  <CardTitle className="text-xl font-black text-foreground">{h.motivo_consulta}</CardTitle>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-sm font-bold text-card-foreground">{vetName}</p>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="p-5 space-y-6">
                              {h.estado === 'BORRADOR' && (
                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-2">
                                  <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 shrink-0" /> Atención en Borrador</p>
                                  <p>Esta consulta no ha sido finalizada aún. El veterinario debe completar la atención clínica para registrar recetas e informes definitivos.</p>
                                  {!isAdmin && (
                                    <Button asChild size="sm" className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white">
                                      <Link href={`/vet/consulta/${h.id_cita_fk || h.id}`}>
                                        Continuar Consulta
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Peso</span>
                                  <p className="font-black text-foreground mt-1">{h.peso_actual_kg} kg</p>
                                </div>
                                <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Temp</span>
                                  <p className="font-black text-foreground mt-1">{h.temperatura_c ? `${h.temperatura_c} °C` : "N/A"}</p>
                                </div>
                                <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">F. Cardíaca</span>
                                  <p className="font-black text-foreground mt-1">{h.frecuencia_cardiaca ? `${h.frecuencia_cardiaca} lpm` : "N/A"}</p>
                                </div>
                                <div className="bg-background/50 p-3 rounded-2xl border border-border/40 text-center">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">F. Resp</span>
                                  <p className="font-black text-foreground mt-1">{h.frecuencia_respiratoria ? `${h.frecuencia_respiratoria} rpm` : "N/A"}</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {!isAdmin && (
                                  <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-3 rounded-2xl border border-border/10 mb-2">
                                    {h.turno && <div><span className="text-muted-foreground block font-bold">Turno:</span> <span className="font-semibold">{h.turno}</span></div>}
                                    {h.mucosas && <div><span className="text-muted-foreground block font-bold">Mucosas:</span> <span className="font-semibold">{h.mucosas}</span></div>}
                                  </div>
                                )}
                                {!isAdmin && h.anamnesis && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-muted-foreground tracking-wider block mb-1">Anamnesis</span>
                                    <p className="text-sm leading-relaxed text-card-foreground bg-muted/10 p-3 rounded-2xl border border-border/20">{h.anamnesis}</p>
                                  </div>
                                )}
                                {!isAdmin && h.sintomas && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-muted-foreground tracking-wider block mb-1">Síntomas Reportados</span>
                                    <p className="text-sm leading-relaxed text-card-foreground">{h.sintomas}</p>
                                  </div>
                                )}
                                {!isAdmin && (
                                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                    <span className="text-xs font-black uppercase text-primary tracking-wider block mb-1">Diagnóstico Clínico</span>
                                    <p className="text-sm font-semibold leading-relaxed">{h.diagnostico || 'Evaluación general'}</p>
                                  </div>
                                )}

                                {/* EXÁMENES COMPLEMENTARIOS SOLICITADOS / INFORMES */}
                                {!isAdmin && (h.exam_ecografia || h.exam_rayos_x || h.exam_hemograma || h.exam_quimica_sanguinea || h.exam_otros) && (
                                  <div className="space-y-3 bg-muted/5 p-4 rounded-2xl border border-border/30 mt-3">
                                    <span className="text-xs font-black uppercase text-muted-foreground tracking-wider block">Exámenes Solicitados & Informes</span>
                                    <div className="space-y-2">
                                      {/* Ecografía */}
                                      {h.exam_ecografia && (() => {
                                        const rpt = getInformeForExamen('ECOGRAFIA');
                                        return (
                                          <div className="flex items-center justify-between p-2 bg-background/50 border rounded-xl">
                                            <span className="text-xs font-bold text-foreground">Ecografía</span>
                                            {rpt ? (
                                              <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-bold">Realizado</Badge>
                                            ) : (
                                              <div className="flex items-center gap-1">
                                                <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold mr-1">Pendiente</Badge>
                                                {h.estado === 'FINALIZADA' && (
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      setSelectedConsultationId(h.id);
                                                      setInfTipo('ECOGRAFIA');
                                                      setInfTitulo(`Informe de Ecografía - ${mascota?.nombre}`);
                                                      setIsInformeOpen(true);
                                                    }}
                                                    className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg px-2"
                                                  >
                                                    + Registrar Informe
                                                  </Button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Rayos X */}
                                      {h.exam_rayos_x && (() => {
                                        const rpt = getInformeForExamen('RADIOGRAFIA');
                                        return (
                                          <div className="flex items-center justify-between p-2 bg-background/50 border rounded-xl">
                                            <span className="text-xs font-bold text-foreground">Estudio Rayos X (RX)</span>
                                            {rpt ? (
                                              <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-bold">Realizado</Badge>
                                            ) : (
                                              <div className="flex items-center gap-1">
                                                <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold mr-1">Pendiente</Badge>
                                                {h.estado === 'FINALIZADA' && (
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      setSelectedConsultationId(h.id);
                                                      setInfTipo('RADIOGRAFIA');
                                                      setInfTitulo(`Informe de Radiografía (RX) - ${mascota?.nombre}`);
                                                      setIsInformeOpen(true);
                                                    }}
                                                    className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg px-2"
                                                  >
                                                    + Registrar Informe
                                                  </Button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Laboratorio */}
                                      {(h.exam_hemograma || h.exam_quimica_sanguinea) && (() => {
                                        const rpt = getInformeForExamen('LABORATORIO');
                                        const lbl = [h.exam_hemograma && "Hemograma", h.exam_quimica_sanguinea && "Química Sanguínea"].filter(Boolean).join(" / ");
                                        return (
                                          <div className="flex items-center justify-between p-2 bg-background/50 border rounded-xl">
                                            <span className="text-xs font-bold text-foreground">Análisis de Laboratorio ({lbl})</span>
                                            {rpt ? (
                                              <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-bold">Realizado</Badge>
                                            ) : (
                                              <div className="flex items-center gap-1">
                                                <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold mr-1">Pendiente</Badge>
                                                {h.estado === 'FINALIZADA' && (
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      setSelectedConsultationId(h.id);
                                                      setInfTipo('LABORATORIO');
                                                      setInfTitulo(`Informe de Laboratorio - ${mascota?.nombre}`);
                                                      setIsInformeOpen(true);
                                                    }}
                                                    className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg px-2"
                                                  >
                                                    + Registrar Informe
                                                  </Button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>

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
                                        onClick={() => downloadPdf(`/recetas/${receta.id}/pdf`, `Receta_${mascota?.nombre}_${receta.id.slice(-6).toUpperCase()}.pdf`)}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Descargar Receta PDF
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!isAdmin && h.estado === 'FINALIZADA' && (
                                <div className="pt-4 border-t border-border/30 mt-4 flex flex-wrap gap-3 items-center">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-xl text-xs h-8 gap-1.5 font-bold"
                                    onClick={() => downloadPdf(`/historial-clinico/${h.id}/pdf`, `Ficha-Clinica-${h.id.slice(-6).toUpperCase()}.pdf`)}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar Ficha Clínica PDF
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs h-8 gap-1.5 font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                                    onClick={() => {
                                      setSelectedConsultationId(h.id);
                                      setIsSeguimientoOpen(true);
                                    }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Registrar Control / Evolución
                                  </Button>
                                </div>
                              )}

                              {!isAdmin && h.estado === 'BORRADOR' && (
                                <div className="pt-4 border-t border-border/30 mt-4 flex flex-wrap gap-3 items-center">
                                  {h.cita?.id ? (
                                    <Button
                                      asChild
                                      variant="default"
                                      size="sm"
                                      className="rounded-xl text-xs h-8 gap-1.5 font-bold bg-amber-500 hover:bg-amber-600 text-white border-0"
                                    >
                                      <Link href={`/vet/consulta/${h.cita.id}`}>
                                        <Stethoscope className="w-3.5 h-3.5" />
                                        Retomar Consulta (Borrador)
                                      </Link>
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Borrador sin cita vinculada</span>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* --- CARD SEGUIMIENTO --- */}
                      {event.tipo === "SEGUIMIENTO" && (() => {
                        const s = event.data;
                        return (
                          <Card className="rounded-3xl border-indigo-200/50 dark:border-indigo-900/30 shadow-sm bg-indigo-500/5 backdrop-blur-sm overflow-hidden hover:border-indigo-400 transition-colors">
                            <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-950 bg-indigo-500/10 p-5">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div>
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <Badge className="bg-indigo-500 text-white border-0 font-black">{dateStr}</Badge>
                                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:text-indigo-400 font-bold">Control Clínico</Badge>
                                  </div>
                                  <CardTitle className="text-xl font-black text-indigo-950 dark:text-indigo-200">{s.motivo}</CardTitle>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{vetName}</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {s.peso_kg && (
                                  <div className="bg-background/50 p-3 rounded-2xl border border-indigo-100 text-center">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Peso</span>
                                    <p className="font-black text-foreground mt-1">{s.peso_kg} kg</p>
                                  </div>
                                )}
                                {s.temperatura_c && (
                                  <div className="bg-background/50 p-3 rounded-2xl border border-indigo-100 text-center">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Temp</span>
                                    <p className="font-black text-foreground mt-1">{s.temperatura_c} °C</p>
                                  </div>
                                )}
                                {s.frecuencia_cardiaca && (
                                  <div className="bg-background/50 p-3 rounded-2xl border border-indigo-100 text-center">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">FC</span>
                                    <p className="font-black text-foreground mt-1">{s.frecuencia_cardiaca} lpm</p>
                                  </div>
                                )}
                                {s.frecuencia_respiratoria && (
                                  <div className="bg-background/50 p-3 rounded-2xl border border-indigo-100 text-center">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">FR</span>
                                    <p className="font-black text-foreground mt-1">{s.frecuencia_respiratoria} rpm</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {s.sintomas && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-indigo-600/80 block mb-0.5">Síntomas Actuales</span>
                                    <p className="text-sm leading-relaxed text-card-foreground">{s.sintomas}</p>
                                  </div>
                                )}
                                {s.observaciones && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-indigo-600/80 block mb-0.5">Observaciones</span>
                                    <p className="text-sm leading-relaxed text-card-foreground">{s.observaciones}</p>
                                  </div>
                                )}
                                {s.diagnostico_actual && (
                                  <div className="bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-200/50">
                                    <span className="text-xs font-black uppercase text-indigo-700 block mb-0.5">Diagnóstico del Control</span>
                                    <p className="text-sm font-semibold leading-relaxed">{s.diagnostico_actual}</p>
                                  </div>
                                )}
                                {s.tratamiento && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-indigo-600/80 block mb-0.5">Tratamiento Indicado</span>
                                    <p className="text-sm leading-relaxed text-card-foreground">{s.tratamiento}</p>
                                  </div>
                                )}
                                {s.recomendaciones && (
                                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                                    <span className="text-xs font-black uppercase text-amber-700 block mb-0.5">Indicaciones de Cuidado</span>
                                    <p className="text-xs text-muted-foreground">{s.recomendaciones}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* --- CARD INFORME --- */}
                      {event.tipo === "INFORME" && (() => {
                        const inf = event.data;
                        return (
                          <Card className="rounded-3xl border-purple-200/50 dark:border-purple-900/30 shadow-sm bg-purple-500/5 backdrop-blur-sm overflow-hidden hover:border-purple-400 transition-colors">
                            <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-950 bg-purple-500/10 p-5">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div>
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <Badge className="bg-purple-500 text-white border-0 font-black">{dateStr}</Badge>
                                    <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-400 font-bold">{inf.tipo}</Badge>
                                  </div>
                                  <CardTitle className="text-xl font-black text-purple-950 dark:text-purple-200">{inf.titulo}</CardTitle>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-sm font-bold text-purple-900 dark:text-purple-300">{vetName}</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                              <div className="space-y-3">
                                {inf.comentario_clinico && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-purple-600/80 block mb-0.5">Hallazgos Clínicos</span>
                                    <p className="text-sm leading-relaxed text-card-foreground">{inf.comentario_clinico}</p>
                                  </div>
                                )}
                                {inf.conclusion && (
                                  <div className="bg-purple-500/10 p-3.5 rounded-2xl border border-purple-200/50">
                                    <span className="text-xs font-black uppercase text-purple-700 block mb-0.5">Conclusiones del Estudio</span>
                                    <p className="text-sm font-semibold leading-relaxed">{inf.conclusion}</p>
                                  </div>
                                )}
                                {inf.recomendaciones && (
                                  <div>
                                    <span className="text-xs font-black uppercase text-purple-600/80 block mb-0.5">Recomendaciones</span>
                                    <p className="text-sm leading-relaxed text-card-foreground">{inf.recomendaciones}</p>
                                  </div>
                                )}

                                {/* Galería de imágenes */}
                                {inf.imagenes && inf.imagenes.length > 0 && (
                                  <div className="pt-2 flex flex-col gap-2">
                                    <div className="flex items-center">
                                      <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border-0 text-xs py-1 px-2.5">
                                        <Camera className="w-3.5 h-3.5 mr-1.5 inline-block" />
                                        {inf.imagenes.length} {inf.imagenes.length === 1 ? 'imagen' : 'imágenes'} adjuntas
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {inf.imagenes.map((url: string, imgIdx: number) => (
                                        <Button
                                          key={imgIdx}
                                          variant="outline"
                                          size="sm"
                                          className="rounded-xl text-[11px] h-7 gap-1.5 font-semibold border-purple-200 text-purple-700 hover:bg-purple-50"
                                          onClick={() => {
                                            setSelectedReportImages([url]);
                                            setSelectedReportTitle(`${inf.titulo} - Imagen ${imgIdx + 1}`);
                                            setIsReportImagesOpen(true);
                                          }}
                                        >
                                          👁️ Ver Imagen {imgIdx + 1}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Botón descarga informe */}
                                <div className="pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs h-8 gap-1.5 font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
                                    onClick={() => downloadPdf(`/informes-clinicos/${inf.id}/pdf`, `Informe_${inf.titulo.replace(/\s+/g, '_')}.pdf`)}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar Informe PDF
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* --- CARD HOSPITALIZACION --- */}
                      {event.tipo === "HOSPITALIZACION" && (() => {
                        const hosp = event.data;
                        return (
                          <Card className="rounded-3xl border-rose-200/50 dark:border-rose-900/30 shadow-sm bg-rose-500/5 backdrop-blur-sm overflow-hidden hover:border-rose-400 transition-colors">
                            <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-950 bg-rose-500/10 p-5">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div>
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <Badge className="bg-rose-500 text-white border-0 font-black">{dateStr}</Badge>
                                    <Badge variant="outline" className="border-rose-300 text-rose-700 dark:text-rose-400 font-bold">Hospitalización</Badge>
                                    <Badge className="bg-rose-600 hover:bg-rose-700">{hosp.estado_actual}</Badge>
                                  </div>
                                  <CardTitle className="text-xl font-black text-rose-950 dark:text-rose-200">{hosp.motivo_ingreso}</CardTitle>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-xs text-muted-foreground font-mono">Costo por día: {hosp.costo_por_dia} Bs.</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                              <div className="text-sm space-y-1.5">
                                <p><strong>Ingreso:</strong> {safeDateString(hosp.fecha_ingreso)}</p>
                                {hosp.fecha_alta && <p><strong>Alta:</strong> {safeDateString(hosp.fecha_alta)}</p>}
                              </div>

                              {hosp.articulos?.length > 0 && (
                                <div className="pt-2 border-t border-rose-500/10">
                                  <span className="text-[10px] font-bold uppercase text-rose-600 block mb-2">Artículos y Elementos de Ingreso</span>
                                  <div className="flex flex-wrap gap-2">
                                    {hosp.articulos.map((art: any) => (
                                      <Badge key={art.id} variant="outline" className="bg-background/50 text-xs py-1 rounded-xl">
                                        {art.cantidad}x {art.descripcion} {art.observacion ? `(${art.observacion})` : ''}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* --- CARD VACUNACIÓN / DESPARASITACIÓN --- */}
                      {(event.tipo === "VACUNACION" || event.tipo === "DESPARASITACION") && (() => {
                        const v = event.data;
                        const isVac = event.tipo === "VACUNACION";
                        return (
                          <Card className={`rounded-3xl border-border/40 shadow-sm ${isVac ? 'bg-teal-500/5 hover:border-teal-400' : 'bg-emerald-500/5 hover:border-emerald-400'} backdrop-blur-sm overflow-hidden transition-colors`}>
                            <CardContent className="p-5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${isVac ? 'bg-teal-500/10 text-teal-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                  <Syringe className="h-6 w-6" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge className={`${isVac ? 'bg-teal-500' : 'bg-emerald-500'} text-white border-0 font-bold text-[10px]`}>{dateStr}</Badge>
                                    <Badge variant="outline" className={`text-[10px] font-black ${isVac ? 'border-teal-200 text-teal-700' : 'border-emerald-200 text-emerald-700'}`}>
                                      {isVac ? "Vacuna Aplicada" : "Antiparasitario"}
                                    </Badge>
                                  </div>
                                  <h4 className="font-extrabold text-foreground text-base">{v.vacuna?.nombre || v.nombre_vacuna || "Tratamiento"}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">Lote: <strong>{v.lote_vacuna || "SIN-LOTE"}</strong> • Peso: {v.peso_mascota_kg ? `${v.peso_mascota_kg} kg` : "N/A"}</p>
                                </div>
                              </div>
                              {v.fecha_proxima_dosis && (
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground block">Próxima Dosis</span>
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-black text-[10px] mt-1">{safeDateString(v.fecha_proxima_dosis)}</Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* PESTAÑA 2: CARNET ZOOSANITARIO COMPLETO */}
          <TabsContent value="zoosanitario">
            <ZoosanitarioPanel mascotaId={id} />
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

    {/* DIALOG: REGISTRAR SEGUIMIENTO CLÍNICO */}
    <Dialog open={isSeguimientoOpen} onOpenChange={setIsSeguimientoOpen}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-indigo-600">Registrar Evolución / Seguimiento Clínico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateSeguimiento} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Motivo del Seguimiento *</Label>
              <Input
                placeholder="Ej. Control de gastroenteritis, reevaluación..."
                value={segMotivo}
                onChange={(e) => setSegMotivo(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Síntomas Actuales</Label>
              <Input
                placeholder="Ej. Vomitos cesaron, leve decaimiento..."
                value={segSintomas}
                onChange={(e) => setSegSintomas(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Observaciones del Examen</Label>
              <Input
                placeholder="Ej. Abdomen blando y depresible..."
                value={segObservaciones}
                onChange={(e) => setSegObservaciones(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Diagnóstico Actual</Label>
              <Input
                placeholder="Ej. Evolución favorable de otitis..."
                value={segDiagnostico}
                onChange={(e) => setSegDiagnostico(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Tratamiento Realizado / Continuado</Label>
            <Input
              placeholder="Ej. Continuar Amoxicilina 250mg cada 12h..."
              value={segTratamiento}
              onChange={(e) => setSegTratamiento(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Recomendaciones e Indicaciones para el Dueño</Label>
            <Textarea
              placeholder="Ej. Ofrecer dieta blanda, mantener hidratación frecuente..."
              value={segRecomendaciones}
              onChange={(e) => setSegRecomendaciones(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="border-t pt-3">
            <Label className="text-xs font-black uppercase text-indigo-500 block mb-2">Constantes Fisiológicas (Opcional)</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="7.4"
                  value={segPeso}
                  onChange={(e) => setSegPeso(e.target.value)}
                  className="rounded-lg h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Temp (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="38.5"
                  value={segTemperatura}
                  onChange={(e) => setSegTemperatura(e.target.value)}
                  className="rounded-lg h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">F. Cardíaca (lpm)</Label>
                <Input
                  type="number"
                  placeholder="110"
                  value={segFc}
                  onChange={(e) => setSegFc(e.target.value)}
                  className="rounded-lg h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">F. Resp (rpm)</Label>
                <Input
                  type="number"
                  placeholder="24"
                  value={segFr}
                  onChange={(e) => setSegFr(e.target.value)}
                  className="rounded-lg h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Mucosas</Label>
                <Input
                  placeholder="Rosadas"
                  value={segMucosas}
                  onChange={(e) => setSegMucosas(e.target.value)}
                  className="rounded-lg h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsSeguimientoOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingSeguimiento} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
              {submittingSeguimiento ? "Guardando..." : "Registrar Seguimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* DIALOG: REGISTRAR INFORME CLÍNICO */}
    <Dialog open={isInformeOpen} onOpenChange={setIsInformeOpen}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-purple-600">Registrar Informe Clínico Estructurado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateInforme} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <Label className="text-xs font-bold">Tipo de Estudio *</Label>
              <select
                value={infTipo}
                onChange={(e: any) => setInfTipo(e.target.value)}
                className="w-full rounded-xl border border-input bg-background h-10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ECOGRAFIA">Ecografía</option>
                <option value="RADIOGRAFIA">Radiografía (RX)</option>
                <option value="LABORATORIO">Análisis Laboratorio</option>
                <option value="CITOLOGIA">Citología</option>
                <option value="HISTOPATOLOGIA">Histopatología</option>
                <option value="ELECTROCARDIOGRAMA">Electrocardiograma</option>
                <option value="OTRO">Otro Estudio</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-bold">Título del Informe *</Label>
              <Input
                placeholder="Ej. Ecografía Abdominal Completa"
                value={infTitulo}
                onChange={(e) => setInfTitulo(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Hallazgos / Comentario Clínico</Label>
            <Textarea
              placeholder="Describí en detalle los hallazgos del examen complementario..."
              value={infComentario}
              onChange={(e) => setInfComentario(e.target.value)}
              className="rounded-xl min-h-[85px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Conclusión Diagnóstica</Label>
            <Textarea
              placeholder="Ej. Hallazgos compatibles con nefritis crónica..."
              value={infConclusion}
              onChange={(e) => setInfConclusion(e.target.value)}
              className="rounded-xl min-h-[70px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Recomendaciones del Especialista</Label>
            <Textarea
              placeholder="Ej. Control ecográfico en 30 días, biopsia..."
              value={infRecomendaciones}
              onChange={(e) => setInfRecomendaciones(e.target.value)}
              className="rounded-xl min-h-[60px]"
            />
          </div>

          <div className="border-t pt-3">
            <FileDropzone
              label="Placas / Capturas / Imágenes del Estudio"
              description="Arrastra imágenes de ecografías, radiografías o reportes de laboratorio. (JPG, PNG)."
              maxFiles={6}
              onFilesChanged={(files) => {
                const urls = files.filter(f => f.status === 'success' && f.url).map(f => f.url as string);
                setInfImagenes(urls);
              }}
            />
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsInformeOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingInforme} className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white">
              {submittingInforme ? "Guardando..." : "Registrar Informe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* DIALOG: VISUALIZADOR DE IMÁGENES DE ESTUDIO */}
    <Dialog open={isReportImagesOpen} onOpenChange={setIsReportImagesOpen}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-purple-600">{selectedReportTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          {selectedReportImages.map((url, idx) => (
            <div key={idx} className="border border-border/40 rounded-2xl overflow-hidden bg-muted/10 p-2 flex flex-col items-center justify-between gap-3">
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center relative group">
                <img
                  src={url}
                  alt={selectedReportTitle}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex justify-end items-center w-full px-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold rounded-lg"
                  asChild
                >
                  <a href={url} download={`${selectedReportTitle.replace(/\s+/g, '_')}.${url.startsWith('data:image/png') ? 'png' : 'jpg'}`}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Descargar Imagen
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsReportImagesOpen(false)}>
            Cerrar Visualizador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}