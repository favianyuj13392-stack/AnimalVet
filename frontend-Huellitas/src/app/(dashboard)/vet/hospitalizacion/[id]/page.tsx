"use client";

import React, { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Calendar, User, Activity, HeartPulse, Clock, FileText, 
  Pill, Syringe, LogOut, Loader2, PlusCircle, AlertTriangle ,Paperclip, Download, ImageIcon
} from "lucide-react";
import { AddVacunaHospDialog } from "@/domains/clinical/components/add-vacuna-hosp-dialog";
// IMPORTANTE: Asegúrate de tener tu servicio de vacunas aplicadas
import { vacunasAplicadasService } from "@/domains/clinical/services/vacunas-aplicadas.service";
// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { AddArchivoDialog } from "@/domains/clinical/components/add-archivo-dialog";
// Servicios y Store
import { useAuthStore } from "@/shared/store/useAuthStore";
import { hospitalizacionesService, hospitalizacionInsumosService } from "@/domains/clinical/services/hospitalizaciones.service"; 
import { monitoreoDiarioService } from "@/domains/clinical/services/monitoreo-diario.service";
import { cloudinaryService } from "@/shared/lib/claudinary.service";
// y asegúrate de tener tu servicio del backend
import { archivosAdjuntosService } from "@/domains/clinical/services/archivos-adjuntos.service";
// Modales
import { AddVitalSignsDialog } from "@/domains/clinical/components/add-vital-signs-dialog";
import { AddInsumoDialog } from "@/domains/clinical/components/add-insumo-dialog";
import { Dialog , DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from "@/shared/components/ui/dialog";

// Función auxiliar de formateo
const safeDateString = (dateVal: any): string => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch (e) {
    return "—";
  }
};

