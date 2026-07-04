"use client";

import React, { useState, useEffect } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/domains/inventory/services/categories.service";
import { Categoria, Producto } from "../inventory.types";
import { toast } from "sonner";
import { ImageUploader } from "@/shared/components/ui/image-uploader";
import { productSchema } from "@/lib/validations/inventory.schemas";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

interface RegisterProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: any) => Promise<void>;
  editingProduct?: Producto | null;
}

type FormErrors = Partial<Record<string, string>>;

export function RegisterProductDialog({
  open,
  onOpenChange,
  onSave,
  editingProduct,
}: RegisterProductDialogProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    unidad_medida: "Unidad",
    requiere_receta: false,
    precio_venta: "",
    stock_actual: "",
    stock_minimo: "5",
    id_categoria_fk: "",
    imagen_url: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Categoria[]>({
    queryKey: ["categorias-producto"],
    queryFn: () => categoriesService.getAll().catch(() => []),
  });

  useEffect(() => {
    if (open) {
      setErrors({});
      if (editingProduct) {
        setFormData({
          nombre: editingProduct.nombre,
          descripcion: editingProduct.descripcion || "",
          unidad_medida: editingProduct.unidadMedida || "Unidad",
          requiere_receta: editingProduct.requiereReceta || false,
          precio_venta: editingProduct.precioVenta ? String(editingProduct.precioVenta) : "",
          stock_actual: editingProduct.stockActual ? String(editingProduct.stockActual) : "",
          stock_minimo: editingProduct.stockMinimo ? String(editingProduct.stockMinimo) : "5",
          id_categoria_fk: editingProduct.id_categoria_fk ? String(editingProduct.id_categoria_fk) : "",
          imagen_url: (editingProduct as any).imagen_url || "",
        });
      } else {
        setFormData({
          nombre: "",
          descripcion: "",
          unidad_medida: "Unidad",
          requiere_receta: false,
          precio_venta: "",
          stock_actual: "",
          stock_minimo: "5",
          id_categoria_fk: "",
          imagen_url: "",
        });
      }
    }
  }, [open, editingProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = productSchema.safeParse({
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      id_categoria_fk: formData.id_categoria_fk,
      unidad_medida: formData.unidad_medida,
      precio_venta: formData.precio_venta,
      stock_minimo: formData.stock_minimo || undefined,
      stock_actual: formData.stock_actual || undefined,
      requiere_receta: formData.requiere_receta,
      imagen_url: formData.imagen_url || undefined,
    });

    if (!result.success) {
      const errs: FormErrors = {};
      result.error.issues.forEach((err: any) => {
        const key = err.path[0] as string;
        if (!errs[key]) errs[key] = err.message;
      });
      setErrors(errs);
      toast.error("Por favor corrige los errores del formulario");
      return;
    }
    setErrors({});

    const payload: any = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      unidad_medida: formData.unidad_medida,
      requiere_receta: formData.requiere_receta,
      precio_venta: parseFloat(formData.precio_venta) || 0,
      stock_minimo: parseInt(formData.stock_minimo) || 5,
      id_categoria_fk: parseInt(formData.id_categoria_fk),
      ...(formData.imagen_url ? { imagen_url: formData.imagen_url } : {}),
    };

    if (editingProduct && formData.stock_actual !== "") {
      payload.stock_actual = parseInt(formData.stock_actual) || 0;
    }

    openConfirm({
      title: editingProduct ? "Guardar cambios" : "Registrar producto",
      description: editingProduct
        ? "¿Confirmar los cambios en este artículo del inventario?"
        : "¿Confirmar el registro de este nuevo artículo en el catálogo?",
      variant: editingProduct ? "warning" : "default",
      confirmLabel: editingProduct ? "Sí, guardar" : "Sí, registrar",
      onConfirm: async () => {
        await onSave(payload);
        onOpenChange(false);
      },
    });
  };

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!editingProduct && (
        <DialogTrigger asChild>
          <Button className="rounded-2xl shadow-md hover:-translate-y-0.5 transition-transform bg-primary text-primary-foreground font-semibold">
            <Plus className="h-5 w-5 mr-2" /> Agregar Item
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] border-border/40 bg-background/95 backdrop-blur-md rounded-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> {editingProduct ? "Editar Artículo" : "Registrar Nuevo Artículo"}
          </DialogTitle>
          <DialogDescription>
            {editingProduct
              ? "Modifica las especificaciones y niveles de stock del producto."
              : "Ingresa las especificaciones del fármaco o producto en el catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <ImageUploader
            label="Imagen del producto"
            placeholder="Seleccionar imagen"
            value={formData.imagen_url}
            onChange={(url) => setFormData({ ...formData, imagen_url: url })}
          />

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Comercial / Genérico *</Label>
            <Input
              id="nombre"
              placeholder="Ej. Tramadol Gotas 10ml"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`rounded-xl h-11 bg-muted/20 ${errors.nombre ? "border-destructive" : ""}`}
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Ej. Analgésico opioide para el alivio del dolor moderado a severo..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="rounded-xl bg-muted/20"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.id_categoria_fk}
                onValueChange={(v) => { setFormData({ ...formData, id_categoria_fk: v }); setErrors((p) => ({ ...p, id_categoria_fk: undefined })); }}
              >
                <SelectTrigger className={`rounded-xl h-11 bg-muted/20 ${errors.id_categoria_fk ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>Cargando...</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.id_categoria_fk && <p className="text-xs text-destructive">{errors.id_categoria_fk}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidad_medida">Unidad de Medida</Label>
              <Select
                value={formData.unidad_medida}
                onValueChange={(v) => setFormData({ ...formData, unidad_medida: v })}
              >
                <SelectTrigger className="rounded-xl h-11 bg-muted/20">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cápsula">Cápsula</SelectItem>
                  <SelectItem value="Frasco">Frasco</SelectItem>
                  <SelectItem value="Ampolla">Ampolla</SelectItem>
                  <SelectItem value="Unidad">Unidad</SelectItem>
                  <SelectItem value="Caja">Caja</SelectItem>
                  <SelectItem value="Mililitros">Mililitros</SelectItem>
                  <SelectItem value="Gramos">Gramos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {editingProduct && (
              <div className="space-y-2">
                <Label htmlFor="stock">Stock actual (corrección)</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock_actual}
                  onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                  className={`rounded-xl h-11 bg-muted/20 ${errors.stock_actual ? "border-destructive" : ""}`}
                  min="0"
                />
                {errors.stock_actual && <p className="text-xs text-destructive">{errors.stock_actual}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="stockMinimo">Stock minimo (alerta)</Label>
              <Input
                id="stockMinimo"
                type="number"
                placeholder="5"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                className={`rounded-xl h-11 bg-muted/20 ${errors.stock_minimo ? "border-destructive" : ""}`}
                min="0"
              />
              {errors.stock_minimo && <p className="text-xs text-destructive">{errors.stock_minimo}</p>}
            </div>
          </div>

          {!editingProduct && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 px-4 py-3 text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
              <p className="font-semibold">El stock empieza en 0</p>
              <p>Para ingresar unidades al inventario, registra un lote en la pestana <span className="font-semibold">Lotes &amp; Caducidad</span> despues de guardar el producto.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precioVenta">Precio Venta al Público (Bs) *</Label>
              <Input
                id="precioVenta"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                className={`rounded-xl h-11 bg-muted/20 ${errors.precio_venta ? "border-destructive" : ""}`}
                min="0"
              />
              {errors.precio_venta && <p className="text-xs text-destructive">{errors.precio_venta}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/10">
            <div className="space-y-0.5">
              <Label htmlFor="requiere_receta" className="text-sm font-semibold cursor-pointer">Requiere Receta Médica</Label>
              <p className="text-xs text-muted-foreground">Obligatorio receta firmada por veterinario para expender.</p>
            </div>
            <Switch
              id="requiere_receta"
              checked={formData.requiere_receta}
              onCheckedChange={(checked) => setFormData({ ...formData, requiere_receta: checked })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground">
              {editingProduct ? "Guardar Cambios" : "Guardar en Inventario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
