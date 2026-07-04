"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Vacuna } from "../clinical.types";
import { Especie } from "@/domains/pets/pets.types";
import { Producto } from "@/domains/inventory/inventory.types"; // <-- Importamos Producto
import { vacunaSchema, VacunaFormData } from "@/shared/lib/validation-schemas";
import { vaccinesCatalogService } from "@/domains/clinical/services/vaccines-catalog.service";
import { speciesService } from "@/domains/pets/services/especies.service";
import { productosService } from "@/domains/inventory/services/productos.service"; // <-- Importamos el servicio
import { useCrud } from "@/shared/hooks/useCrud";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Pencil, Trash2, Syringe, Search, Loader2, Calendar, RefreshCw, Package } from "lucide-react";

export function VaccinesCatalogManager() {
  // Cargamos vacunas, especies y AHORA PRODUCTOS en paralelo
  const { data: vacunas, loading: loadingVacunas, error: errorVacunas, refetch, createItem, updateItem, deleteItem } = useCrud<Vacuna>(vaccinesCatalogService, "catalogo-vacunas");
  const { data: especies, loading: loadingEspecies } = useCrud<Especie>(speciesService, "especies");
const { data: productos, loading: loadingProductos } = useCrud<Producto>(productosService as any, "productos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<VacunaFormData>({
    resolver: zodResolver(vacunaSchema),
    defaultValues: { nombre: "", descripcion: "", diasParaRefuerzo: 365, id_especie_fk: undefined, id_producto_fk: undefined }
  });

  const selectedEspecieId = watch("id_especie_fk");
  const selectedProductoId = watch("id_producto_fk");