export default function HospitalizacionDashboard({ params }: { params: Promise<{ id: string }> }) {
  // 1. Hook de Next.js 15 para desenpaquetar los params
  const { id } = use(params);
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;

  // 2. Estados para los Modales
  const [modalLogOpen, setModalLogOpen] = useState(false);
  const [newLog, setNewLog] = useState({ temp: "", fc: "", fr: "", turno: "Mañana", observaciones: "" });
  
  const [modalInsumoOpen, setModalInsumoOpen] = useState(false);

  const [modalVacunaOpen, setModalVacunaOpen] = useState(false);
  const [modalAltaOpen, setModalAltaOpen] = useState(false);
  const [altaForm, setAltaForm] = useState({
    condicion_egreso: "",
    diagnostico_egreso: "",
    instrucciones_alta: "",
  });

  const [archivoParaVer, setArchivoParaVer] = useState<any | null>(null);

  const [modalArchivoOpen, setModalArchivoOpen] = useState(false);
  const handleAddVacuna = async (vacunaData: any) => {
    try {
      await vacunasAplicadasService.create({
        id_hospitalizacion_fk: id, // Asociamos la vacuna a esta internación
        ...vacunaData
      });
      toast.success("Vacuna registrada exitosamente.");
      setModalVacunaOpen(false);
      refetch(); // Recargamos el hospitalizacion completo para actualizar la tabla
    } catch (err) {
      toast.error("Error al registrar la vacuna.");
      console.error(err);
    }
  };
  // 3. Fetch principal de datos
  const { data: hospitalizacion, isLoading, refetch } = useQuery({
    queryKey: ["hospitalizacion", id],
    queryFn: () => hospitalizacionesService.getOne(id),
  });


  const { data: monitoreos, refetch: refetchMonitoreos } = useQuery({
    queryKey: ["monitoreo-diario", id],
    queryFn: () => monitoreoDiarioService.getByHospitalizacion(id),
    enabled: !!id, // Seguridad: Solo se ejecuta si el ID de la URL ya existe
  });

  const isAlta = hospitalizacion?.estado_actual === "Alta";

  // 4. Funciones Controladoras (Handlers)
  const handleDarAlta = () => {
    setAltaForm({ condicion_egreso: "", diagnostico_egreso: "", instrucciones_alta: "" });
    setModalAltaOpen(true);
  };

  const handleConfirmarAlta = async () => {
    if (!altaForm.condicion_egreso || !altaForm.diagnostico_egreso || !altaForm.instrucciones_alta) {
      toast.error("Completa todos los campos del documento de alta");
      return;
    }
    if (!id) return;
    try {
      await hospitalizacionesService.update(id, {
        estado_actual: "Alta",
        fecha_alta: new Date().toISOString(),
        condicion_egreso: altaForm.condicion_egreso,
        diagnostico_egreso: altaForm.diagnostico_egreso,
        instrucciones_alta: altaForm.instrucciones_alta,
      });
      toast.success("Paciente dado de alta con documento de egreso registrado.");
      setModalAltaOpen(false);
      refetch();
    } catch (err) {
      toast.error("Error al procesar el alta.");
      console.error(err);
    }
  };

 const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.temp || !newLog.fc || !newLog.fr || !newLog.turno || !newLog.observaciones) {
      toast.error("Por favor completa todos los signos vitales y datos del control");
      return;
    }
    try {
      await monitoreoDiarioService.create({
        id_hospitaliza_fk: id,
        id_veterinario_fk: user?.id || "4a5c17d7-d7ff-4c4f-a496-d249fbf7f4be",
        turno: newLog.turno as 'Mañana' | 'Tarde' | 'Noche',
        temperatura_c: parseFloat(newLog.temp),
        freq_cardiaca: parseInt(newLog.fc, 10),
        freq_respiratoria: parseInt(newLog.fr, 10),
        observaciones: newLog.observaciones,
      });

      toast.success("Signos vitales guardados exitosamente");
      setModalLogOpen(false);
      setNewLog({ temp: "", fc: "", fr: "", turno: "Mañana", observaciones: "" });
      
      // 👇 CAMBIAMOS ESTO AQUÍ para refrescar tu nuevo endpoint
      refetchMonitoreos(); 
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el monitoreo clínico.");
    }
  };

  const handleAddInsumo = async (insumoData: any) => {
    try {
      await hospitalizacionInsumosService.create({
        id_hospitalizacion_fk: id,
        ...insumoData
      });
      toast.success("Insumo cargado a la cuenta correctamente.");
      setModalInsumoOpen(false);
      refetch(); 
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al cargar el insumo (revisa el stock).");
      console.error(err);
    }
  };


