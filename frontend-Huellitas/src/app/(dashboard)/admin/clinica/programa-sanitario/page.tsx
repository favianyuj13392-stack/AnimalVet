"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Badge } from "@/shared/components/ui/badge";
import {
  Plus,
  Trash,
  Edit2,
  Loader2,
  ShieldAlert,
  Settings,
  Syringe,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { zoosanitarioService, ProgramaItem } from "@/domains/clinical/services/zoosanitario.service";

export default function ProgramaSanitarioPage() {
  const [items, setItems] = useState<ProgramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [especieTab, setEspecieTab] = useState("Canino");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramaItem | null>(null);

  // Form states
  const [edadTexto, setEdadTexto] = useState("");
  const [edadDiasDesde, setEdadDiasDesde] = useState("");
  const [edadDiasHasta, setEdadDiasHasta] = useState("");
  const [detalle, setDetalle] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await zoosanitarioService.listProgramaItems(especieTab);
      setItems(res || []);
    } catch (err) {
      toast.error("Error al cargar los ítems del programa sanitario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [especieTab]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setEdadTexto("");
    setEdadDiasDesde("");
    setEdadDiasHasta("");
    setDetalle("");
    setObservaciones("");
    setOrden((items.length * 10).toString());
    setActivo(true);
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: ProgramaItem) => {
    setEditingItem(item);
    setEdadTexto(item.edadTexto);
    setEdadDiasDesde(item.edadDiasDesde?.toString() || "");
    setEdadDiasHasta(item.edadDiasHasta?.toString() || "");
    setDetalle(item.detalle);
    setObservaciones(item.observaciones || "");
    setOrden(item.orden.toString());
    setActivo(item.activo);
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edadTexto) return toast.error("La edad sugerida es obligatoria");
    if (!detalle) return toast.error("El detalle/procedimiento es obligatorio");

    setSubmitting(true);
    const payload = {
      especie: especieTab,
      edad_texto: edadTexto,
      edad_dias_desde: edadDiasDesde ? Number(edadDiasDesde) : undefined,
      edad_dias_hasta: edadDiasHasta ? Number(edadDiasHasta) : undefined,
      detalle,
      observaciones: observaciones || undefined,
      orden: Number(orden) || 0,
      activo,
    };

    try {
      if (editingItem) {
        await zoosanitarioService.updateProgramaItem(editingItem.id, payload);
        toast.success("Ítem actualizado exitosamente");
      } else {
        await zoosanitarioService.createProgramaItem(payload);
        toast.success("Ítem creado exitosamente");
      }
      setOpenDialog(false);
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar el ítem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este ítem preventivo?")) return;

    try {
      await zoosanitarioService.deleteProgramaItem(id);
      toast.success("Ítem eliminado exitosamente");
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar el ítem");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Botón Volver */}
      <div>
        <Button variant="ghost" asChild className="mb-4 text-muted-foreground hover:text-primary rounded-xl -ml-4">
          <Link href="/admin/clinica">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Supervisión
          </Link>
        </Button>
      </div>

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Programa Sanitario Preventivo
          </h1>
          <p className="text-sm text-muted-foreground">Configure el calendario de vacunas y desparasitaciones sugeridas por especie y edad.</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl h-10 font-bold gap-1 shadow-sm">
          <Plus className="h-4 w-4" /> Agregar Ítem
        </Button>
      </div>

      {/* Tabs por especie */}
      <Tabs defaultValue="Canino" value={especieTab} onValueChange={setEspecieTab} className="w-full">
        <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/30 h-10 w-full sm:w-[300px] mb-6">
          <TabsTrigger value="Canino" className="rounded-xl px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">
            Programa Canino
          </TabsTrigger>
          <TabsTrigger value="Felino" className="rounded-xl px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">
            Programa Felino
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-3xl border-border/40 bg-card/25 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Calendario de sugerencias - Especie {especieTab}
            </CardTitle>
            <CardDescription className="text-xs">
              Los ítems configurados aquí son usados por el sistema para alertar sobre vacunas y desparasitaciones vencidas o próximas en la ficha del paciente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:px-6 py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-xs">Cargando catálogo preventivo...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No hay ítems preventivos configurados para {especieTab}. Presione "Agregar Ítem" para iniciar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30">
                      <TableHead className="font-bold w-[120px]">Edad Sugerida</TableHead>
                      <TableHead className="font-bold w-[130px]">Rango Edad (días)</TableHead>
                      <TableHead className="font-bold">Detalle / Procedimiento</TableHead>
                      <TableHead className="font-bold">Observaciones</TableHead>
                      <TableHead className="font-bold w-[80px] text-center">Orden</TableHead>
                      <TableHead className="font-bold w-[90px] text-center">Estado</TableHead>
                      <TableHead className="w-[100px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="border-b border-border/20 hover:bg-muted/10">
                        <TableCell className="font-bold text-xs">{item.edadTexto}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {item.edadDiasDesde ?? 0} a {item.edadDiasHasta ?? "∞"} d
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary">{item.detalle}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.observaciones || "—"}</TableCell>
                        <TableCell className="text-xs text-center font-mono">{item.orden}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              item.activo
                                ? "bg-emerald-500 hover:bg-emerald-600 border-0 rounded-full font-bold text-[10px] px-2"
                                : "bg-slate-400 hover:bg-slate-500 border-0 rounded-full font-bold text-[10px] px-2"
                            }
                          >
                            {item.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 hover:text-primary hover:bg-primary/10 rounded-lg"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* DIÁLOGO CREAR / EDITAR */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-primary" />
                {editingItem ? "Editar Ítem Preventivo" : "Agregar Ítem Preventivo"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina el procedimiento preventivo para {especieTab} y asigne un rango de edad recomendado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="edadTexto" className="text-xs font-semibold">Edad Sugerida (etiqueta)</Label>
                <Input
                  id="edadTexto"
                  placeholder="Ej: 6-8 semanas, 3 meses, Anual"
                  value={edadTexto}
                  onChange={(e) => setEdadTexto(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="desde" className="text-xs font-semibold">Edad Mínima (días)</Label>
                  <Input
                    id="desde"
                    type="number"
                    placeholder="Ej: 42"
                    value={edadDiasDesde}
                    onChange={(e) => setEdadDiasDesde(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="hasta" className="text-xs font-semibold">Edad Máxima (días)</Label>
                  <Input
                    id="hasta"
                    type="number"
                    placeholder="Ej: 56"
                    value={edadDiasHasta}
                    onChange={(e) => setEdadDiasHasta(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="detalle" className="text-xs font-semibold">Detalle del Procedimiento</Label>
                <Input
                  id="detalle"
                  placeholder="Ej: Vacuna Parvovirus + Moquillo"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="observaciones" className="text-xs font-semibold">Observaciones preventivas</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Instrucciones adicionales para el tutor o médico"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="rounded-xl text-xs min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <Label htmlFor="orden" className="text-xs font-semibold">Orden de Despliegue</Label>
                  <Input
                    id="orden"
                    type="number"
                    placeholder="Ej: 10"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="activo"
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="rounded h-4 w-4 text-primary border-border focus:ring-primary"
                  />
                  <Label htmlFor="activo" className="text-xs font-semibold select-none cursor-pointer">Activo</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-9 text-xs font-semibold">
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
