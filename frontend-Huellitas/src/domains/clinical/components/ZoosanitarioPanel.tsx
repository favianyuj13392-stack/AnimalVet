"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Syringe,
  ShieldAlert,
  Loader2,
  Calendar,
  ClipboardList,
  Plus,
  Trash,
  Download,
  AlertCircle,
  Stethoscope,
  Clock,
} from "lucide-react";
import { zoosanitarioService } from "../services/zoosanitario.service";
import { vaccinesCatalogService } from "../services/vaccines-catalog.service";
import { vacunasAplicadasService } from "../services/vacunas-aplicadas.service";
import api from "@/shared/lib/axios";

interface ZoosanitarioPanelProps {
  mascotaId: string;
  readOnly?: boolean;
}

export function ZoosanitarioPanel({ mascotaId, readOnly = false }: ZoosanitarioPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vacunas");

  // Catalogs
  const [catalogoVacunas, setCatalogoVacunas] = useState<any[]>([]);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"vacuna" | "desparasitacion" | "cirugia" | "tratamiento" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [idVacunaFk, setIdVacunaFk] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [fechaProxima, setFechaProxima] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [loteVacuna, setLoteVacuna] = useState("");
  const [productoUtilizado, setProductoUtilizado] = useState("");
  const [tipoCirugia, setTipoCirugia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [descripcionTratamiento, setDescripcionTratamiento] = useState("");
  const [notasDesparasitacion, setNotasDesparasitacion] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await zoosanitarioService.getTarjetaControl(mascotaId);
      setData(res);
    } catch (err) {
      toast.error("Error al cargar la tarjeta de control zoosanitario");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const res = await vaccinesCatalogService.getAll();
      setCatalogoVacunas(res || []);
    } catch (err) {
      console.error("Error al cargar el catálogo de vacunas", err);
    }
  };

  useEffect(() => {
    loadData();
    loadCatalogs();
  }, [mascotaId]);

  const handleOpenDialog = (tab: string) => {
    let type: "vacuna" | "desparasitacion" | "cirugia" | "tratamiento" = "vacuna";
    if (tab === "desparasitaciones") type = "desparasitacion";
    else if (tab === "cirugias") type = "cirugia";
    else if (tab === "tratamientos") type = "tratamiento";

    setDialogType(type);
    setFecha(new Date().toISOString().split("T")[0]);
    setFechaProxima("");
    setPesoKg("");
    setLoteVacuna("");
    setIdVacunaFk("");
    setProductoUtilizado("");
    setTipoCirugia("");
    setObservaciones("");
    setDescripcionTratamiento("");
    setNotasDesparasitacion("");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (dialogType === "vacuna") {
        if (!idVacunaFk) return toast.error("Debe seleccionar una vacuna");
        await vacunasAplicadasService.create({
          id_vacuna_fk: Number(idVacunaFk),
          id_mascota_fk: mascotaId,
          fecha_aplicacion: fecha,
          fecha_proxima_dosis: fechaProxima || undefined,
          peso_mascota_kg: pesoKg ? Number(pesoKg) : undefined,
          lote_vacuna: loteVacuna || undefined,
        });
        toast.success("Vacuna registrada exitosamente");
      } else if (dialogType === "desparasitacion") {
        if (!productoUtilizado) return toast.error("El nombre del producto es obligatorio");
        await zoosanitarioService.createDesparasitacion({
          id_mascota_fk: mascotaId,
          fecha,
          producto_utilizado: productoUtilizado,
          peso_kg: pesoKg ? Number(pesoKg) : undefined,
          fecha_proxima: fechaProxima || undefined,
          notas: notasDesparasitacion || undefined,
        });
        toast.success("Desparasitación registrada exitosamente");
      } else if (dialogType === "cirugia") {
        if (!tipoCirugia) return toast.error("El tipo de cirugía es obligatorio");
        await zoosanitarioService.createCirugia({
          id_mascota_fk: mascotaId,
          fecha,
          tipo_cirugia: tipoCirugia,
          observaciones: observaciones || undefined,
        });
        toast.success("Cirugía registrada exitosamente");
      } else if (dialogType === "tratamiento") {
        if (!descripcionTratamiento) return toast.error("La descripción del tratamiento es obligatoria");
        await zoosanitarioService.createTratamiento({
          id_mascota_fk: mascotaId,
          fecha,
          descripcion: descripcionTratamiento,
        });
        toast.success("Tratamiento registrado exitosamente");
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: "vacuna" | "desparasitacion" | "cirugia" | "tratamiento") => {
    if (!confirm("¿Está seguro de que desea eliminar este registro?")) return;

    try {
      if (type === "vacuna") {
        await vacunasAplicadasService.delete(id);
      } else if (type === "desparasitacion") {
        await zoosanitarioService.deleteDesparasitacion(id);
      } else if (type === "cirugia") {
        await zoosanitarioService.deleteCirugia(id);
      } else if (type === "tratamiento") {
        await zoosanitarioService.deleteTratamiento(id);
      }
      toast.success("Registro eliminado exitosamente");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar el registro");
    }
  };

  const handleDownloadPdf = async () => {
    const toastId = toast.loading("Generando y descargando PDF...");
    try {
      const response = await api.get(`/zoosanitario/mascota/${mascotaId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Carnet-Zoosanitario-${data?.mascota?.nombre || 'Mascota'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      toast.success("Carnet PDF descargado exitosamente", { id: toastId });
    } catch (e) {
      toast.error("Error al descargar el carnet PDF", { id: toastId });
    }
  };

  // Helper to determine status color
  const getStatusBadge = (tipo: string, fechaProximaStr?: string) => {
    if (!fechaProximaStr) return <Badge variant="outline">Al día</Badge>;
    const proxima = new Date(fechaProximaStr);
    const hoy = new Date();
    const diff = proxima.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 rounded-full text-[10px] font-bold px-2 py-0.5">
          Vencida
        </Badge>
      );
    } else if (diffDays <= 7) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 border-0 text-white rounded-full text-[10px] font-bold px-2 py-0.5">
          Próxima
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 text-white rounded-full text-[10px] font-bold px-2 py-0.5">
          Al día
        </Badge>
      );
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p>Cargando carnet de control zoosanitario...</p>
      </div>
    );
  }

  const { vacunaciones, desparasitaciones, cirugias, tratamientos_libres, alertas } = data || {
    vacunaciones: [],
    desparasitaciones: [],
    cirugias: [],
    tratamientos_libres: [],
    alertas: [],
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN ALERTAS */}
      {alertas.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 backdrop-blur-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            Alertas Preventivas Pendientes ({alertas.length})
          </div>
          <ul className="text-xs space-y-2 text-amber-800 dark:text-amber-400 pl-7 list-disc">
            {alertas.map((a: any, idx: number) => (
              <li key={idx} className="leading-relaxed">
                <span className="font-semibold">{a.mensaje}</span>
                {a.observaciones && <span className="opacity-80"> — Obs: {a.observaciones}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* HEADER CONTROLES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Carnet de Control Zoosanitario
          </h2>
          <p className="text-xs text-muted-foreground">Calendario preventivo, vacunas, desparasitaciones, cirugías e historial cronológico.</p>
        </div>
        <Button onClick={handleDownloadPdf} variant="outline" className="rounded-xl h-9 text-xs font-bold gap-1.5 hover:bg-primary/10">
          <Download className="h-4 w-4" /> Guardar Carnet PDF
        </Button>
      </div>

      <Tabs defaultValue="vacunas" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-2 mb-4 gap-4">
          <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/30 h-10 w-full sm:w-auto">
            <TabsTrigger value="vacunas" className="rounded-xl px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Vacunas
            </TabsTrigger>
            <TabsTrigger value="desparasitaciones" className="rounded-xl px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Desparasitaciones
            </TabsTrigger>
            <TabsTrigger value="cirugias" className="rounded-xl px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Cirugías
            </TabsTrigger>
            <TabsTrigger value="tratamientos" className="rounded-xl px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Otros Tratamientos
            </TabsTrigger>
          </TabsList>

          {!readOnly && (
            <Button
              onClick={() => handleOpenDialog(activeTab as any)}
              className="rounded-xl h-9 text-xs font-bold gap-1 shadow-sm w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Agregar Registro
            </Button>
          )}
        </div>

        {/* TAB VACUNAS */}
        <TabsContent value="vacunas" className="outline-none mt-0">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="p-0 sm:px-6 py-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30">
                      <TableHead className="font-bold">Vacuna</TableHead>
                      <TableHead className="font-bold">Fecha Aplicación</TableHead>
                      <TableHead className="font-bold">Peso</TableHead>
                      <TableHead className="font-bold">Lote</TableHead>
                      <TableHead className="font-bold">Próxima Dosis</TableHead>
                      <TableHead className="font-bold text-center">Estado</TableHead>
                      {!readOnly && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vacunaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={readOnly ? 6 : 7} className="text-center py-8 text-muted-foreground text-xs">
                          No se registran vacunas aplicadas en el carnet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vacunaciones.map((v: any) => (
                        <TableRow key={v.id} className="border-b border-border/20 hover:bg-muted/10">
                          <TableCell className="font-semibold text-xs">{v.vacuna?.nombre || "General"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(v.fecha_aplicacion).toLocaleDateString("es-BO")}
                          </TableCell>
                          <TableCell className="text-xs">{v.peso_mascota_kg ? `${v.peso_mascota_kg} kg` : "N/A"}</TableCell>
                          <TableCell className="text-xs font-mono">{v.lote_vacuna || "N/A"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {v.fecha_proxima_dosis ? new Date(v.fecha_proxima_dosis).toLocaleDateString("es-BO") : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge("vacuna", v.fecha_proxima_dosis)}</TableCell>
                          {!readOnly && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(v.id, "vacuna")}
                                className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB DESPARASITACIONES */}
        <TabsContent value="desparasitaciones" className="outline-none mt-0">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="p-0 sm:px-6 py-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30">
                      <TableHead className="font-bold">Producto Utilizado</TableHead>
                      <TableHead className="font-bold">Fecha</TableHead>
                      <TableHead className="font-bold">Peso</TableHead>
                      <TableHead className="font-bold">Próxima Dosis</TableHead>
                      <TableHead className="font-bold text-center">Estado</TableHead>
                      <TableHead className="font-bold">Notas</TableHead>
                      {!readOnly && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {desparasitaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={readOnly ? 6 : 7} className="text-center py-8 text-muted-foreground text-xs">
                          No se registran desparasitaciones en el carnet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      desparasitaciones.map((d: any) => (
                        <TableRow key={d.id} className="border-b border-border/20 hover:bg-muted/10">
                          <TableCell className="font-semibold text-xs">{d.producto_utilizado}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(d.fecha).toLocaleDateString("es-BO")}
                          </TableCell>
                          <TableCell className="text-xs">{d.peso_kg ? `${d.peso_kg} kg` : "N/A"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {d.fecha_proxima ? new Date(d.fecha_proxima).toLocaleDateString("es-BO") : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge("desparasitacion", d.fecha_proxima)}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{d.notas || "N/A"}</TableCell>
                          {!readOnly && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(d.id, "desparasitacion")}
                                className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CIRUGIAS */}
        <TabsContent value="cirugias" className="outline-none mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cirugias.length === 0 ? (
              <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md col-span-2 py-8 text-center text-muted-foreground text-xs">
                No se registran cirugías históricas en el carnet.
              </Card>
            ) : (
              cirugias.map((c: any) => (
                <Card key={c.id} className="rounded-2xl border-border/30 bg-card/30 backdrop-blur-sm shadow-sm relative group overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-bold text-primary">{c.tipo_cirugia.toUpperCase()}</CardTitle>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c.id, "cirugia")}
                          className="h-7 w-7 hover:text-red-500 hover:bg-red-500/10 rounded-lg absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <CardDescription className="text-[10px] flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(c.fecha).toLocaleDateString("es-BO")}
                      {c.veterinario && (
                        <>
                          <span className="opacity-40">|</span>
                          <Stethoscope className="h-3 w-3 text-muted-foreground" /> {c.veterinario.nombres}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs leading-relaxed text-muted-foreground pt-0 pb-4">
                    {c.observaciones || "Sin observaciones registradas."}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB OTROS TRATAMIENTOS */}
        <TabsContent value="tratamientos" className="outline-none mt-0">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="p-6">
              {tratamientos_libres.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No se registran otros tratamientos preventivos libres.
                </div>
              ) : (
                <div className="relative pl-6 border-l border-border/40 space-y-6">
                  {tratamientos_libres.map((t: any) => (
                    <div key={t.id} className="relative group">
                      {/* Timeline Bullet */}
                      <span className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background border border-primary-foreground"></span>
                      
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-primary flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" /> {new Date(t.fecha).toLocaleDateString("es-BO")}
                            {t.veterinario && (
                              <>
                                <span className="opacity-40">|</span>
                                <span>Dr. {t.veterinario.nombres}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.descripcion}</p>
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(t.id, "tratamiento")}
                            className="h-7 w-7 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGO REGISTRO GENERAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-primary" />
                {dialogType === "vacuna" && "Registrar Vacuna"}
                {dialogType === "desparasitacion" && "Registrar Desparasitación"}
                {dialogType === "cirugia" && "Registrar Cirugía Histórica"}
                {dialogType === "tratamiento" && "Registrar Otro Tratamiento"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Complete el formulario para incorporar el evento preventivo al carnet zoosanitario.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* FECHA (Común a todos) */}
              <div>
                <Label htmlFor="fecha" className="text-xs font-semibold">Fecha de Evento</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                  required
                />
              </div>

              {/* CAMPOS VACUNA */}
              {dialogType === "vacuna" && (
                <>
                  <div>
                    <Label htmlFor="idVacuna" className="text-xs font-semibold">Vacuna a Aplicar</Label>
                    <Select value={idVacunaFk} onValueChange={setIdVacunaFk}>
                      <SelectTrigger className="w-full rounded-xl h-9 text-xs">
                        <SelectValue placeholder="Seleccione una vacuna" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {catalogoVacunas.map((cv) => (
                          <SelectItem key={cv.id} value={cv.id.toString()} className="text-xs">
                            {cv.nombre_vacuna || cv.nombre || "Vacuna"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="peso" className="text-xs font-semibold">Peso (kg)</Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 5.2"
                        value={pesoKg}
                        onChange={(e) => setPesoKg(e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lote" className="text-xs font-semibold">N° Lote</Label>
                      <Input
                        id="lote"
                        placeholder="Ej: L-01"
                        value={loteVacuna}
                        onChange={(e) => setLoteVacuna(e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fechaProxima" className="text-xs font-semibold">Fecha Próxima Vacuna</Label>
                    <Input
                      id="fechaProxima"
                      type="date"
                      value={fechaProxima}
                      onChange={(e) => setFechaProxima(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </>
              )}

              {/* CAMPOS DESPARASITACION */}
              {dialogType === "desparasitacion" && (
                <>
                  <div>
                    <Label htmlFor="producto" className="text-xs font-semibold">Producto Utilizado</Label>
                    <Input
                      id="producto"
                      placeholder="Ej: Drontal Plus"
                      value={productoUtilizado}
                      onChange={(e) => setProductoUtilizado(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="peso" className="text-xs font-semibold">Peso (kg)</Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 8.5"
                        value={pesoKg}
                        onChange={(e) => setPesoKg(e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaProxima" className="text-xs font-semibold">Próxima Dosis</Label>
                      <Input
                        id="fechaProxima"
                        type="date"
                        value={fechaProxima}
                        onChange={(e) => setFechaProxima(e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notas" className="text-xs font-semibold">Observaciones</Label>
                    <Textarea
                      id="notas"
                      placeholder="Dosis y recomendaciones adicionales"
                      value={notasDesparasitacion}
                      onChange={(e) => setNotasDesparasitacion(e.target.value)}
                      className="rounded-xl text-xs min-h-[60px]"
                    />
                  </div>
                </>
              )}

              {/* CAMPOS CIRUGIA */}
              {dialogType === "cirugia" && (
                <>
                  <div>
                    <Label htmlFor="tipo" className="text-xs font-semibold">Tipo de Cirugía</Label>
                    <Input
                      id="tipo"
                      placeholder="Ej: Esterilización Canina"
                      value={tipoCirugia}
                      onChange={(e) => setTipoCirugia(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="observaciones" className="text-xs font-semibold">Observaciones Clínicas / Reporte</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Detalles sobre el procedimiento, anestesia y posoperatorio..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="rounded-xl text-xs min-h-[90px]"
                    />
                  </div>
                </>
              )}

              {/* CAMPOS TRATAMIENTO */}
              {dialogType === "tratamiento" && (
                <div>
                  <Label htmlFor="descripcion" className="text-xs font-semibold">Descripción del Evento</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Ej: Gastroenteritis. Persisten síntomas, se administra suero fisiológico..."
                    value={descripcionTratamiento}
                    onChange={(e) => setDescripcionTratamiento(e.target.value)}
                    className="rounded-xl text-xs min-h-[110px]"
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-9 text-xs font-semibold">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl h-9 text-xs font-bold gap-1 shadow-sm">
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
