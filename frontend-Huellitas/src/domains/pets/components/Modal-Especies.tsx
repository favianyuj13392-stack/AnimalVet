"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Especie } from "../../pets/pets.types";
import { especieSchema, EspecieFormData } from "@/shared/lib/validation-schemas";
import { speciesService } from "@/domains/pets/services/especies.service";
import { useCrud } from "@/shared/hooks/useCrud";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Pencil, Trash2, PawPrint, Search, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/shared/components/ui/image-uploader";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

export function SpeciesManager() {
  const { data: especies, loading, error, refetch, createItem, updateItem, deleteItem } = useCrud<Especie>(speciesService, "especies");

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EspecieFormData>({
    resolver: zodResolver(especieSchema),
    defaultValues: { nombre: "" }
  });

  const handleEditClick = (especie: Especie) => {
    setEditingId(especie.id);
    reset({ nombre: especie.nombre });
    setImagenUrl((especie as any).imagen_url || "");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: EspecieFormData) => {
    try {
      const payload: any = { nombre: data.nombre };
      if (imagenUrl) payload.imagen_url = imagenUrl;
      if (editingId) {
        await updateItem({ id: editingId, data: payload });
      } else {
        await createItem(payload);
      }
      cerrarModal();
    } catch {
      // El error ya lo muestra el interceptor de axios
    }
  };

  const handleDelete = (id: number) => {
    openConfirm({
      title: 'Eliminar especie',
      description: '¿Estás seguro de que deseas eliminar esta especie?',
      variant: 'destructive',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => { await deleteItem(id); },
    });
  };

  const handleActivar = async (id: number) => {
    try {
      await speciesService.activar(id);
      toast.success("Especie reactivada exitosamente");
      refetch();
    } catch {
      toast.error("Error al reactivar la especie");
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImagenUrl("");
    reset({ nombre: "" });
  };

  const filteredEspecies = (especies ?? []).filter((e) =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <PawPrint className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar las especies. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Gestión de Especies
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las categorías de especies animales atendidas en la clínica.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open) cerrarModal();
          else setIsModalOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={cerrarModal} className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Nueva Especie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-primary" /> {editingId ? "Editar Especie" : "Registrar Especie"}
              </DialogTitle>
              <DialogDescription>
                Añade o modifica los nombres de las especies atendidas.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <ImageUploader
                label="Imagen de la especie"
                placeholder="Seleccionar imagen"
                value={imagenUrl}
                onChange={setImagenUrl}
              />

              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre de la Especie *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Felino, Canino, Reptil"
                  {...register("nombre")}
                  className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.nombre ? "border-destructive focus:ring-destructive" : ""}`}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.nombre.message}</p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={cerrarModal} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-semibold bg-primary text-primary-foreground">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Guardar Cambios" : "Crear Especie"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grilla visual resumida */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/30 bg-card/30 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredEspecies.slice(0, 4).map((esp) => (
            <Card key={esp.id} className="group relative overflow-hidden border-border/30 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50 hover:border-primary/30 shadow-md">
              {(esp as any).imagen_url && (
                <div className="w-full h-24 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(esp as any).imagen_url} alt={esp.nombre} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="flex flex-row items-center gap-4">
                {!(esp as any).imagen_url && (
                  <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                    <PawPrint className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg font-bold">{esp.nombre}</CardTitle>
                  <CardDescription>ID Catálogo: #{esp.id}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Listado en Tabla Completa */}
      <Card className="border-border/30 bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Listado Completo</CardTitle>
            <CardDescription>Muestra todas las especies configuradas en el sistema</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar especie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted/20 border-border/40 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando especies desde el servidor...</span>
            </div>
          ) : filteredEspecies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron especies que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/10">
                  <TableRow>
                    <TableHead className="w-24 px-6 py-3 font-semibold">ID</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Nombre de la Especie</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Estado</TableHead>
                    <TableHead className="text-right px-6 py-3 font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEspecies.map((esp) => (
                    <TableRow key={esp.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-xs text-muted-foreground">#{esp.id}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {(esp as any).imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(esp as any).imagen_url} alt={esp.nombre} className="h-8 w-8 rounded-lg object-cover border border-border/40 shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <PawPrint className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <Badge variant="secondary" className="rounded-lg font-medium text-sm py-0.5 px-2 bg-primary/5 text-primary border border-primary/10">
                            {esp.nombre}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {esp.deletedAt ? (
                          <Badge variant="destructive" className="rounded-lg">
                            Inactivo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 rounded-lg">
                            Activo
                          </Badge>
                        )}
                      </TableCell>
                       <TableCell className="text-right px-6 py-4 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(esp)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" disabled={!!esp.deletedAt}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {esp.deletedAt ? (
                          <Button variant="ghost" size="icon" onClick={() => handleActivar(esp.id)} className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-500" title="Reactivar">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(esp.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Desactivar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {confirmDialog}
    </div>
  );
}