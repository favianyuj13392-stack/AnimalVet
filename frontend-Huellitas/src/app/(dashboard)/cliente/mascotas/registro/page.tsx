'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Textarea } from '@/shared/components/ui/textarea'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import { Separator } from '@/shared/components/ui/separator'
import { useCrud } from '@/shared/hooks/useCrud'
import { speciesService } from '@/domains/pets/services/especies.service'
import { breedsService } from '@/domains/pets/services/breeds.service'
import { mascotasService } from '@/domains/pets/services/mascotas.service'
import { Especie, Raza } from '@/domains/pets/pets.types'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { ImageUploader } from '@/shared/components/ui/image-uploader'
import { mascotaSchema } from '@/lib/validations/mascotas.schemas'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'

type FormErrors = Partial<Record<string, string>>

export default function RegistrarMiMascotaPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const { data: especies, loading: loadingEspecies } = useCrud<Especie>(speciesService, 'especies')
  const { data: razas, loading: loadingRazas } = useCrud<Raza>(breedsService, 'razas')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog()
  const [form, setForm] = useState({
    nombre: '',
    especieId: '',
    razaId: '',
    fechaNacimiento: '',
    sexo: '' as 'M' | 'H' | '',
    esterilizado: false,
    foto_url: '',
    caracteristicas_fisicas: '',
    contacto_emergencia_telefono: '',
  })

  const razasPorEspecie = (razas ?? []).filter(
    (r) => Number(r.id_especie_fk) === Number(form.especieId)
  )

  const handleGuardar = async () => {
    const result = mascotaSchema.safeParse({
      nombre: form.nombre,
      sexo: form.sexo || undefined,
      especieId: form.especieId,
      id_raza_fk: form.razaId || undefined,
      fecha_nacimiento: form.fechaNacimiento || undefined,
      esterilizado: form.esterilizado,
      foto_url: form.foto_url || undefined,
      caracteristicas_fisicas: form.caracteristicas_fisicas || undefined,
      contacto_emergencia_telefono: form.contacto_emergencia_telefono || undefined,
    })

    if (!result.success) {
      const errs: FormErrors = {}
      result.error.issues.forEach((e: any) => {
        const key = e.path[0] as string
        if (!errs[key]) errs[key] = e.message
      })
      setErrors(errs)
      toast.error('Por favor corrige los errores del formulario')
      return
    }
    setErrors({})

    const payload: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      sexo: form.sexo,
      esterilizado: form.esterilizado,
      id_raza_fk: form.razaId ? parseInt(form.razaId) : null,
      id_dueno_fk: user?.id,
    }
    if (form.fechaNacimiento) payload.fecha_nacimiento = form.fechaNacimiento
    if (form.foto_url) payload.foto_url = form.foto_url
    if (form.caracteristicas_fisicas.trim()) payload.caracteristicas_fisicas = form.caracteristicas_fisicas.trim()
    if (form.contacto_emergencia_telefono.trim()) payload.contacto_emergencia_telefono = form.contacto_emergencia_telefono.trim()

    openConfirm({
      title: 'Registrar mascota',
      description: `¿Confirmar el registro de ${form.nombre}?`,
      variant: 'default',
      confirmLabel: 'Sí, registrar',
      onConfirm: async () => {
        setSaving(true)
        try {
          await mascotasService.registrarMiMascota(payload as any)
          await queryClient.invalidateQueries({ queryKey: ['mis-mascotas'] })
          toast.success('Mascota registrada correctamente')
          router.push('/cliente/mascotas')
        } finally {
          setSaving(false)
        }
      },
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8">

      <div>
        <Link href="/cliente/mascotas">
          <Button variant="ghost" size="sm" className="-ml-2 mb-3 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Mis mascotas
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Registrar mascota</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Completa los datos de tu mascota para agregarla a tu perfil.
        </p>
      </div>

      <Card className="rounded-xl border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-6">

          <ImageUploader
            label="Foto de la mascota"
            placeholder="Seleccionar foto"
            value={form.foto_url}
            onChange={(url) => setForm({ ...form, foto_url: url })}
          />

          <Separator />

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Firulais"
              value={form.nombre}
              onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setErrors((p) => ({ ...p, nombre: undefined })); }}
              className={`rounded-lg h-10 ${errors.nombre ? "border-destructive" : ""}`}
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          <Separator />

          {/* Especie y raza */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Especie <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.especieId}
                onValueChange={(v) => { setForm({ ...form, especieId: v, razaId: '' }); setErrors((p) => ({ ...p, especieId: undefined })); }}
              >
                <SelectTrigger className={`rounded-lg h-10 ${errors.especieId ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEspecies ? (
                    <SelectItem value="_loading" disabled>Cargando...</SelectItem>
                  ) : (
                    (especies ?? []).map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.especieId && <p className="text-xs text-destructive">{errors.especieId}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Raza</Label>
              <Select
                value={form.razaId}
                onValueChange={(v) => setForm({ ...form, razaId: v })}
                disabled={!form.especieId}
              >
                <SelectTrigger className="rounded-lg h-10">
                  <SelectValue placeholder={form.especieId ? 'Seleccionar' : 'Elige especie primero'} />
                </SelectTrigger>
                <SelectContent>
                  {loadingRazas ? (
                    <SelectItem value="_loading" disabled>Cargando...</SelectItem>
                  ) : razasPorEspecie.length === 0 ? (
                    <SelectItem value="_none" disabled>Sin razas disponibles</SelectItem>
                  ) : (
                    razasPorEspecie.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sexo y fecha */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Sexo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.sexo}
                onValueChange={(v) => { setForm({ ...form, sexo: v as 'M' | 'H' }); setErrors((p) => ({ ...p, sexo: undefined })); }}
              >
                <SelectTrigger className={`rounded-lg h-10 ${errors.sexo ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="H">Hembra</SelectItem>
                </SelectContent>
              </Select>
              {errors.sexo && <p className="text-xs text-destructive">{errors.sexo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-sm font-medium">Fecha de nacimiento</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fechaNacimiento}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setForm({ ...form, fechaNacimiento: e.target.value }); setErrors((p) => ({ ...p, fecha_nacimiento: undefined })); }}
                className={`rounded-lg h-10 ${errors.fecha_nacimiento ? "border-destructive" : ""}`}
              />
              {errors.fecha_nacimiento && <p className="text-xs text-destructive">{errors.fecha_nacimiento}</p>}
            </div>
          </div>

          {/* Características físicas y contacto de emergencia */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caracteristicas" className="text-sm font-medium">
                Características físicas
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="caracteristicas"
                placeholder="Ej: Pelaje dorado, collar rojo, mancha blanca en el pecho..."
                value={form.caracteristicas_fisicas}
                onChange={(e) => { setForm({ ...form, caracteristicas_fisicas: e.target.value }); setErrors((p) => ({ ...p, caracteristicas_fisicas: undefined })); }}
                className={`rounded-lg resize-none text-sm ${errors.caracteristicas_fisicas ? "border-destructive" : ""}`}
                rows={2}
              />
              {errors.caracteristicas_fisicas
                ? <p className="text-xs text-destructive">{errors.caracteristicas_fisicas}</p>
                : <p className="text-[11px] text-muted-foreground">Ayuda a identificar a tu mascota si se pierde y alguien escanea su QR.</p>
              }
            </div>

            <div className="space-y-2">
              <Label htmlFor="tel_emergencia" className="text-sm font-medium">
                Teléfono de emergencia
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="tel_emergencia"
                placeholder="Ej: 70012345"
                value={form.contacto_emergencia_telefono}
                onChange={(e) => { setForm({ ...form, contacto_emergencia_telefono: e.target.value }); setErrors((p) => ({ ...p, contacto_emergencia_telefono: undefined })); }}
                className={`rounded-lg h-10 ${errors.contacto_emergencia_telefono ? "border-destructive" : ""}`}
              />
              {errors.contacto_emergencia_telefono
                ? <p className="text-xs text-destructive">{errors.contacto_emergencia_telefono}</p>
                : <p className="text-[11px] text-muted-foreground">Número que aparecerá en la página pública del QR para que puedan contactarte.</p>
              }
            </div>
          </div>

          <Separator />

          {/* Esterilizado */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Esterilizado</p>
              <p className="text-xs text-muted-foreground mt-0.5">Castrado o esterilizado quirurgicamente</p>
            </div>
            <Switch
              checked={form.esterilizado}
              onCheckedChange={(v) => setForm({ ...form, esterilizado: v })}
            />
          </div>

          <Separator />

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <Link href="/cliente/mascotas" className="flex-1">
              <Button variant="outline" className="w-full rounded-lg h-10" disabled={saving}>
                Cancelar
              </Button>
            </Link>
            <Button className="flex-1 rounded-lg h-10 gap-1.5" onClick={handleGuardar} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
              ) : (
                <><Save className="h-4 w-4" /> Registrar mascota</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {confirmDialog}
    </div>
  )
}
