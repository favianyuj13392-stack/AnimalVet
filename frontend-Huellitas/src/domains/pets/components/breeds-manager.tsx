"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Raza, Especie } from "../pets.types";
import { razaSchema, RazaFormData } from "@/shared/lib/validation-schemas";
import { breedsService } from "@/domains/pets/services/breeds.service";
import { speciesService } from "@/domains/pets/services/especies.service";
import { useCrud } from "@/shared/hooks/useCrud";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Pencil, Trash2, Bone, Search, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function BreedsManager() {
  // Cargamos razas Y especies desde el API en paralelo
  const { data: razas, loading: loadingRazas, error: errorRazas, refetch, createItem, updateItem, deleteItem } = useCrud<Raza>(breedsService, "razas");
  const { data: especies, loading: loadingEspecies } = useCrud<Especie>(speciesService, "especies");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<RazaFormData>({
    resolver: zodResolver(razaSchema),
    defaultValues: { nombre: "", id_especie_fk: undefined }
  });

  const selectedEspecieId = watch("id_especie_fk");

  const handleEditClick = (raza: Raza) => {
    setEditingId(raza.id);
    reset({
      nombre: raza.nombre,
      id_especie_fk: raza.id_especie_fk
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: RazaFormData) => {
    try {
      if (editingId) {
        await updateItem({ id: editingId, data: { nombre: data.nombre, id_especie_fk: data.id_especie_fk } });
      } else {
        await createItem({ nombre: data.nombre, id_especie_fk: data.id_especie_fk });
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
      await breedsService.activar(id);
      toast.success("Raza reactivada exitosamente");
      refetch();
    } catch {
      toast.error("Error al reactivar la raza");
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset({ nombre: "", id_especie_fk: undefined });
  };

  const getEspecieName = (raza: Raza) => {
    if (raza.especie && raza.especie.nombre) {
      return raza.especie.nombre;
    }
    const found = (especies ?? []).find((e) => Number(e.id) === Number(raza.id_especie_fk));
    return found ? found.nombre : "—";
  };

  const filteredRazas = (razas ?? []).filter((r) => {
    const breedMatch = r.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const speciesName = getEspecieName(r);
    const speciesMatch = speciesName.toLowerCase().includes(searchTerm.toLowerCase());
    return breedMatch || speciesMatch;
  });

  const loading = loadingRazas || loadingEspecies;

  if (errorRazas) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Bone className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar las razas. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Gestión de Razas
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las razas y emparéjalas con sus respectivas especies biológicas.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open) cerrarModal();
          else setIsModalOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button onClick={cerrarModal} className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Nueva Raza
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Bone className="h-5 w-5 text-primary" /> {editingId ? "Editar Raza" : "Registrar Raza"}
              </DialogTitle>
              <DialogDescription>
                Añade una nueva raza y configúrala con su especie correspondiente.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-semibold">Nombre de la Raza *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Pastor Alemán, Siamés, Husky"
                  {...register("nombre")}
                  className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.nombre ? "border-destructive focus:ring-destructive" : ""}`}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_especie_fk" className="text-sm font-semibold">Especie Perteneciente *</Label>
                <Select
                  value={selectedEspecieId?.toString() || ""}
                  onValueChange={(val) => setValue("id_especie_fk", parseInt(val), { shouldValidate: true })}
                >
                  <SelectTrigger className={`rounded-xl h-11 bg-muted/30 focus:border-primary/50 focus:ring-1 focus:ring-primary ${errors.id_especie_fk ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={loadingEspecies ? "Cargando especies..." : "Seleccionar especie"} />
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

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={cerrarModal} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-semibold bg-primary text-primary-foreground">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Guardar Cambios" : "Crear Raza"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grilla visual resumida */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/30 bg-card/30 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRazas.slice(0, 3).map((raza) => (
            <Card key={raza.id} className="group relative overflow-hidden border-border/30 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50 hover:border-primary/30 shadow-md">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                  <Bone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{raza.nombre}</CardTitle>
                  <CardDescription>Clase: {getEspecieName(raza)}</CardDescription>
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
            <CardTitle className="text-xl font-bold">Razas Registradas</CardTitle>
            <CardDescription>Muestra el listado de razas y su vinculación biológica</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar raza o especie..."
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
              <span className="text-sm">Cargando razas desde el servidor...</span>
            </div>
          ) : filteredRazas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron razas en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/10">
                  <TableRow>
                    <TableHead className="w-24 px-6 py-3 font-semibold">ID</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Raza</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Especie Relacionada</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Estado</TableHead>
                    <TableHead className="text-right px-6 py-3 font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRazas.map((raza) => (
                    <TableRow key={raza.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-xs text-muted-foreground">#{raza.id}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-card-foreground">{raza.nombre}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="rounded-lg font-medium text-xs bg-muted border-border">
                          {getEspecieName(raza)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {raza.deletedAt ? (
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
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(raza)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" disabled={!!raza.deletedAt}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {raza.deletedAt ? (
                          <Button variant="ghost" size="icon" onClick={() => handleActivar(raza.id)} className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-500" title="Reactivar">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(raza.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Desactivar">
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
