"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Categoria } from "../inventory.types";
import { categoriaSchema, CategoriaFormData } from "@/shared/lib/validation-schemas";
import { categoriesService } from "@/domains/inventory/services/categories.service";
import { useCrud } from "@/shared/hooks/useCrud";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Pencil, Trash2, Package, Search, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function ProductCategoriesManager() {
  const { data: categorias, loading, error, refetch, createItem, updateItem, deleteItem } = useCrud<Categoria>(categoriesService, "categorias-producto");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombre: "", descripcion: "" }
  });

  const handleEditClick = (categoria: Categoria) => {
    setEditingId(categoria.id);
    reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || ""
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CategoriaFormData) => {
    try {
      if (editingId) {
        await updateItem({ id: editingId, data: { nombre: data.nombre, descripcion: data.descripcion } });
      } else {
        await createItem({ nombre: data.nombre, descripcion: data.descripcion });
      }
      cerrarModal();
    } catch {
      // El error ya lo muestra el interceptor de axios
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteItem(id);
    } catch {
      // El error ya lo muestra el interceptor de axios
    }
  };

  const handleActivar = async (id: number) => {
    try {
      await categoriesService.activar(id);
      toast.success("Categoría reactivada exitosamente");
      refetch();
    } catch {
      toast.error("Error al reactivar la categoría");
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset({ nombre: "", descripcion: "" });
  };

  const filteredCategorias = (categorias ?? []).filter((c) => {
    const nameMatch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nameMatch || descMatch;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Package className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar las categorías. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Categorías de Producto
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiza los productos e insumos médicos del inventario general.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open) cerrarModal();
          else setIsModalOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={cerrarModal} className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> {editingId ? "Editar Categoría" : "Registrar Categoría"}
              </DialogTitle>
              <DialogDescription>
                Añade una nueva clasificación para organizar los insumos en stock.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre de la Categoría *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Farmacia, Juguetes, Dietas"
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
                  placeholder="Ej. Insumos del laboratorio y vacunas..."
                  {...register("descripcion")}
                  className={`rounded-xl bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.descripcion ? "border-destructive focus:ring-destructive" : ""}`}
                  rows={3}
                />
                {errors.descripcion && (
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.descripcion.message}</p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={cerrarModal} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-semibold bg-primary text-primary-foreground">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Guardar Cambios" : "Crear Categoría"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grilla de resumen */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/30 bg-card/30 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredCategorias.slice(0, 4).map((categoria) => (
            <Card key={categoria.id} className="group relative overflow-hidden border-border/30 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50 hover:border-primary/30 shadow-md">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold truncate">{categoria.nombre}</CardTitle>
                  <CardDescription className="truncate">{categoria.descripcion || "Sin descripción"}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Tabla Completa */}
      <Card className="border-border/30 bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Listado de Categorías</CardTitle>
            <CardDescription>Visualiza y administra las familias de productos</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoría..."
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
              <span className="text-sm">Cargando categorías desde el servidor...</span>
            </div>
          ) : filteredCategorias.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron categorías en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/10">
                  <TableRow>
                    <TableHead className="w-24 px-6 py-3 font-semibold">ID</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Nombre</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Descripción</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Estado</TableHead>
                    <TableHead className="text-right px-6 py-3 font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategorias.map((categoria) => (
                    <TableRow key={categoria.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-xs text-muted-foreground">#{categoria.id}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-card-foreground">
                        <Badge variant="secondary" className="rounded-lg">
                          {categoria.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground max-w-md truncate">
                        {categoria.descripcion || "—"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {categoria.deletedAt ? (
                          <Badge variant="destructive" className="rounded-lg">Inactivo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 rounded-lg">Activo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(categoria)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" disabled={!!categoria.deletedAt}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {categoria.deletedAt ? (
                          <Button variant="ghost" size="icon" onClick={() => handleActivar(categoria.id)} className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-500" title="Reactivar">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(categoria.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Desactivar">
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
    </div>
  );
}
