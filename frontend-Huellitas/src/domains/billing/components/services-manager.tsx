"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Servicio } from "../services/services.service";
import { servicioSchema, ServicioFormData } from "@/shared/lib/validation-schemas";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Pencil, Trash2, Stethoscope, Clock, Coins, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/shared/components/ui/image-uploader";

export function ServicesManager() {
  const [servicios, setServicios] = useState<Servicio[]>([
    { id: 1, nombre: "Consulta General", descripcion: "Control rutinario y chequeo general de signos vitales.", precio: 100, duracion_minutos: 30, requiere_veterinario: true },
    { id: 2, nombre: "Consulta Emergencia", descripcion: "Atención urgente ante traumatismos o problemas agudos.", precio: 180, duracion_minutos: 30, requiere_veterinario: true },
    { id: 3, nombre: "Peluquería y Baño", descripcion: "Corte estético, baño medicado o limpieza sanitaria.", precio: 80, duracion_minutos: 60, requiere_veterinario: false },
    { id: 4, nombre: "Hospitalización/Día", descripcion: "Cuidado clínico intensivo y canil asignado.", precio: 150, duracion_minutos: 1440, requiere_veterinario: true },
    { id: 5, nombre: "Vacunación", descripcion: "Aplicación de inmunizaciones y control de vacunas.", precio: 60, duracion_minutos: 15, requiere_veterinario: true },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ServicioFormData>({
    resolver: zodResolver(servicioSchema),
    defaultValues: { nombre: "", descripcion: "", precio: 0, duracion_minutos: 30, requiere_veterinario: true }
  });

  const requiereVet = watch("requiere_veterinario");

  const handleEditClick = (servicio: Servicio) => {
    setEditingId(servicio.id);
    reset({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || "",
      precio: Number(servicio.precio),
      duracion_minutos: Number(servicio.duracion_minutos),
      requiere_veterinario: servicio.requiere_veterinario
    });
    setImagenUrl((servicio as any).imagen_url || "");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ServicioFormData) => {
    const extra = imagenUrl ? { imagen_url: imagenUrl } : {};
    if (editingId) {
      setServicios((prev) => prev.map((s) => s.id === editingId ? { ...s, ...data, ...extra } as any : s));
      toast.success("Servicio actualizado correctamente (Simulado)");
    } else {
      setServicios((prev) => [...prev, { id: prev.length + 1, ...data, ...extra } as any]);
      toast.success("Servicio creado correctamente (Simulado)");
    }
    cerrarModal();
  };

  const deleteItem = (id: number) => {
    setServicios((prev) => prev.filter((s) => s.id !== id));
    toast.success("Servicio eliminado correctamente (Simulado)");
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImagenUrl("");
    reset({ nombre: "", descripcion: "", precio: 0, duracion_minutos: 30, requiere_veterinario: true });
  };

  const filteredServicios = servicios.filter((s) =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.descripcion && s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Gestión de Servicios
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra los servicios clínicos ofrecidos, tarifas base y tiempos de consulta.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open) cerrarModal();
          else setIsModalOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={cerrarModal} className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> {editingId ? "Editar Servicio" : "Registrar Servicio"}
              </DialogTitle>
              <DialogDescription>
                Modifica el catálogo de atención clínica y estética de la veterinaria.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <ImageUploader
                label="Imagen del servicio"
                placeholder="Seleccionar imagen"
                value={imagenUrl}
                onChange={setImagenUrl}
              />

              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre del Servicio *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Ecografía Abdominal, Profilaxis"
                  {...register("nombre")}
                  className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.nombre ? "border-destructive focus:ring-destructive" : ""}`}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-semibold">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Detalles sobre el procedimiento o restricciones..."
                  {...register("descripcion")}
                  className="rounded-xl min-h-20 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio" className="text-sm font-semibold">Precio Base (Bs) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground font-bold">Bs</span>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("precio", { valueAsNumber: true })}
                      className={`pl-9 rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.precio ? "border-destructive focus:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.precio && (
                    <p className="text-xs text-destructive mt-1 font-medium">{errors.precio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracion_minutos" className="text-sm font-semibold">Duración (minutos) *</Label>
                  <Input
                    id="duracion_minutos"
                    type="number"
                    placeholder="30"
                    {...register("duracion_minutos", { valueAsNumber: true })}
                    className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.duracion_minutos ? "border-destructive focus:ring-destructive" : ""}`}
                  />
                  {errors.duracion_minutos && (
                    <p className="text-xs text-destructive mt-1 font-medium">{errors.duracion_minutos.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Requiere Veterinario</Label>
                  <p className="text-xs text-muted-foreground">
                    Define si solo personal médico puede atender este turno.
                  </p>
                </div>
                <Switch
                  checked={requiereVet}
                  onCheckedChange={(val) => setValue("requiere_veterinario", val)}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={cerrarModal} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-semibold bg-primary text-primary-foreground">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Guardar Cambios" : "Crear Servicio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grilla visual resumida */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServicios.slice(0, 3).map((serv) => (
          <Card key={serv.id} className="group relative overflow-hidden border-border/30 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50 hover:border-primary/30 shadow-md">
            {(serv as any).imagen_url && (
              <div className="w-full h-28 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(serv as any).imagen_url} alt={serv.nombre} className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <Badge variant={serv.requiere_veterinario ? "default" : "secondary"} className="rounded-lg text-xs font-semibold">
                  {serv.requiere_veterinario ? "Clínico (Vet)" : "Estética / Otros"}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-3">{serv.nombre}</CardTitle>
              <CardDescription className="line-clamp-1">{serv.descripcion || "Sin descripción"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4 text-primary" /> {serv.duracion_minutos} min</span>
              <span className="font-bold text-card-foreground">Bs {Number(serv.precio).toFixed(2)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Listado en Tabla Completa */}
      <Card className="border-border/30 bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Listado de Servicios</CardTitle>
            <CardDescription>Catálogo de servicios y asignación de tarifas médicas</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted/20 border-border/40 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredServicios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron servicios configurados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/10">
                  <TableRow>
                    <TableHead className="w-24 px-6 py-3 font-semibold">ID</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Nombre</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Duración</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Requerimiento</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Precio Base</TableHead>
                    <TableHead className="text-right px-6 py-3 font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServicios.map((serv) => (
                    <TableRow key={serv.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-xs text-muted-foreground">#{serv.id}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-card-foreground">
                        <div className="flex items-center gap-3">
                          {(serv as any).imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(serv as any).imagen_url} alt={serv.nombre} className="h-9 w-9 rounded-lg object-cover border border-border/40 shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Stethoscope className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p>{serv.nombre}</p>
                            {serv.descripcion && <p className="text-xs font-normal text-muted-foreground line-clamp-1 mt-0.5">{serv.descripcion}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> {serv.duracion_minutos} min</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant={serv.requiere_veterinario ? "default" : "secondary"} className="rounded-lg text-xs font-medium">
                          {serv.requiere_veterinario ? "Requiere Veterinario" : "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-sm font-semibold text-card-foreground">
                        Bs {Number(serv.precio).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(serv)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(serv.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
