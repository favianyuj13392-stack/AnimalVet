"use client";

import React, { useState } from "react";
import { FileViewer } from "@/shared/components/ui/file-viewer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Calendar,
  User,
  Activity,
  Thermometer,
  Heart,
  Search,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useCrud } from "@/shared/hooks/useCrud";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";
import { historialClinicoService } from "@/domains/clinical/services/historial-clinico.service";
import { HistorialClinico } from "@/domains/clinical/clinical.types";

const safeDateString = (dateVal: any): string => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "—";
  }
};

export default function HistorialPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();

  const {
    data: historiales,
    loading,
    updateItem,
    deleteItem,
    refetch,
  } = useCrud<HistorialClinico>(historialClinicoService, "historiales");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [selectedHistorial, setSelectedHistorial] = useState<HistorialClinico | null>(null);
  const [notesText, setNotesText] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewing, setPreviewing] = useState<{ url: string; nombre: string; tipo: string } | null>(null);

  // Filtrado de historiales clínicos
  const filteredHistoriales = (historiales ?? []).filter((h) => {
    const term = busqueda.toLowerCase();
    const coincideMascota = h.mascota?.nombre?.toLowerCase().includes(term);
    const coincideVet = `${h.veterinario?.nombres} ${h.veterinario?.apellidos}`.toLowerCase().includes(term);
    const coincideDiagnostico = h.diagnostico?.toLowerCase().includes(term);
    const coincideMotivo = h.motivo_consulta?.toLowerCase().includes(term);
    const coincideSintomas = h.sintomas?.toLowerCase().includes(term);
    const coincideBusqueda = term === "" || coincideMascota || coincideVet || coincideDiagnostico || coincideMotivo || coincideSintomas;

    const coincideEstado = filtroEstado === "todos" || h.estado === filtroEstado;

    const coincideMes = (() => {
      if (filtroMes === "todos") return true;
      const fecha = new Date(h.fecha_consulta);
      const [anio, mes] = filtroMes.split("-");
      return fecha.getFullYear() === Number(anio) && fecha.getMonth() + 1 === Number(mes);
    })();

    return (
      coincideBusqueda &&
      coincideEstado &&
      coincideMes
    );
  });

  const handleOpenEditDialog = (h: HistorialClinico) => {
    setSelectedHistorial(h);
    setNotesText(h.notas_internas || "");
    setEditDialogOpen(true);
  };

  const handleUpdateNotes = async () => {
    if (!selectedHistorial) return;
    setIsUpdating(true);
    try {
      await updateItem({
        id: selectedHistorial.id,
        data: { notas_internas: notesText } as Partial<HistorialClinico>,
      });
      toast.success("Notas internas actualizadas correctamente");
      setEditDialogOpen(false);
    } catch (error) {
      toast.error("Error al actualizar las notas internas");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRecord = (id: string, mascotaNombre: string) => {
    openConfirm({
      title: "Desactivar historial",
      description: `¿Desactivar el historial clínico de ${mascotaNombre}?`,
      variant: "destructive",
      confirmLabel: "Sí, desactivar",
      onConfirm: async () => {
        await deleteItem(id);
        toast.success("Registro clínico desactivado exitosamente");
      },
    });
  };

  const handleRestoreRecord = (id: string, mascotaNombre: string) => {
    openConfirm({
      title: "Reactivar historial",
      description: `¿Reactivar el historial clínico de ${mascotaNombre}?`,
      variant: "warning",
      confirmLabel: "Sí, reactivar",
      onConfirm: async () => {
        await historialClinicoService.activar(id);
        toast.success("Registro clínico activado exitosamente");
        refetch();
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando historiales clínicos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-sm shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
            Módulo Clínico
          </Badge>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
            Historial Clínico de la Clínica
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro global de consultas, diagnósticos y triajes realizados en AnimalVet.
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl items-center font-semibold text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
          <span>Modo de Vista: Como administrador, no puedes registrar ni editar el historial clínico. Esta pantalla es únicamente para fines de auditoría operativa.</span>
        </div>
      )}

      {/* BUSCADOR + FILTROS */}
      <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por mascota, diagnóstico, motivo o veterinario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Abierto">Abierto</SelectItem>
                <SelectItem value="Cerrado">Cerrado</SelectItem>
                <SelectItem value="Facturado">Facturado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroMes} onValueChange={setFiltroMes}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los meses</SelectItem>
                {Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setDate(1); // Evitar desbordamiento si hoy es 29/30/31
                  d.setMonth(d.getMonth() - i);
                  const val = `${d.getFullYear()}-${d.getMonth() + 1}`;
                  const label = d.toLocaleDateString("es-BO", { month: "long", year: "numeric" });
                  return <SelectItem key={val} value={val} className="capitalize">{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          {(filtroEstado !== "todos" || filtroMes !== "todos" || busqueda) && (
            <button
              onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroMes("todos"); }}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </CardContent>
      </Card>

      {/* LIST OF CARDS */}
      <div className="space-y-6">
        {filteredHistoriales.length === 0 ? (
          <Card className="rounded-2xl border-border/40 p-12 text-center text-muted-foreground bg-card/25 backdrop-blur-md">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3 animate-pulse" />
            <h3 className="font-bold text-lg text-foreground">No se encontraron historiales clínicos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Intenta cambiando los criterios de búsqueda.
            </p>
          </Card>
        ) : (
          filteredHistoriales.map((consulta) => (
            <Card
              key={consulta.id}
              className="rounded-3xl border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card/25 backdrop-blur-md"
            >
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/10 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {safeDateString(consulta.fecha_consulta)}
                    </span>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-bold">
                      {consulta.tipo_atencion || "Consulta"}
                    </Badge>
                    <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                      Mascota: {consulta.mascota?.nombre || "Paciente"}
                    </Badge>
                    {consulta.deletedAt ? (
                      <Badge variant="destructive" className="text-[10px] font-bold py-0.5 px-1.5 rounded">
                        Inactivo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 text-[10px] font-bold py-0.5 px-1.5 rounded">
                        Activo
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-extrabold text-foreground mt-1">
                    Motivo: {consulta.motivo_consulta}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-background px-3 py-1.5 rounded-xl border border-border/40">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {consulta.veterinario
                      ? `Dr(a). ${consulta.veterinario.nombres} ${consulta.veterinario.apellidos}`
                      : "Médico AnimalVet"}
                  </div>

                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-xs text-muted-foreground border-border/40 gap-1 px-2">
                      <FileText className="h-3 w-3" /> Registro inmutable
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* SIGNOS VITALES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/5 p-3 rounded-2xl border border-border/20 text-xs font-semibold text-card-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span>Peso: <strong className="text-foreground">{consulta.peso_actual_kg} kg</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-rose-500" />
                    <span>Temp: <strong className="text-foreground">{consulta.temperatura_c ? `${consulta.temperatura_c} °C` : "—"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-500" />
                    <span>FC: <strong className="text-foreground">{consulta.frecuencia_cardiaca ? `${consulta.frecuencia_cardiaca} lpm` : "—"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>FR: <strong className="text-foreground">{consulta.frecuencia_respiratoria ? `${consulta.frecuencia_respiratoria} rpm` : "—"}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SINTOMAS */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Síntomas / Anamnesis</span>
                    <p className="text-sm text-foreground bg-muted/10 p-3 rounded-2xl border border-border/30 min-h-[56px] leading-relaxed">
                      {consulta.sintomas || "No especificado"}
                    </p>
                  </div>

                  {/* DIAGNOSTICO */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Diagnóstico Médico</span>
                    <p className="text-sm text-foreground bg-muted/10 p-3 rounded-2xl border border-border/30 min-h-[56px] leading-relaxed font-bold">
                      {consulta.diagnostico}
                    </p>
                  </div>
                </div>

                {/* NOTAS INTERNAS */}
                {consulta.notas_internas && (
                  <div className="space-y-1 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Notas Internas / Tratamiento</span>
                    <p className="text-xs font-semibold text-card-foreground leading-relaxed whitespace-pre-line">
                      {consulta.notas_internas}
                    </p>
                  </div>
                )}

                {/* ARCHIVOS ADJUNTOS */}
                {consulta.archivosAdjuntos && consulta.archivosAdjuntos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                      <Paperclip className="h-3 w-3" /> Archivos Adjuntos ({consulta.archivosAdjuntos.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {consulta.archivosAdjuntos.map((archivo: any) => {
                        const esPdf = archivo.tipo_mime?.includes("pdf") || archivo.nombre_archivo?.endsWith(".pdf");
                        const esImagen = archivo.tipo_mime?.startsWith("image/");
                        return (
                          <button
                            key={archivo.id}
                            onClick={() => setPreviewing({ url: archivo.url_archivo, nombre: archivo.nombre_archivo, tipo: archivo.tipo_mime ?? "" })}
                            className="flex items-center gap-2 p-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/30 hover:border-primary/30 transition-all text-left group"
                          >
                            {esImagen ? (
                              <ImageIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                            ) : esPdf ? (
                              <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                            ) : (
                              <Paperclip className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <span className="text-xs font-medium truncate flex-1">{archivo.nombre_archivo}</span>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* VISOR GLOBAL — Portal en document.body */}
      {previewing && (
        <FileViewer
          url={previewing.url}
          nombre={previewing.nombre}
          tipo={previewing.tipo}
          onClose={() => setPreviewing(null)}
        />
      )}

      {/* DIALOG DE EDICION DE NOTAS INTERNAS */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-black text-xl">
              <Pencil className="h-5 w-5 text-primary" /> Editar Notas Internas
            </DialogTitle>
            <DialogDescription>
              Modifica únicamente las notas internas o indicaciones del historial clínico. El diagnóstico y signos vitales permanecerán inmutables.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notas Internas / Recomendaciones</label>
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Modifica las indicaciones de tratamiento o notas de cuidado aquí..."
              className="min-h-[120px] rounded-xl resize-none"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl font-bold bg-primary shadow-md hover:-translate-y-0.5 transition-transform"
              onClick={handleUpdateNotes}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}