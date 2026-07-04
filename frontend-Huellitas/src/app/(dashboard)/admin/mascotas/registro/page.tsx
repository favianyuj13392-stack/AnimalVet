'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Separator } from '@/shared/components/ui/separator'
import { Plus, Search, UserPlus, Save, Camera, Loader2 } from 'lucide-react'
import { ImageUploader } from '@/shared/components/ui/image-uploader'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useCrud } from '@/shared/hooks/useCrud'
import { mascotasService } from '@/domains/pets/services/mascotas.service'
import { speciesService } from '@/domains/pets/services/especies.service'
import { breedsService } from '@/domains/pets/services/breeds.service'
import { usuariosService } from '@/domains/users/services/usuarios.service'
import { Mascota, Especie, Raza } from '@/domains/pets/pets.types'
import { Usuario } from '@/domains/users/users.types'

export default function RegistroMascotaPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<1 | 2>(1)
  
  // Servicios y estado dinámico
  const { data: especies, loading: loadingEspecies } = useCrud<Especie>(speciesService, 'especies')
  const { data: razas, loading: loadingRazas } = useCrud<Raza>(breedsService, 'razas')
  const clientesCrudService = {
    ...usuariosService,
    getAll: () => usuariosService.getClientes()
  };
  const { data: usuarios, loading: loadingUsuarios } = useCrud<Usuario>(clientesCrudService, 'clientes')
  const { createItem: createMascota } = useCrud<Mascota>(mascotasService, 'mascotas')
  const { createItem: createUsuario } = useCrud<Usuario>(usuariosService, 'usuarios')

  const [form, setForm] = useState({
    nombre: '',
    duenoId: '',
    nuevoDuenoNombre: '',
    nuevoDuenoApellido: '',
    nuevoDuenoEmail: '',
    nuevoDuenoTelefono: '',
    especieId: '',
    razaId: '',
    fechaNacimiento: '',
    sexo: '' as 'M' | 'H' | '',
    esterilizado: false,
    foto_url: '',
    caracteristicas_fisicas: '',
    contacto_emergencia_telefono: '',
    observaciones: '',
  })
  const [busquedaDueno, setBusquedaDueno] = useState('')
  const [crearNuevoDueno, setCrearNuevoDueno] = useState(false)

  // Filtrar clientes (rol 4)
  const clientes = (usuarios ?? []).filter(u => Number(u.id_rol_fk) === 4)

  const clientesFiltrados = clientes.filter(c =>
    `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busquedaDueno.toLowerCase()) ||
    c.email.toLowerCase().includes(busquedaDueno.toLowerCase())
  )

  const handleRegistrar = async () => {
    if (!form.nombre.trim() || !form.especieId || !form.sexo) {
      return toast.error('Completa los campos obligatorios')
    }
    if (!form.duenoId && !crearNuevoDueno) {
      return toast.error('Selecciona o crea un dueño')
    }

    try {
      let duenoId = form.duenoId
      if (crearNuevoDueno) {
        if (!form.nuevoDuenoNombre.trim() || !form.nuevoDuenoApellido.trim() || !form.nuevoDuenoEmail.trim()) {
          return toast.error('Completa los campos obligatorios del nuevo dueño')
        }
        
        const resDueno = await createUsuario({
          nombres: form.nuevoDuenoNombre.trim(),
          apellidos: form.nuevoDuenoApellido.trim(),
          email: form.nuevoDuenoEmail.trim(),
          telefono: form.nuevoDuenoTelefono.trim() || undefined,
          password: 'Password123!',
          id_rol_fk: 4, // Cliente
        } as any)
        duenoId = resDueno.id.toString()
      }

      const payload: any = {
        nombre: form.nombre.trim(),
        sexo: form.sexo,
        esterilizado: form.esterilizado,
        id_dueno_fk: duenoId || null,
        id_raza_fk: form.razaId ? parseInt(form.razaId) : null,
      }

      if (form.fechaNacimiento) payload.fecha_nacimiento = form.fechaNacimiento
      if (form.foto_url.trim()) payload.foto_url = form.foto_url.trim()
      if (form.caracteristicas_fisicas.trim()) payload.caracteristicas_fisicas = form.caracteristicas_fisicas.trim()
      if (form.contacto_emergencia_telefono.trim()) payload.contacto_emergencia_telefono = form.contacto_emergencia_telefono.trim()

      await createMascota(payload)
      toast.success('Mascota registrada correctamente')
      router.push('/admin/mascotas')
    } catch (err) {
      // El error es manejado por useCrud/interceptor de Axios
    }
  }

  // Filtrar razas según la especie seleccionada
  const razasPorEspecie = (razas ?? []).filter(r => Number(r.id_especie_fk) === Number(form.especieId))

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registro de Mascota</h1>
        <p className="text-muted-foreground mt-1">Formulario para registrar una nueva mascota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paso {paso}: {paso === 1 ? 'Dueño' : 'Datos de la Mascota'}</CardTitle>
          <CardDescription>
            {paso === 1 ? 'Selecciona un cliente existente o registra uno nuevo' : 'Completa la información de la mascota'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paso === 1 ? (
            <>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nombre o email..."
                    value={busquedaDueno}
                    onChange={(e) => setBusquedaDueno(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md">
                  {loadingUsuarios ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Cargando clientes...</span>
                    </div>
                  ) : clientesFiltrados.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No se encontraron clientes que coincidan.
                    </div>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <div
                        key={cliente.id}
                        className={`p-3 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between ${
                          form.duenoId === cliente.id.toString() ? 'bg-primary/5 border border-primary' : ''
                        }`}
                        onClick={() => { setForm({ ...form, duenoId: cliente.id.toString() }); setCrearNuevoDueno(false) }}
                      >
                        <div>
                          <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
                          <p className="text-sm text-muted-foreground">{cliente.email}</p>
                        </div>
                        {form.duenoId === cliente.id.toString() && <CheckCircleIcon />}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={crearNuevoDueno} onCheckedChange={(v) => { setCrearNuevoDueno(v); setForm({ ...form, duenoId: '' }) }} />
                  <Label>Crear nuevo dueño</Label>
                </div>

                {crearNuevoDueno && (
                  <div className="grid gap-4 sm:grid-cols-2 border rounded-lg p-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input value={form.nuevoDuenoNombre} onChange={(e) => setForm({ ...form, nuevoDuenoNombre: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellido *</Label>
                      <Input value={form.nuevoDuenoApellido} onChange={(e) => setForm({ ...form, nuevoDuenoApellido: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={form.nuevoDuenoEmail} onChange={(e) => setForm({ ...form, nuevoDuenoEmail: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={form.nuevoDuenoTelefono} onChange={(e) => setForm({ ...form, nuevoDuenoTelefono: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setPaso(2)} disabled={!form.duenoId && !crearNuevoDueno}>
                  Siguiente: Datos de la mascota
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nombre">Nombre de la mascota *</Label>
                  <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Firulais" />
                </div>

                <div className="space-y-2">
                  <Label>Especie *</Label>
                  <Select value={form.especieId} onValueChange={(v) => setForm({ ...form, especieId: v, razaId: '' })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar especie" /></SelectTrigger>
                    <SelectContent>
                      {loadingEspecies ? (
                        <SelectItem value="_loading" disabled>Cargando especies...</SelectItem>
                      ) : (
                        especies.map((e) => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Raza</Label>
                  <Select value={form.razaId} onValueChange={(v) => setForm({ ...form, razaId: v })} disabled={!form.especieId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar raza" /></SelectTrigger>
                    <SelectContent>
                      {loadingRazas ? (
                        <SelectItem value="_loading" disabled>Cargando razas...</SelectItem>
                      ) : razasPorEspecie.length === 0 ? (
                        <SelectItem value="_none" disabled>No hay razas registradas</SelectItem>
                      ) : (
                        razasPorEspecie.map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Sexo *</Label>
                  <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v as 'M' | 'H' })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Macho</SelectItem>
                      <SelectItem value="H">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <Label htmlFor="esterilizado">¿Esterilizado?</Label>
                  <Switch id="esterilizado" checked={form.esterilizado} onCheckedChange={(v) => setForm({ ...form, esterilizado: v })} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Características físicas</Label>
                  <Input value={form.caracteristicas_fisicas} onChange={(e) => setForm({ ...form, caracteristicas_fisicas: e.target.value })} placeholder="Ej: Pelaje dorado, collar rojo, mancha blanca en el pecho" />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono de emergencia</Label>
                  <Input value={form.contacto_emergencia_telefono} onChange={(e) => setForm({ ...form, contacto_emergencia_telefono: e.target.value })} placeholder="Ej: 70012345" />
                </div>

                <div className="space-y-2">
                  <ImageUploader
                    label="Foto de la mascota"
                    placeholder="Seleccionar foto"
                    value={form.foto_url}
                    onChange={(url) => setForm({ ...form, foto_url: url })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Observaciones generales</Label>
                  <Textarea
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    rows={3}
                    placeholder="Alergias, condiciones especiales..."
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setPaso(1)}>Volver</Button>
                <Button onClick={handleRegistrar}>
                  <Save className="mr-2 h-4 w-4" /> Registrar Mascota
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )
}