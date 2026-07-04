'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Plus, Pencil, Trash2, Stethoscope, Clock, DollarSign, Loader2, RefreshCw, ImageIcon } from 'lucide-react'
import { Servicio } from '@/domains/billing/services/services.service'
import { servicesService } from '@/domains/billing/services/services.service'
import { useCrud } from '@/shared/hooks/useCrud'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'
import { toast } from 'sonner'
import { ImageUploader } from '@/shared/components/ui/image-uploader'

type ServicioForm = {
  nombre: string;
  descripcion: string;
  precio: string;
  duracion: string;
  requiereVet: boolean;
  imagen_url: string;
}

const defaultForm: ServicioForm = { nombre: '', descripcion: '', precio: '', duracion: '', requiereVet: true, imagen_url: '' };

export default function ServiciosPage() {
  const { data: servicios, loading, error, refetch, createItem, updateItem, deleteItem } = useCrud<Servicio>(servicesService, 'servicios');

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Servicio | null>(null)
  const [form, setForm] = useState<ServicioForm>(defaultForm)

  const resetForm = () => setForm(defaultForm);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.precio || !form.duracion) return;
    const payload: any = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio),
      duracion_minutos: parseInt(form.duracion),
      requiere_veterinario: form.requiereVet,
      ...(form.imagen_url ? { imagen_url: form.imagen_url } : {}),
    };
    try {
      if (editing) {
        await updateItem({ id: editing.id, data: payload });
      } else {
        await createItem(payload);
      }
      setDialogOpen(false);
      resetForm();
      setEditing(null);
    } catch {
      // El error ya lo muestra el interceptor de axios
    }
  }

  const openEdit = (s: Servicio) => {
    setEditing(s);
    setForm({ nombre: s.nombre, descripcion: s.descripcion || '', precio: Number(s.precio).toString(), duracion: Number(s.duracion_minutos).toString(), requiereVet: s.requiereVeterinario, imagen_url: (s as any).imagen_url || '' });
    setDialogOpen(true);
  }

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  }

  const handleDelete = (id: number) => {
    openConfirm({
      title: 'Eliminar servicio',
      description: '¿Estás seguro de que deseas eliminar este servicio?',
      variant: 'destructive',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => { await deleteItem(id); },
    })
  }

  const handleActivar = async (id: number) => {
    try {
      await servicesService.activar(id);
      toast.success("Servicio reactivado exitosamente");
      refetch();
    } catch {
      toast.error("Error al reactivar el servicio");
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Stethoscope className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar los servicios. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Servicios</h1>
          <p className="text-muted-foreground mt-1">Administra los servicios clínicos y sus tarifas</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Servicio</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48 border-border/30 bg-card/30" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(servicios ?? []).map((s) => (
            <Card key={s.id} className="group transition-shadow hover:shadow-lg overflow-hidden">
              {(s as any).imagen_url ? (
                <div className="w-full h-32 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(s as any).imagen_url} alt={s.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : null}
              <CardHeader>
                <div className="flex items-center justify-between">
                  {!(s as any).imagen_url && <Stethoscope className="h-8 w-8 text-primary" />}
                  <div className="flex gap-1.5 items-center">
                    <Badge variant={s.requiereVeterinario ? 'default' : 'secondary'}>
                      {s.requiereVeterinario ? 'Requiere Vet.' : 'Sin Vet.'}
                    </Badge>
                    {s.deletedAt ? (
                      <Badge variant="destructive">Inactivo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">Activo</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{s.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Bs {Number(s.precio).toFixed(2)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {Number(s.duracion_minutos)} min</div>
                </div>
                <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)} disabled={!!s.deletedAt}><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                  {s.deletedAt ? (
                    <Button variant="outline" size="sm" onClick={() => handleActivar(s.id)}><RefreshCw className="mr-1 h-3 w-3 text-green-600" /> Reactivar</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="mr-1 h-3 w-3 text-destructive" /> Eliminar</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <ImageUploader
              label="Imagen del servicio"
              placeholder="Seleccionar imagen"
              value={form.imagen_url}
              onChange={(url) => setForm({ ...form, imagen_url: url })}
            />
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descripción</Label>
              <Textarea id="desc" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (Bs)</Label>
                <Input id="precio" type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (min)</Label>
                <Input id="duracion" type="number" value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Requiere Veterinario</Label>
                <p className="text-xs text-muted-foreground">Solo veterinarios pueden atender este servicio</p>
              </div>
              <Switch checked={form.requiereVet} onCheckedChange={(v) => setForm({ ...form, requiereVet: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nombre.trim() || !form.precio || !form.duracion}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  )
}