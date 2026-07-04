'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { ShieldCheck, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Rol } from '@/domains/users/users.types'
import { rolesService } from '@/domains/users/services/roles.service'
import { useCrud } from '@/shared/hooks/useCrud'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'

const permissionMap: Record<string, string[]> = {
  Administrador: ['usuarios.*', 'finanzas.*', 'reportes.*', 'inventario.*', 'configuracion.*'],
  Veterinario: ['historia_clinica.*', 'hospitalizaciones.*', 'recetas.*', 'citas.*'],
  Cajero: ['caja.*', 'agenda.*', 'productos.venta', 'servicios.cobro'],
  Cliente: ['mascotas.propias', 'citas.agendar', 'portal.autogestion'],
}

export default function RolesPage() {
  const { data: roles, loading, error, createItem, updateItem, deleteItem } = useCrud<Rol>(rolesService, 'roles');

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<Rol | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    try {
      if (editRole) {
        await updateItem({ id: editRole.id, data: form });
      } else {
        await createItem(form);
      }
      setDialogOpen(false);
      setForm({ nombre: '', descripcion: '' });
      setEditRole(null);
    } catch {
      // El error ya lo muestra el interceptor de axios
    }
  }

  const handleEdit = (rol: Rol) => {
    setEditRole(rol);
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
    setDialogOpen(true);
  }

  const handleDelete = (id: number) => {
    openConfirm({
      title: 'Eliminar rol',
      description: '¿Estás seguro de que deseas eliminar este rol?',
      variant: 'destructive',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => { await deleteItem(id); },
    })
  }

  const openCreate = () => {
    setEditRole(null);
    setForm({ nombre: '', descripcion: '' });
    setDialogOpen(true);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <ShieldCheck className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar los roles. Verifica la conexión con el servidor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
          <p className="text-muted-foreground mt-1">Administra los roles del sistema y sus permisos asociados</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-40 border-border/30 bg-card/30" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(roles ?? []).map((rol) => (
            <Card key={rol.id} className="group transition-shadow hover:shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rol)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rol.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{rol.nombre}</CardTitle>
                <CardDescription className="line-clamp-2">{rol.descripcion}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {(permissionMap[rol.nombre] || []).slice(0, 4).map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                  {(permissionMap[rol.nombre] || []).length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{(permissionMap[rol.nombre] || []).length - 4} más
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando roles desde el servidor...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roles ?? []).map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell className="font-medium">{rol.id}</TableCell>
                    <TableCell>{rol.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{rol.descripcion}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(permissionMap[rol.nombre] || []).map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rol)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rol.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Rol</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Recepcionista"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe las responsabilidades de este rol..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!form.nombre.trim()}>
              {editRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  )
}