'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Save, Clock, Loader2, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCrud } from '@/shared/hooks/useCrud'
import { usuariosService } from '@/domains/users/services/usuarios.service'
import { horariosAtencionService } from '@/domains/users/services/horarios-atencion.service'
import { Usuario, HorarioAtencion } from '@/domains/users/users.types'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface BloqueHorario {
  id?: string
  dia: number
  activo: boolean
  horaInicio: string
  horaFin: string
}

export default function HorariosPage() {
  const queryClient = useQueryClient()
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog()
  const [veterinarioId, setVeterinarioId] = useState<string>('')
  const [horarios, setHorarios] = useState<BloqueHorario[]>(
    diasSemana.map((_, idx) => ({
      dia: idx + 1,
      activo: idx < 5, // L-V activos por defecto
      horaInicio: '08:00',
      horaFin: '17:00',
    }))
  )
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dbHorarios, setDbHorarios] = useState<HorarioAtencion[]>([])

  // Cargar veterinarios reales
  const { data: usuarios, loading: loadingVets } = useCrud<Usuario>(usuariosService, 'usuarios')
  const veterinarians = usuarios.filter(u => Number(u.id_rol_fk) === 2)

  // Bloqueos State
  const [fechaBloqueo, setFechaBloqueo] = useState('')
  const [motivoBloqueo, setMotivoBloqueo] = useState('Feriado')
  const [vetBloqueoId, setVetBloqueoId] = useState('todos')

  // Query para fechas bloqueadas
  const { data: bloqueos = [], isLoading: loadingBloqueos } = useQuery<any[]>({
    queryKey: ["bloqueos"],
    queryFn: () => horariosAtencionService.getBloqueos(),
  })

  // Mutación para crear bloqueo
  const createBloqueoMutation = useMutation({
    mutationFn: (payload: { fecha: string; motivo: string; id_veterinario_fk?: string | null }) =>
      horariosAtencionService.createBloqueo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueos"] })
      toast.success('Fecha inhabilitada correctamente')
      setFechaBloqueo('')
      setMotivoBloqueo('Feriado')
      setVetBloqueoId('todos')
    }
  })

  // Mutación para borrar bloqueo
  const deleteBloqueoMutation = useMutation({
    mutationFn: (id: string) => horariosAtencionService.deleteBloqueo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueos"] })
      toast.success('Bloqueo eliminado correctamente')
    }
  })

  // Seleccionar automáticamente al primer veterinario cuando se cargue la lista
  useEffect(() => {
    if (veterinarians.length > 0 && !veterinarioId) {
      setVeterinarioId(String(veterinarians[0].id))
    }
  }, [veterinarians, veterinarioId])

  const loadHorarios = async (vetId: string) => {
    setLoadingHorarios(true)
    try {
      const data = await horariosAtencionService.getAllActive(vetId)
      setDbHorarios(data)
      
      const nuevosHorarios = diasSemana.map((_, idx) => {
        const diaNum = idx + 1
        const dbHorario = data.find(h => h.dia_semana === diaNum && h.activo)
        
        if (dbHorario) {
          return {
            id: dbHorario.id,
            dia: diaNum,
            activo: true,
            horaInicio: dbHorario.hora_inicio.slice(0, 5),
            horaFin: dbHorario.hora_fin.slice(0, 5)
          }
        } else {
          return {
            dia: diaNum,
            activo: false,
            horaInicio: '08:00',
            horaFin: '17:00'
          }
        }
      })
      setHorarios(nuevosHorarios)
    } catch (err) {
      console.error("Error al cargar horarios:", err)
      toast.error("No se pudieron cargar los horarios del veterinario")
    } finally {
      setLoadingHorarios(false)
    }
  }

  useEffect(() => {
    if (veterinarioId) {
      loadHorarios(veterinarioId)
    }
  }, [veterinarioId])

  const updateDia = (dia: number, field: keyof BloqueHorario, value: string | boolean) => {
    setHorarios(prev => prev.map(h => h.dia === dia ? { ...h, [field]: value } : h))
  }

  const handleSaveHorarios = async () => {
    if (!veterinarioId) {
      toast.error('Por favor selecciona un veterinario')
      return
    }
    
    setSaving(true)
    try {
      const promises: Promise<any>[] = []
      
      for (const h of horarios) {
        if (!h.id && h.activo) {
          promises.push(
            horariosAtencionService.create({
              dia_semana: h.dia,
              hora_inicio: h.horaInicio + ':00',
              hora_fin: h.horaFin + ':00',
              id_veterinario_fk: veterinarioId
            })
          )
        } else if (h.id && !h.activo) {
          promises.push(horariosAtencionService.desactivar(h.id))
        } else if (h.id && h.activo) {
          const original = dbHorarios.find(o => o.id === h.id)
          if (original) {
            const orgStart = original.hora_inicio.slice(0, 5)
            const orgEnd = original.hora_fin.slice(0, 5)
            if (orgStart !== h.horaInicio || orgEnd !== h.horaFin) {
              promises.push(
                horariosAtencionService.update(h.id, {
                  dia_semana: h.dia,
                  hora_inicio: h.horaInicio + ':00',
                  hora_fin: h.horaFin + ':00',
                  activo: true
                })
              )
            }
          }
        }
      }
      
      if (promises.length > 0) {
        await Promise.all(promises)
        toast.success('Horarios guardados correctamente')
      } else {
        toast.info('No hay cambios para guardar')
      }
    } catch (err) {
      console.error("Error al guardar horarios:", err)
      toast.error('Ocurrió un error al guardar los horarios')
    } finally {
      setSaving(false)
      if (veterinarioId) {
        loadHorarios(veterinarioId)
      }
    }
  }

  const handleCreateBloqueo = () => {
    if (!fechaBloqueo) {
      toast.error('Por favor selecciona una fecha')
      return
    }
    createBloqueoMutation.mutate({
      fecha: fechaBloqueo,
      motivo: motivoBloqueo,
      id_veterinario_fk: vetBloqueoId === 'todos' ? null : vetBloqueoId
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Horarios y Bloqueos de Agenda</h1>
        <p className="text-muted-foreground mt-1">Configura la disponibilidad semanal del staff y gestiona fechas inhabilitadas</p>
      </div>

      <Tabs defaultValue="semanal" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px] mb-6 rounded-xl bg-muted/40 p-1">
          <TabsTrigger value="semanal" className="rounded-lg">Horario Semanal</TabsTrigger>
          <TabsTrigger value="bloqueos" className="rounded-lg">Fechas Bloqueadas</TabsTrigger>
        </TabsList>

        <TabsContent value="semanal" className="space-y-6">
          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Seleccionar Veterinario</CardTitle>
              <CardDescription>Elige el veterinario para configurar sus horarios</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVets ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Select value={veterinarioId} onValueChange={setVeterinarioId}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Seleccionar veterinario" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {veterinarians.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.nombres} {v.apellidos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle>Horario Semanal</CardTitle>
              <CardDescription>Define los bloques de disponibilidad para cada día</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingHorarios ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {diasSemana.map((dia, idx) => {
                    const h = horarios[idx]
                    if (!h) return null
                    return (
                      <div key={dia} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 hover:bg-muted/10 transition-colors">
                        <div className="w-24">
                          <Label className="font-medium">{dia}</Label>
                        </div>
                        <Switch
                          checked={h.activo}
                          onCheckedChange={(v) => updateDia(h.dia, 'activo', v)}
                        />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Inicio</Label>
                            <Input
                              type="time"
                              value={h.horaInicio}
                              onChange={(e) => updateDia(h.dia, 'horaInicio', e.target.value)}
                              disabled={!h.activo}
                              className="rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Fin</Label>
                            <Input
                              type="time"
                              value={h.horaFin}
                              onChange={(e) => updateDia(h.dia, 'horaFin', e.target.value)}
                              disabled={!h.activo}
                              className="rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveHorarios} size="lg" disabled={saving || loadingHorarios || !veterinarioId} className="rounded-xl">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Guardar Horarios
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloqueos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario */}
            <Card className="lg:col-span-1 rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold"><CalendarIcon className="h-5 w-5 text-primary" /> Nuevo Bloqueo</CardTitle>
                <CardDescription>Inhabilita un día completo para evitar agendamientos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaBloqueo">Fecha *</Label>
                  <Input
                    id="fechaBloqueo"
                    type="date"
                    value={fechaBloqueo}
                    onChange={(e) => setFechaBloqueo(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivoBloqueo">Motivo *</Label>
                  <Select value={motivoBloqueo} onValueChange={setMotivoBloqueo}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Feriado">Feriado 🎈</SelectItem>
                      <SelectItem value="Vacaciones">Vacaciones 🏖️</SelectItem>
                      <SelectItem value="Emergencia">Emergencia 🚨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vetBloqueo">Aplica A (Opcional)</Label>
                  <Select value={vetBloqueoId} onValueChange={setVetBloqueoId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Toda la clínica" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="todos">Toda la Clínica (Global)</SelectItem>
                      {veterinarians.map(v => (
                        <SelectItem key={v.id} value={String(v.id)}>Dr(a). {v.nombres} {v.apellidos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground block mt-1">Si dejas "Toda la Clínica", se inhabilitará la agenda completa ese día.</span>
                </div>

                <Button
                  onClick={handleCreateBloqueo}
                  className="w-full rounded-xl font-semibold"
                  disabled={createBloqueoMutation.isPending}
                >
                  {createBloqueoMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                    </>
                  ) : (
                    "Bloquear Fecha"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Listado */}
            <Card className="lg:col-span-2 rounded-2xl border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-primary" /> Fechas Inhabilitadas</CardTitle>
                <CardDescription>Días con bloqueos de agenda activos</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingBloqueos ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : bloqueos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No hay fechas bloqueadas actualmente.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="pl-6 font-semibold py-3">Fecha</TableHead>
                          <TableHead className="font-semibold py-3">Motivo</TableHead>
                          <TableHead className="font-semibold py-3">Alcance / Médico</TableHead>
                          <TableHead className="text-right pr-6 font-semibold py-3">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bloqueos.map((b: any) => {
                          let formatFecha = b.fecha
                          try {
                            formatFecha = new Date(b.fecha + 'T00:00:00').toLocaleDateString('es-BO', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          } catch (_) {}

                          const isGlobal = !b.id_veterinario_fk
                          const nameVet = b.veterinario
                            ? `${b.veterinario.nombres} ${b.veterinario.apellidos}`
                            : 'Toda la Clínica'

                          return (
                            <TableRow key={b.id} className="hover:bg-muted/20 border-b border-border/30">
                              <TableCell className="pl-6 font-semibold capitalize py-4">{formatFecha}</TableCell>
                              <TableCell className="py-4">
                                <Badge variant={b.motivo === 'Emergencia' ? 'destructive' : b.motivo === 'Vacaciones' ? 'secondary' : 'default'} className="rounded-lg">
                                  {b.motivo}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium py-4">
                                {isGlobal ? (
                                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 rounded-lg">Toda la Clínica</Badge>
                                ) : (
                                  <span className="text-sm">Dr(a). {nameVet}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-6 py-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openConfirm({ title: 'Eliminar bloqueo', description: '¿Eliminar este bloqueo de horario?', variant: 'destructive', confirmLabel: 'Sí, eliminar', onConfirm: () => deleteBloqueoMutation.mutateAsync(b.id) })}
                                  disabled={deleteBloqueoMutation.isPending}
                                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {confirmDialog}
    </div>
  )
}