console.log("Vacunas cargadas:", vacunas);
  const handleEditClick = (vacuna: Vacuna) => {
    setEditingId(vacuna.id);
    reset({
      nombre: vacuna.nombre_vacuna,
      descripcion: vacuna.descripcion || "",
      diasParaRefuerzo: Number(vacuna.intervalo_revacunacion) || 365,
      id_especie_fk: vacuna.id_especie_fk,
      id_producto_fk: vacuna.id_producto_fk || undefined // <-- Cargamos el enlace actual
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: VacunaFormData) => {
    try {
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        dias_para_refuerzo: data.diasParaRefuerzo,
        id_especie_fk: data.id_especie_fk,
        id_producto_fk: data.id_producto_fk || null // <-- Se envía null si no seleccionó nada
      };

      if (editingId) {
        await updateItem({ id: editingId, data: payload });
        toast.success("Vacuna actualizada correctamente");
      } else {
        await createItem(payload);
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
      await vaccinesCatalogService.activar(id);
      toast.success("Vacuna reactivada exitosamente");
      refetch();
    } catch {
      toast.error("Error al reactivar la vacuna");
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset({ nombre: "", descripcion: "", diasParaRefuerzo: 365, id_especie_fk: undefined, id_producto_fk: undefined });
  };

  const getEspecieName = (id_especie: number | string | undefined | null) => {
    if (id_especie === undefined || id_especie === null) return "—";
    const found = (especies ?? []).find((e) => Number(e.id) === Number(id_especie));
    return found ? found.nombre : "—";
  };

 const filteredVacunas = (vacunas ?? []).filter((v) => {
    const search = (searchTerm || "").toLowerCase();
    
    // 👇 AHORA LEEMOS v.nombre_vacuna
    const nameMatch = (v.nombre_vacuna || "").toLowerCase().includes(search);
    const descMatch = (v.descripcion || "").toLowerCase().includes(search);
    const speciesMatch = getEspecieName(v.id_especie_fk).toLowerCase().includes(search);
    
    return nameMatch || descMatch || speciesMatch;
  });

  const loading = loadingVacunas || loadingEspecies || loadingProductos;

  if (errorVacunas) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Syringe className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar las vacunas. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Catálogo de Vacunas
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las vacunas disponibles, la especie biológica a la que aplica y la frecuencia de su refuerzo.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open) cerrarModal();
          else setIsModalOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={cerrarModal} className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Nueva Vacuna
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Syringe className="h-5 w-5 text-primary" /> {editingId ? "Editar Vacuna" : "Registrar Vacuna"}
              </DialogTitle>
              <DialogDescription>
                Añade una nueva vacuna al catálogo de inmunizaciones y enlázala al inventario.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre de la Vacuna *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Antirrábica Felina, Óctuple"
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
                  placeholder="Ej. Indicaciones, vía de aplicación..."
                  {...register("descripcion")}
                  className={`rounded-xl bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.descripcion ? "border-destructive focus:ring-destructive" : ""}`}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_especie_fk" className="text-sm font-semibold">Especie *</Label>
                  <Select
                    value={selectedEspecieId?.toString() || ""}
                    onValueChange={(val) => setValue("id_especie_fk", parseInt(val), { shouldValidate: true })}
                  >
                    <SelectTrigger className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.id_especie_fk ? "border-destructive" : ""}`}>
                      <SelectValue placeholder={loadingEspecies ? "Cargando..." : "Seleccionar"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 bg-background/95">
                      {(especies ?? []).map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.id_especie_fk && (
                    <p className="text-xs text-destructive mt-1 font-medium">{errors.id_especie_fk.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diasParaRefuerzo" className="text-sm font-semibold">Días para Refuerzo *</Label>
                  <Input
                    id="diasParaRefuerzo"
                    type="number"
                    placeholder="365"
                    {...register("diasParaRefuerzo", { valueAsNumber: true })}
                    className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.diasParaRefuerzo ? "border-destructive focus:ring-destructive" : ""}`}
                  />
                  {errors.diasParaRefuerzo && (
                    <p className="text-xs text-destructive mt-1 font-medium">{errors.diasParaRefuerzo.message}</p>
                  )}
                </div>
              </div>

              {/* NUEVO COMBO BOX: ENLACE AL INVENTARIO */}
              <div className="space-y-2">
                <Label htmlFor="id_producto_fk" className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" /> Enlace a Producto de Inventario
                </Label>
                <Select
                  value={selectedProductoId || "none"}
                  onValueChange={(val) => setValue("id_producto_fk", val === "none" ? undefined : val, { shouldValidate: true })}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder={loadingProductos ? "Cargando almacén..." : "Seleccionar frasco físico"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 bg-background/95 max-h-60">
                    <SelectItem value="none" className="text-muted-foreground italic">Sin enlace físico a inventario</SelectItem>
                    {(productos ?? []).filter(p => !p.deletedAt).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} — Stock: <span className={p.stockActual <= 0 ? "text-destructive font-bold" : ""}>{p.stockActual}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Al enlazar un producto, el stock se descontará automáticamente al aplicar esta vacuna en clínica.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={cerrarModal} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-semibold bg-primary text-primary-foreground shadow-md hover:-translate-y-0.5 transition-transform">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Guardar Cambios" : "Crear Vacuna"}
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
          {filteredVacunas.slice(0, 4).map((vacuna) => (
            <Card key={vacuna.id} className="group relative overflow-hidden border-border/30 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50 hover:border-primary/30 shadow-md">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                  <Syringe className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
<CardTitle className="text-base font-bold truncate">{vacuna.nombre_vacuna}</CardTitle>                  <CardDescription className="truncate">Especie: {getEspecieName(vacuna.id_especie_fk)}</CardDescription>
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
            <CardTitle className="text-xl font-bold">Inmunizaciones</CardTitle>
            <CardDescription>Catálogo biológico del centro de salud</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vacuna o especie..."
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
              <span className="text-sm">Cargando catálogo de vacunas...</span>
            </div>
          ) : filteredVacunas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron vacunas en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/10">
                  <TableRow>
                    <TableHead className="w-16 px-6 py-3 font-semibold">ID</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Nombre</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Especie</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Inventario</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Refuerzo</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Estado</TableHead>
                    <TableHead className="text-right px-6 py-3 font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVacunas.map((vacuna) => (
                    <TableRow key={vacuna.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-xs text-muted-foreground">#{vacuna.id}</TableCell>
                      <TableCell className="px-6 py-4 font-bold text-card-foreground">{vacuna.nombre_vacuna}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="rounded-lg font-medium text-xs bg-muted border-border">
                          {getEspecieName(vacuna.id_especie_fk)}
                        </Badge>
                      </TableCell>
                      
                      {/* COLUMNA DE INVENTARIO */}
                      <TableCell className="px-6 py-4">
                        {vacuna.producto ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-primary flex items-center gap-1">
                              <Package className="h-3 w-3" /> Enlazado
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {vacuna.producto.nombre}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No enlazado</span>
                        )}
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {vacuna.intervalo_revacunacion} días
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {vacuna.deletedAt ? (
                          <Badge variant="destructive" className="rounded-lg">Inactivo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 rounded-lg">Activo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(vacuna)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" disabled={!!vacuna.deletedAt}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {vacuna.deletedAt ? (
                          <Button variant="ghost" size="icon" onClick={() => handleActivar(vacuna.id)} className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-500" title="Reactivar">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vacuna.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Desactivar">
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