const handleAddArchivo = async (data: { 
    file: File; 
    tipo_estudio: "Radiografia" | "Laboratorio" | "Ecografia" | "Electrocardiograma" | "Otro"; 
    observaciones: string 
  }) => {
    try {
      toast.loading("Subiendo archivo a la nube..."); 

      // 1. Usamos tu nuevo servicio compartido
      const urlFinal = await cloudinaryService.uploadFile(data.file);

      toast.dismiss();

      console.log("data del form:", data); // DEBUG: Ver lo que seleccionó el usuario
      console.log("URL de Cloudinary:", urlFinal); // DEBUG: Ver la URL segura

      // 2. Preparamos el JSON limpito para NestJS en una variable
      const payloadBackend = {
        id_hospitalizacion_fk: id,       
        url_archivo: urlFinal,  
        nombre_archivo: data.file.name,         
        tipo_archivo: data.file.type,    
        tipo_estudio: data.tipo_estudio,
        observaciones: data.observaciones,
        origen: "Interno" as const,               
        estado_archivo: "Recibido" as const,
        fecha_estudio: new Date().toISOString(),
      };
      
      // 👇 AQUÍ ESTÁ TU LOG COMPLETADO
      console.log("Datos que estamos enviando al backend:", payloadBackend);

      // 3. Enviamos a NestJS
      await archivosAdjuntosService.create(payloadBackend);

      toast.success("Archivo adjuntado correctamente al expediente.");
      setModalArchivoOpen(false);
      refetch(); 
      
    } catch (err) {
      toast.dismiss();
      toast.error("Error al procesar el documento.");
      console.error(err);
    }
  };

  // Pantalla de Carga
  if (isLoading || !hospitalizacion) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando Centro de Mando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500 pb-12 mx-auto">
      
      {/* HEADER TIPO GLASSMORPHISM */}
      <div className="bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-sm shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
            Internación Activa
          </Badge>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent flex items-center gap-3">
            Paciente: {hospitalizacion.mascota?.nombre || "Desconocido"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
             <Badge variant={isAlta ? "outline" : "default"} className={!isAlta ? "bg-emergency text-emergency-foreground font-bold" : "font-bold"}>
              {hospitalizacion.estado_actual}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Ingreso: {safeDateString(hospitalizacion.fecha_ingreso)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button 
            disabled={isAlta || isAdmin} 
            onClick={handleDarAlta}
            className="rounded-xl font-bold bg-primary shadow-md hover:-translate-y-0.5 transition-transform"
            size="lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Dar de Alta
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl items-center font-semibold text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
          <span>Modo de Vista: Como administrador, solo puedes auditar los insumos y procedimientos de esta internación.</span>
        </div>
      )}

      {/* ÁREA DE PESTAÑAS */}
   <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mb-6 rounded-2xl bg-muted/20 p-1">
          <TabsTrigger value="resumen" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><FileText className="w-4 h-4 mr-2 hidden sm:block"/> Resumen</TabsTrigger>
          <TabsTrigger value="monitoreo" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Activity className="w-4 h-4 mr-2 hidden sm:block"/> Monitoreo</TabsTrigger>
          <TabsTrigger value="insumos" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Pill className="w-4 h-4 mr-2 hidden sm:block"/> Insumos</TabsTrigger>
          <TabsTrigger value="vacunas" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Syringe className="w-4 h-4 mr-2 hidden sm:block"/> Vacunas</TabsTrigger>
          <TabsTrigger value="archivos" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Paperclip className="w-4 h-4 mr-2 hidden sm:block"/> Archivos</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: RESUMEN MÉDICO --- */}
        <TabsContent value="resumen" className="space-y-6">
          <Card className="rounded-3xl border-border/40 overflow-hidden shadow-sm bg-card/25 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10 p-5">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-primary" /> Datos del Evento Clínico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/5 p-4 rounded-2xl border border-border/20 text-sm font-semibold text-card-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Médico a cargo:</span>
                  <strong className="text-foreground">
                    Dr(a). {hospitalizacion.veterinario?.nombres} {hospitalizacion.veterinario?.apellidos}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Costo por día:</span>
                  <strong className="text-foreground">{hospitalizacion.costo_por_dia} Bs.</strong>
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Motivo de Ingreso</span>
                <p className="text-sm text-foreground bg-muted/10 p-4 rounded-2xl border border-border/30 min-h-[56px] leading-relaxed font-bold">
                  {hospitalizacion.motivo_ingreso}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: MONITOREO DIARIO --- */}
        <TabsContent value="monitoreo">
          <Card className="rounded-3xl border-border/40 overflow-hidden shadow-sm bg-card/25 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-extrabold">Hoja de Evolución</CardTitle>
                <CardDescription>Registro de signos vitales por turnos</CardDescription>
              </div>
              {!isAdmin && !isAlta && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setModalLogOpen(true)}
                  className="rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-bold"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Añadir Control
                </Button>
              )}
            </CardHeader>
           <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="border-border/20">
                    <TableHead className="px-5 font-bold">Fecha / Hora</TableHead>
                    <TableHead className="font-bold">Turno</TableHead>
                    <TableHead className="font-bold text-center">T° (°C)</TableHead>
                    <TableHead className="font-bold text-center">F.C. (bpm)</TableHead>
                    <TableHead className="font-bold text-center">F.R. (rpm)</TableHead>
                    <TableHead className="font-bold">Médico de Guardia</TableHead>
                    <TableHead className="font-bold">Observaciones Clínicas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 👇 MAPEAMOS TU NUEVO ENDPOINT DIRECTAMENTE */}
                  {!monitoreos || monitoreos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto opacity-20 mb-3 animate-pulse" />
                        <p className="text-sm font-medium">Sin registros de monitoreo para este paciente.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    monitoreos.map((m: any) => (
                      <TableRow key={m.id} className="border-border/10 hover:bg-muted/5 transition-colors">
                        <TableCell className="px-5 text-sm font-mono">
                          {m.fecha_registro ? new Date(m.fecha_registro).toLocaleString("es-BO", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                          }) : "—"}
                        </TableCell>
                        <td className="py-3 px-4 font-semibold text-xs text-muted-foreground">{m.turno}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-primary">{m.temperatura_c}°C</td>
                        <td className="py-3 px-4 text-center font-mono text-destructive font-bold">{m.freq_cardiaca} bpm</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">{m.freq_respiratoria} rpm</td>
                        <td className="py-3 px-4 font-bold text-xs">
                          {m.veterinario ? `Dr. ${m.veterinario.apellidos}` : "No asignado"}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-[220px] truncate hover:whitespace-normal transition-all">
                          {m.observaciones}
                        </td>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: INSUMOS Y SERVICIOS --- */}
        <TabsContent value="insumos">
          <Card className="rounded-3xl border-border/40 overflow-hidden shadow-sm bg-card/25 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-extrabold">Insumos y Servicios</CardTitle>
                <CardDescription>Productos consumidos del almacén y servicios aplicados</CardDescription>
              </div>
              {!isAdmin && !isAlta && (
                <Button 
                  size="sm" 
                  onClick={() => setModalInsumoOpen(true)}
                  className="rounded-xl font-bold bg-primary shadow-md hover:-translate-y-0.5 transition-transform"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Cargar Insumo
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="border-border/20">
                    <TableHead className="px-5 font-bold">Fecha</TableHead>
                    <TableHead className="font-bold">Tipo</TableHead>
                    <TableHead className="font-bold">Detalle</TableHead>
                    <TableHead className="text-right px-5 font-bold">Cant.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalizacion.insumos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        No se han registrado consumos en la cuenta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    hospitalizacion.insumos?.map((insumo: any) => (
                      <TableRow key={insumo.id} className="border-border/10 hover:bg-muted/5">
                        <TableCell className="px-5 text-sm font-medium">{safeDateString(insumo.fecha_registro)}</TableCell>
                        <TableCell>
                          <Badge variant={insumo.tipo === 'PRODUCTO' ? 'secondary' : 'outline'} className="text-[10px] font-bold py-0.5 px-2 rounded-md">
                            {insumo.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{insumo.nombre_item}</TableCell>
                        <TableCell className="text-right px-5 font-bold text-foreground">{insumo.cantidad}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 4: VACUNAS --- */}
        <TabsContent value="vacunas">
          <Card className="rounded-3xl border-border/40 overflow-hidden shadow-sm bg-card/25 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-extrabold">Vacunación Interna</CardTitle>
                <CardDescription>Registro de vacunas aplicadas durante la internación</CardDescription>
              </div>
              {!isAdmin && !isAlta && (
                <Button 
                  size="sm" 
                  onClick={() => setModalVacunaOpen(true)} // 👈 AÑADE ESTO
                  className="rounded-xl font-bold bg-primary shadow-md hover:-translate-y-0.5 transition-transform"
                >
                  <Syringe className="w-4 h-4 mr-2" /> Aplicar Vacuna
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="border-border/20">
                    <TableHead className="px-5 font-bold">Fecha Aplicación</TableHead>
                    <TableHead className="font-bold">Vacuna</TableHead>
                    <TableHead className="font-bold">Lote</TableHead>
                    <TableHead className="font-bold">Próxima Dosis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitalizacion.vacunas_aplicadas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        Sin vacunas registradas en esta estancia.
                      </TableCell>
                    </TableRow>
                  ) : (
                    hospitalizacion.vacunas_aplicadas?.map((vac: any) => (
                      <TableRow key={vac.id} className="border-border/10 hover:bg-muted/5">
                        <TableCell className="px-5 text-sm font-medium">{safeDateString(vac.fecha_aplicacion)}</TableCell>
                        <TableCell className="font-bold text-primary">{vac.nombre_vacuna}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{vac.lote_vacuna || "N/A"}</TableCell>
                        <TableCell className="text-sm font-mono">
                          {vac.fecha_proxima_dosis ? safeDateString(vac.fecha_proxima_dosis) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="archivos">
          <Card className="rounded-3xl border-border/40 overflow-hidden shadow-sm bg-card/25 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-extrabold">Estudios y Exámenes</CardTitle>
                <CardDescription>Documentos clínicos anexados a este expediente</CardDescription>
              </div>
            {!isAdmin && !isAlta && (
                <Button 
                  size="sm" 
                  onClick={() => setModalArchivoOpen(true)} // 👈 AHORA SÍ ABRE EL MODAL
                  className="rounded-xl font-bold bg-primary shadow-md hover:-translate-y-0.5 transition-transform"
                >
                  <Paperclip className="w-4 h-4 mr-2" /> Adjuntar Archivo
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="border-border/20">
                    <TableHead className="px-5 font-bold">Fecha</TableHead>
                    <TableHead className="font-bold">Tipo Estudio</TableHead>
                    <TableHead className="font-bold">Nombre del Archivo</TableHead>
                    <TableHead className="text-right px-5 font-bold">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 👇 Mira cómo quitamos el '.historial' de aquí */}
                  {!hospitalizacion.archivos || hospitalizacion.archivos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mx-auto opacity-20 mb-3" />
                        No hay archivos ni resultados de laboratorio adjuntos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    /* 👇 Y también lo quitamos de aquí */
                    hospitalizacion.archivos.map((file: any) => (
                      <TableRow key={file.id} className="border-border/10 hover:bg-muted/5">
                        <TableCell className="px-5 text-sm font-medium">{safeDateString(file.fecha_estudio || file.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 rounded-md">
                            {file.tipo_estudio}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{file.nombre_archivo}</TableCell>
                        <TableCell className="text-right px-5">
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setArchivoParaVer(file)} 
                            className="rounded-lg text-primary hover:bg-primary/10"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Estudio
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- RENDERIZADO DE MODALES --- */}
      
      {/* 1. Modal de Controles Vitales */}
      {!isAdmin && (
        <AddVitalSignsDialog
          open={modalLogOpen}
          onOpenChange={setModalLogOpen}
          newLog={newLog}
          setNewLog={setNewLog}
          onSubmit={handleAddLog}
          pacienteNombre={hospitalizacion.mascota?.nombre || "Paciente"}
        />
      )}

      {/* 2. Modal de Insumos */}
      {!isAdmin && (
        <AddInsumoDialog
          open={modalInsumoOpen}
          onOpenChange={setModalInsumoOpen}
          onSubmit={handleAddInsumo}
          pacienteNombre={hospitalizacion.mascota?.nombre || "Paciente"}
        />
      )}
{/* 3. Modal de Vacunas */}
      {!isAdmin && (
        <AddVacunaHospDialog
          open={modalVacunaOpen}
          onOpenChange={setModalVacunaOpen}
          onSubmit={handleAddVacuna}
          pacienteNombre={hospitalizacion.mascota?.nombre || "Paciente"}
        />
      )}

      {/* 4. Modal de Archivos */}
      {!isAdmin && (
        <AddArchivoDialog
          open={modalArchivoOpen}
          onOpenChange={setModalArchivoOpen}
          onSubmit={handleAddArchivo}
          pacienteNombre={hospitalizacion.mascota?.nombre || "Paciente"}
        />
      )}

      {/* 5. VISOR DE ARCHIVOS INTEGRADO */}
      <Dialog open={!!archivoParaVer} onOpenChange={(open) => !open && setArchivoParaVer(null)}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col rounded-3xl border-border/50 bg-background/95 backdrop-blur-md p-6">
          <DialogHeader className="mb-2 shrink-0">
            <DialogTitle className="text-xl font-bold text-primary">
              {archivoParaVer?.tipo_estudio}
            </DialogTitle>
            <DialogDescription>
              {archivoParaVer?.nombre_archivo || "Documento adjunto al expediente"}
            </DialogDescription>
          </DialogHeader>
          
       {/* CONTENEDOR DEL DOCUMENTO */}
          <div className="flex-1 w-full bg-muted/30 rounded-2xl overflow-hidden border border-border/50 relative flex items-center justify-center">
            {archivoParaVer && (
              archivoParaVer.url_archivo.toLowerCase().endsWith('.pdf') ? (
                // 📄 SI ES PDF: Usamos el visor nativo del navegador
                <object 
                  data={archivoParaVer.url_archivo} 
                  type="application/pdf" 
                  className="w-full h-full border-0 rounded-xl"
                >
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-background">
                    <p className="text-muted-foreground mb-4 font-medium">
                      Tu navegador requiere que descargues el documento.
                    </p>
                    <Button asChild className="rounded-xl font-bold bg-primary shadow-md">
                      <a href={archivoParaVer.url_archivo.replace('/upload/', '/upload/fl_attachment/')} download>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </a>
                    </Button>
                  </div>
                </object>
              ) : (
                // 🖼️ SI ES IMAGEN: Usamos una etiqueta img normal
                <img 
                  src={archivoParaVer.url_archivo} 
                  alt="Estudio Clínico"
                  className="max-w-full max-h-full object-contain p-2"
                />
              )
            )}
          </div>
          
          <DialogFooter className="mt-4 shrink-0">
            <Button variant="outline" onClick={() => setArchivoParaVer(null)} className="rounded-xl font-bold">
              Cerrar Visor
            </Button>
            <Button asChild className="rounded-xl font-bold bg-primary">
              <a 
                href={archivoParaVer?.url_archivo.replace('/upload/', '/upload/fl_attachment/')} 
                download
              >
                <Download className="w-4 h-4 mr-2" /> Descargar Copia
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DOCUMENTO DE ALTA */}
      <Dialog open={modalAltaOpen} onOpenChange={setModalAltaOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <LogOut className="h-5 w-5 text-primary" /> Documento de Alta Médica
            </DialogTitle>
            <DialogDescription>
              Completa el registro de egreso antes de dar de alta al paciente. Este documento es legalmente obligatorio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Condición de egreso *</Label>
              <Select
                value={altaForm.condicion_egreso}
                onValueChange={(v) => setAltaForm(p => ({ ...p, condicion_egreso: v }))}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Seleccionar condición..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recuperado">✅ Recuperado</SelectItem>
                  <SelectItem value="Mejorado">🔄 Mejorado</SelectItem>
                  <SelectItem value="Sin cambios">⚠️ Sin cambios</SelectItem>
                  <SelectItem value="Fallecido">❌ Fallecido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Diagnóstico de egreso *</Label>
              <Textarea
                placeholder="Ej: Gastroenteritis aguda resuelta, sin complicaciones..."
                value={altaForm.diagnostico_egreso}
                onChange={(e) => setAltaForm(p => ({ ...p, diagnostico_egreso: e.target.value }))}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Instrucciones post-alta *</Label>
              <Textarea
                placeholder="Ej: Dieta blanda por 5 días, Amoxicilina 1 comp c/12h por 7 días, control en 1 semana..."
                value={altaForm.instrucciones_alta}
                onChange={(e) => setAltaForm(p => ({ ...p, instrucciones_alta: e.target.value }))}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setModalAltaOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleConfirmarAlta}>
              <LogOut className="h-4 w-4 mr-1" /> Confirmar Alta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}