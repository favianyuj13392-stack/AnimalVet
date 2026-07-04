'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Search, PawPrint, MapPin, Calendar, Edit, Loader2, Plus, Trash2, RefreshCw, Merge } from 'lucide-react'
import Link from 'next/link'
import { useCrud } from '@/shared/hooks/useCrud'
import { Mascota, Especie, Raza } from '@/domains/pets/pets.types'
import { mascotasService } from '@/domains/pets/services/mascotas.service'
import { speciesService } from '@/domains/pets/services/especies.service'
import { breedsService } from '@/domains/pets/services/breeds.service'
import { FusionPacientesDialog } from '@/domains/pets/components/FusionPacientesDialog'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { usuariosService } from '@/domains/users/services/usuarios.service'
import { Usuario } from '@/domains/users/users.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { toast } from 'sonner'

export default function ListadoMascotasPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.rol?.id === 1
  const isVet = user?.rol?.id === 2
  const isCajero = user?.rol?.id === 3

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog()
  const { data: mascotas, loading: loadingMascotas, error: errorMascotas, refetch, updateItem, deleteItem } = useCrud<Mascota>(mascotasService, 'mascotas')
  const { data: especies, loading: loadingEspecies } = useCrud<Especie>(speciesService, 'especies')
  const { data: razas, loading: loadingRazas } = useCrud<Raza>(breedsService, 'razas')
  const { data: usuarios, loading: loadingUsuarios } = useCrud<Usuario>(usuariosService, 'usuarios')

  const [busqueda, setBusqueda] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('todas')
  const [filtroRaza, setFiltroRaza] = useState('todas')

  // Estado para la edición
  const [editingMascota, setEditingMascota] = useState<Mascota | null>(null)
  const [fusionOpen, setFusionOpen] = useState(false)
  const [mascotaTemporal, setMascotaTemporal] = useState<Mascota | null>(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    sexo: 'M',
    esterilizado: false,
    id_dueno_fk: '',
    especieId: '',
    id_raza_fk: '',
  })

  const loading = loadingMascotas || loadingEspecies || loadingRazas || loadingUsuarios

  if (errorMascotas) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <PawPrint className="h-10 w-10 opacity-30" />
        <p className="text-sm">Error al cargar las mascotas. Verifica la conexión con el servidor.</p>
      </div>
    )
  }

  const mascotasFiltradas = (mascotas ?? []).filter((m) => {
    const coincideBusqueda = busqueda === '' ||
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.dueno && `${m.dueno.nombres} ${m.dueno.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())) ||
      m.id.includes(busqueda)

    const coincideEspecie = filtroEspecie === 'todas' || 
      (m.raza?.id_especie_fk?.toString() === filtroEspecie) ||
      ((razas ?? []).find(r => Number(r.id) === Number(m.id_raza_fk))?.id_especie_fk?.toString() === filtroEspecie)

    const coincideRaza = filtroRaza === 'todas' || 
      (m.id_raza_fk?.toString() === filtroRaza)

    return coincideBusqueda && coincideEspecie && coincideRaza
  })

  const openEdit = (m: Mascota) => {
    const breed = (razas ?? []).find(r => Number(r.id) === Number(m.id_raza_fk))
    setEditingMascota(m)
    setEditForm({
      nombre: m.nombre,
      sexo: m.sexo || 'M',
      esterilizado: !!m.esterilizado,
      id_dueno_fk: m.id_dueno_fk?.toString() || '',
      especieId: breed?.id_especie_fk?.toString() || '',
      id_raza_fk: m.id_raza_fk?.toString() || '',
    })
  }

  const handleUpdate = async () => {
    if (!editingMascota) return
    if (!editForm.nombre.trim()) {
      return toast.error('El nombre es obligatorio')
    }

    try {
      const payload: any = {
        nombre: editForm.nombre.trim(),
        sexo: editForm.sexo,
        esterilizado: editForm.esterilizado,
        id_dueno_fk: editForm.id_dueno_fk || null,
        id_raza_fk: editForm.id_raza_fk ? parseInt(editForm.id_raza_fk) : null,
      }
      await updateItem({ id: editingMascota.id, data: payload })
      toast.success('Mascota actualizada correctamente')
      setEditingMascota(null)
    } catch {
      // Manejado por useCrud/Axios interceptor
    }
  }

  const handleDelete = (id: string | number) => {
    openConfirm({
      title: "Eliminar mascota",
      description: "¿Estás seguro de que deseas eliminar esta mascota? Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmLabel: "Sí, eliminar",
      onConfirm: async () => {
        await deleteItem(id)
        toast.success('Mascota eliminada correctamente')
      },
    })
  }

  const handleActivar = async (id: string | number) => {
    try {
      await mascotasService.activar(id)
      toast.success('Mascota reactivada correctamente')
      refetch()
    } catch {
      toast.error('Error al reactivar la mascota')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listado de Mascotas</h1>
          <p className="text-muted-foreground mt-1">Busca y filtra las mascotas registradas</p>
        </div>
        {(isAdmin || isCajero) && (
          <Button asChild>
            <Link href="/admin/mascotas/registro">
              <Plus className="mr-2 h-4 w-4" /> Registrar Mascota
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, dueño o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Especie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(especies ?? []).map(e => (<SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filtroRaza} onValueChange={setFiltroRaza}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Raza" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(razas ?? []).map(r => (<SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando catálogo de mascotas...</span>
            </div>
          ) : mascotasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron mascotas registradas.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mascotasFiltradas.map((mascota) => {
                const resolvedRaza = mascota.raza || (razas ?? []).find(r => Number(r.id) === Number(mascota.id_raza_fk));
                const resolvedEspecie = resolvedRaza?.especie || (especies ?? []).find(e => Number(e.id) === Number(resolvedRaza?.id_especie_fk));
                return (
                  <Card key={mascota.id} className="group transition-shadow hover:shadow-lg">
                    <CardHeader className="pb-2">
                      {(mascota as any).foto_url && (
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={(mascota as any).foto_url} alt={mascota.nombre} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!(mascota as any).foto_url && <PawPrint className="h-8 w-8 text-primary" />}
                          <div>
                            <CardTitle className="text-lg">{mascota.nombre}</CardTitle>
                            <p className="text-xs text-muted-foreground">ID: {mascota.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <Badge variant={mascota.sexo === 'M' ? 'default' : 'secondary'}>
                          {mascota.sexo === 'M' ? '♂ Macho' : '♀ Hembra'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Especie:</span>
                          <span className="font-medium">{resolvedEspecie?.nombre || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Raza:</span>
                          <span>{resolvedRaza?.nombre || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dueño:</span>
                          <span>{mascota.dueno ? `${mascota.dueno.nombres} ${mascota.dueno.apellidos}` : 'Sin dueño'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nacimiento:</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {mascota.fecha_nacimiento ? new Date(mascota.fecha_nacimiento).toLocaleDateString() : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Esterilizado:</span>
                          <Badge variant={mascota.esterilizado ? 'default' : 'outline'}>
                            {mascota.esterilizado ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado:</span>
                          {mascota.deletedAt ? (
                            <Badge variant="destructive">Inactivo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">Activo</Badge>
                          )}
                        </div>
                        <div className="flex justify-between text-xs border-t pt-2 mt-2">
                          <span className="text-muted-foreground">QR Identidad:</span>
                          <span className="font-mono text-primary font-semibold">{mascota.hash_qr_identidad || 'Generando...'}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 border-t pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/vet/expediente?id=${mascota.id}`}>
                            <MapPin className="mr-1 h-3 w-3" /> Expediente
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(mascota)} disabled={!!mascota.deletedAt}>
                            <Edit className="mr-1 h-3 w-3" /> Editar
                          </Button>
                        )}
                        {(isAdmin || isCajero) && !mascota.deletedAt && mascota.hash_qr_identidad?.startsWith("EMERG-") && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-primary hover:bg-primary/10 border-primary/30 mr-1"
                            onClick={() => {
                              setMascotaTemporal(mascota);
                              setFusionOpen(true);
                            }}
                          >
                            <Merge className="mr-1 h-3 w-3" /> Vincular
                          </Button>
                        )}
                        {isAdmin && (
                          mascota.deletedAt ? (
                            <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleActivar(mascota.id)}>
                              <RefreshCw className="mr-1 h-3 w-3" /> Reactivar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(mascota.id)}>
                              <Trash2 className="mr-1 h-3 w-3" /> Eliminar
                            </Button>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Editar Mascota */}
      <Dialog open={!!editingMascota} onOpenChange={(open) => !open && setEditingMascota(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Editar Mascota</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                className="rounded-xl h-11"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sexo">Sexo *</Label>
                <Select value={editForm.sexo} onValueChange={(v) => setEditForm({ ...editForm, sexo: v })}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Macho</SelectItem>
                    <SelectItem value="H">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-xl border p-3 mt-6 h-11">
                <Label htmlFor="edit-esterilizado" className="text-sm">Esterilizado</Label>
                <Switch
                  id="edit-esterilizado"
                  checked={editForm.esterilizado}
                  onCheckedChange={(v) => setEditForm({ ...editForm, esterilizado: v })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dueno">Dueño</Label>
              <Select value={editForm.id_dueno_fk} onValueChange={(v) => setEditForm({ ...editForm, id_dueno_fk: v })}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Seleccionar dueño" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsuarios ? (
                    <SelectItem value="_loading" disabled>Cargando dueños...</SelectItem>
                  ) : (
                    (usuarios ?? []).filter(u => Number(u.id_rol_fk) === 4).map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.nombres} {u.apellidos} ({u.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-especie">Especie</Label>
                <Select value={editForm.especieId} onValueChange={(v) => setEditForm({ ...editForm, especieId: v, id_raza_fk: '' })}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Especie" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingEspecies ? (
                      <SelectItem value="_loading" disabled>Cargando...</SelectItem>
                    ) : (
                      (especies ?? []).map(e => (
                        <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-raza">Raza</Label>
                <Select value={editForm.id_raza_fk} onValueChange={(v) => setEditForm({ ...editForm, id_raza_fk: v })} disabled={!editForm.especieId}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Raza" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingRazas ? (
                      <SelectItem value="_loading" disabled>Cargando...</SelectItem>
                    ) : (
                      (razas ?? []).filter(r => Number(r.id_especie_fk) === Number(editForm.especieId)).map(r => (
                        <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditingMascota(null)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={handleUpdate}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FusionPacientesDialog 
        open={fusionOpen} 
        onOpenChange={setFusionOpen} 
        mascotaTemporal={mascotaTemporal} 
        onSuccess={refetch} 
      />
      {confirmDialog}
    </div>
  )
}