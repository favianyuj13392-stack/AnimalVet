'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Separator } from '@/shared/components/ui/separator'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Loader2, Calendar, ShieldAlert, CheckCircle2, XCircle, AlertCircle, PlayCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { useCrud } from '@/shared/hooks/useCrud'
import { Cita } from '@/domains/appointments/appointments.types'
import { citasService } from '@/domains/appointments/services/citas.service'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'
import { mascotasService } from '@/domains/pets/services/mascotas.service'
import { servicesService } from '@/domains/billing/services/services.service'
import { usuariosService } from '@/domains/users/services/usuarios.service'
import { Mascota } from '@/domains/pets/pets.types'
import { Servicio } from '@/domains/billing/services/services.service'
import { Usuario } from '@/domains/users/users.types'
import { UrgenciaModal } from '@/domains/pets/components/UrgenciaModal'

const estadoColor: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-250',
  En_Curso: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-250',
  Completada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-250',
  Cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-250',
  No_Asistio: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-250',
}

const estadoLabel: Record<string, string> = {
  Pendiente: 'Pendiente',
  En_Curso: 'En Curso',
  Completada: 'Completada',
  Cancelada: 'Cancelada',
  No_Asistio: 'No Asistió',
}

const cardStyles: Record<string, { border: string; bg: string; text: string }> = {
  Pendiente: {
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100/40 dark:hover:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400'
  },
  En_Curso: {
    border: 'border-l-4 border-l-sky-500',
    bg: 'bg-sky-50/50 dark:bg-sky-950/10 hover:bg-sky-100/40 dark:hover:bg-sky-950/20',
    text: 'text-sky-700 dark:text-sky-400'
  },
  Completada: {
    border: 'border-l-4 border-l-emerald-500',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-100/40 dark:hover:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400'
  },
  Cancelada: {
    border: 'border-l-4 border-l-rose-500',
    bg: 'bg-rose-50/30 dark:bg-rose-950/5 hover:bg-rose-100/20 dark:hover:bg-rose-950/10',
    text: 'text-rose-700 dark:text-rose-400'
  },
  No_Asistio: {
    border: 'border-l-4 border-l-slate-400',
    bg: 'bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/40 dark:hover:bg-slate-900/20',
    text: 'text-slate-600 dark:text-slate-400'
  }
}

export default function AgendaPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.rol?.id === 1
  const isCajero = user?.rol?.id === 3

  const { data: citas, loading: loadingCitas, createItem, refetch } = useCrud<Cita>(citasService, 'citas')
  const { data: mascotas, loading: loadingMascotas } = useCrud<Mascota>(mascotasService, 'mascotas')
  const { data: servicios, loading: loadingServicios } = useCrud<Servicio>(servicesService, 'servicios')
  const { data: usuarios, loading: loadingUsuarios } = useCrud<Usuario>(usuariosService, 'usuarios')

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog()
  const [vista, setVista] = useState<'dia' | 'semana' | 'mes'>('dia')
  const [fecha, setFecha] = useState(new Date())
  const [vetFiltro, setVetFiltro] = useState('todos')
  const [mascotaFiltro, setMascotaFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [dialogCita, setDialogCita] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null)
  const [verCanceladas, setVerCanceladas] = useState(true)
  const [openUrgencia, setOpenUrgencia] = useState(false)
  
  // Estado para cambiar estado de cita
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')

  // Formulario de nueva cita
  const [form, setForm] = useState({
    id_mascota_fk: '',
    id_servicio_fk: '',
    id_veterinario_fk: '',
    fecha: '',
    hora: '',
    motivo_cita: '',
  })

  const resetForm = () => setForm({
    id_mascota_fk: '',
    id_servicio_fk: '',
    id_veterinario_fk: '',
    fecha: '',
    hora: '',
    motivo_cita: '',
  })

  const veterinarios = (usuarios ?? []).filter(u => u.id_rol_fk === 2)

  const cambiarFecha = (delta: number) => {
    const nueva = new Date(fecha)
    if (vista === 'dia') nueva.setDate(nueva.getDate() + delta)
    else if (vista === 'semana') nueva.setDate(nueva.getDate() + delta * 7)
    else nueva.setMonth(nueva.getMonth() + delta)
    setFecha(nueva)
  }

  const formatearFecha = () => {
    if (vista === 'dia') return fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (vista === 'semana') {
      const inicio = new Date(fecha)
      inicio.setDate(fecha.getDate() - (fecha.getDay() === 0 ? 6 : fecha.getDay() - 1))
      const fin = new Date(inicio)
      fin.setDate(inicio.getDate() + 6)
      return `${inicio.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - ${fin.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return fecha.toLocaleDateString('es', { month: 'long', year: 'numeric' })
  }

  const handleSave = async () => {
    if (!form.id_mascota_fk || !form.id_servicio_fk || !form.id_veterinario_fk || !form.fecha || !form.hora || !form.motivo_cita.trim()) {
      return toast.error('Completa todos los campos obligatorios')
    }

    const payload = {
fecha_hora_inicio: `${form.fecha}T${form.hora}:00`,      origen_reserva: 'RECEPCION' as any,
      id_mascota_fk: form.id_mascota_fk,
      id_veterinario_fk: form.id_veterinario_fk,
      id_servicio_fk: parseInt(form.id_servicio_fk),
      motivo_cita: form.motivo_cita,
    }

    try {
      await createItem(payload)
      toast.success('Cita agendada exitosamente')
      setDialogCita(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['citas'] })
    } catch {
      // El error ya lo maneja el interceptor de Axios
    }
  }

  const handleCambiarEstado = async () => {
    if (!citaSeleccionada) return
    if (!nuevoEstado) return
    if (nuevoEstado === 'Cancelada' && !motivoCancelacion.trim()) {
      return toast.error('El motivo de cancelación es obligatorio')
    }

    try {
      await citasService.updateEstado(citaSeleccionada.id, nuevoEstado, motivoCancelacion || undefined)
      toast.success('Estado de la cita actualizado')
      setDialogCita(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['citas'] })
    } catch {
      // handled
    }
  }

  const handleEliminarCita = () => {
    if (!citaSeleccionada) return
    openConfirm({
      title: "Eliminar cita",
      description: "¿Estás seguro de que deseas desactivar/eliminar esta cita?",
      variant: "destructive",
      confirmLabel: "Sí, eliminar",
      onConfirm: async () => {
        await citasService.delete(citaSeleccionada.id)
        toast.success('Cita desactivada/eliminada correctamente')
        setDialogCita(false)
        refetch()
        queryClient.invalidateQueries({ queryKey: ['citas'] })
      },
    })
  }

  const handleRestaurarCita = async () => {
    if (!citaSeleccionada) return
    try {
      await citasService.restore(citaSeleccionada.id)
      toast.success('Cita restaurada correctamente')
      setDialogCita(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['citas'] })
    } catch {
      // handled
    }
  }

  const appointmentsBaseForPeriod = (citas ?? []).filter((cita) => {
    const citaDate = new Date(cita.fecha_hora_inicio);
    
    if (vetFiltro !== 'todos') {
      const citaVetId = cita.id_veterinario_fk || cita.veterinario?.id;
      if (!citaVetId || citaVetId.toString() !== vetFiltro.toString()) {
        return false;
      }
    }

    if (mascotaFiltro !== 'todos') {
      const citaMascotaId = cita.id_mascota_fk || cita.mascota?.id;
      if (!citaMascotaId || citaMascotaId.toString() !== mascotaFiltro.toString()) {
        return false;
      }
    }

    if (vista === 'dia') {
      return citaDate.toDateString() === fecha.toDateString();
    } else if (vista === 'semana') {
      const startOfWeek = new Date(fecha);
      startOfWeek.setDate(fecha.getDate() - (fecha.getDay() === 0 ? 6 : fecha.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return citaDate >= startOfWeek && citaDate <= endOfWeek;
    } else {
      return citaDate.getMonth() === fecha.getMonth() && citaDate.getFullYear() === fecha.getFullYear();
    }
  });

  const stats = {
    total: appointmentsBaseForPeriod.length,
    pendientes: appointmentsBaseForPeriod.filter(c => c.estado === 'Pendiente' && !c.deletedAt).length,
    enCurso: appointmentsBaseForPeriod.filter(c => c.estado === 'En_Curso' && !c.deletedAt).length,
    completadas: appointmentsBaseForPeriod.filter(c => c.estado === 'Completada' && !c.deletedAt).length,
    canceladas: appointmentsBaseForPeriod.filter(c => c.estado === 'Cancelada' || !!c.deletedAt).length,
  }

  const appointmentsFiltered = appointmentsBaseForPeriod.filter((cita) => {
    // Filtro por Estado
    if (estadoFiltro !== 'todos') {
      const isCitaCancelada = cita.estado === 'Cancelada' || !!cita.deletedAt;
      if (estadoFiltro === 'Cancelada') {
        if (!isCitaCancelada) return false;
      } else {
        if (cita.estado !== estadoFiltro || !!cita.deletedAt) return false;
      }
    }

    // Si NO se está filtrando por mascota específica ni por veterinario específico,
    // se aplica la restricción de ocultar canceladas
    const isMascotaFiltroActivo = mascotaFiltro !== 'todos';
    const isVetFiltroActivo = vetFiltro !== 'todos';
    
    if (!isMascotaFiltroActivo && !isVetFiltroActivo) {
      const isCitaCancelada = !!cita.deletedAt || cita.estado === 'Cancelada';
      if (!verCanceladas && isCitaCancelada) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime());

  const loading = loadingCitas || loadingMascotas || loadingServicios || loadingUsuarios;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda de Citas</h1>
          <p className="text-muted-foreground mt-1">Calendario interactivo de turnos médicos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setOpenUrgencia(true)}
            variant="destructive"
            className="rounded-xl font-bold shadow-md shadow-destructive/20"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Ingreso Urgencia
          </Button>
          {(isAdmin || isCajero) && (
            <Button
              variant={verCanceladas ? "destructive" : "outline"}
              onClick={() => setVerCanceladas(!verCanceladas)}
              className="rounded-xl font-semibold"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              {verCanceladas ? "Ocultar Canceladas" : "Ver Citas Canceladas"}
            </Button>
          )}
          <Button onClick={() => { setCitaSeleccionada(null); setDialogCita(true) }} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Nueva Cita
          </Button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Citas</p>
              <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
            </div>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-amber-500 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pendientes</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-500">{stats.pendientes}</h3>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-sky-500 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">En Curso</p>
              <h3 className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-500">{stats.enCurso}</h3>
            </div>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <PlayCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-emerald-500 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completadas</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-500">{stats.completadas}</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1 overflow-hidden border-l-4 border-l-rose-500 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canceladas/Inactivas</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-500">{stats.canceladas}</h3>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => cambiarFecha(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold capitalize">{formatearFecha()}</h2>
              <Button variant="outline" size="icon" onClick={() => cambiarFecha(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Tabs value={vista} onValueChange={(v) => setVista(v as 'dia' | 'semana' | 'mes')}>
                <TabsList>
                  <TabsTrigger value="dia">Día</TabsTrigger>
                  <TabsTrigger value="semana">Semana</TabsTrigger>
                  <TabsTrigger value="mes">Mes</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>

        {/* Panel de Filtros Completo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/10 border-y border-border">
          {/* Filtro de Fecha */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Filtrar por Fecha</Label>
            <Input
              type="date"
              value={fecha.toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) {
                  setFecha(new Date(e.target.value + 'T00:00:00'))
                }
              }}
              className="rounded-xl h-10 text-sm"
            />
          </div>

          {/* Filtro de Veterinario */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Veterinario</Label>
            <Select value={vetFiltro} onValueChange={setVetFiltro}>
              <SelectTrigger className="rounded-xl h-10 text-sm">
                <SelectValue placeholder="Todos los veterinarios" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todos">Todos los veterinarios</SelectItem>
                {veterinarios.map(v => (
                  <SelectItem key={v.id} value={v.id.toString()}>{v.nombres} {v.apellidos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Mascota */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Mascota / Paciente</Label>
            <Select value={mascotaFiltro} onValueChange={setMascotaFiltro}>
              <SelectTrigger className="rounded-xl h-10 text-sm">
                <SelectValue placeholder="Todas las mascotas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl font-medium">
                <SelectItem value="todos">Todas las mascotas</SelectItem>
                {(mascotas ?? []).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.dueno ? `${m.dueno.nombres} ${m.dueno.apellidos}` : 'Sin dueño'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Estado */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Estado de Cita</Label>
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="rounded-xl h-10 text-sm">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En_Curso">En Curso</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
                <SelectItem value="No_Asistio">No Asistió</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando turnos médicos...</span>
            </div>
          ) : appointmentsFiltered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay citas programadas para este período.
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsFiltered.map(cita => {
                const citaDate = new Date(cita.fecha_hora_inicio)
                const horaStr = citaDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                const isDeleted = !!cita.deletedAt
                const isCancelled = cita.estado === 'Cancelada'
                const style = isDeleted ? cardStyles['Cancelada'] : (cardStyles[cita.estado ?? ''] || cardStyles['No_Asistio'])
                const opacityClass = (isDeleted || isCancelled) ? 'opacity-65 grayscale-[20%]' : ''
                const textDecorationClass = (isDeleted || isCancelled) ? 'line-through decoration-muted-foreground/50' : ''
                
                return (
                  <div
                    key={cita.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.005] cursor-pointer ${style.border} ${style.bg} ${opacityClass}`}
                    onClick={() => {
                      setCitaSeleccionada(cita)
                      setNuevoEstado(cita.estado)
                      setMotivoCancelacion(cita.motivo_cancelacion || '')
                      setDialogCita(true)
                    }}
                  >
                    <div className="flex flex-col items-center justify-center w-16 text-center border-r pr-3 border-border">
                      <Clock className="h-4 w-4 mb-1 text-primary" />
                      <span className="text-sm font-bold text-foreground">{horaStr}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold text-base text-foreground ${textDecorationClass}`}>
                          {cita.mascota?.nombre || 'Mascota'} 
                        </p>
                        <span className="text-muted-foreground text-xs bg-muted/60 px-2 py-0.5 rounded-full font-medium">
                          Dueño: {cita.mascota?.dueno ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}` : 'Sin dueño'}
                        </span>
                        {isDeleted && (
                          <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2">
                            Desactivada
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground/80">{cita.servicio?.nombre || 'Servicio'}</span>
                        <span className="text-muted-foreground/60">•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground/60" />
                          Dr(a). {cita.veterinario ? `${cita.veterinario.nombres} ${cita.veterinario.apellidos}` : 'No asignado'}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {cita.estado === 'Completada' && (cita as any).updatedAt
                          ? `Atendida el ${new Date((cita as any).updatedAt).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : cita.estado === 'Cancelada' && (cita as any).updatedAt
                          ? `Cancelada el ${new Date((cita as any).updatedAt).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : `Agendada: ${new Date(cita.fecha_hora_inicio).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        }
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={`rounded-full px-3 py-1 font-semibold text-xs border ${estadoColor[cita.estado] || 'bg-gray-100'}`}>
                        {estadoLabel[cita.estado] || cita.estado}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Agendar/Editar Cita */}
      <Dialog open={dialogCita} onOpenChange={setDialogCita}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{citaSeleccionada ? 'Detalles de la Cita' : 'Agendar Nueva Cita'}</DialogTitle>
          </DialogHeader>
          
          {citaSeleccionada ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Mascota</span>
                  <span className="font-semibold text-base text-primary">{citaSeleccionada.mascota?.nombre || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Dueño</span>
                  <span className="font-medium text-base">{citaSeleccionada.mascota?.dueno ? `${citaSeleccionada.mascota.dueno.nombres} ${citaSeleccionada.mascota.dueno.apellidos}` : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Servicio</span>
                  <span className="font-semibold">{citaSeleccionada.servicio?.nombre || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Veterinario</span>
                  <span>{citaSeleccionada.veterinario ? `${citaSeleccionada.veterinario.nombres} ${citaSeleccionada.veterinario.apellidos}` : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Fecha y Hora</span>
                  <span className="flex items-center gap-1 font-mono"><Calendar className="h-3 w-3" /> {new Date(citaSeleccionada.fecha_hora_inicio).toLocaleDateString()} {new Date(citaSeleccionada.fecha_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Estado de Cita</span>
                  <Badge className={`mt-1 ${estadoColor[citaSeleccionada.estado] || 'bg-gray-100'}`}>{estadoLabel[citaSeleccionada.estado] || citaSeleccionada.estado}</Badge>
                </div>
              </div>

              <div className="rounded-xl border p-3 bg-muted/10">
                <span className="text-muted-foreground block text-xs">Motivo de la Cita</span>
                <p className="mt-1 font-medium">{citaSeleccionada.motivo_cita}</p>
              </div>

              {citaSeleccionada.motivo_cancelacion && (
                <div className="rounded-xl border border-destructive/20 p-3 bg-destructive/5">
                  <span className="text-destructive font-semibold block text-xs">Motivo de Cancelación</span>
                  <p className="mt-1 font-medium text-sm text-destructive">{citaSeleccionada.motivo_cancelacion}</p>
                </div>
              )}

              {!citaSeleccionada.deletedAt ? (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="estado" className="text-sm font-semibold">Cambiar Estado</Label>
                    <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar nuevo estado" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {citaSeleccionada.estado !== 'Cancelada' && citaSeleccionada.estado !== 'No_Asistio' && (
                          <SelectItem value={citaSeleccionada.estado} disabled>
                            {estadoLabel[citaSeleccionada.estado] || citaSeleccionada.estado} (Actual)
                          </SelectItem>
                        )}
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                        <SelectItem value="No_Asistio">No Asistió</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {nuevoEstado === 'Cancelada' && (
                    <div className="space-y-2">
                      <Label htmlFor="motivoCancelacion" className="text-sm font-semibold">Motivo de Cancelación *</Label>
                      <Input
                        id="motivoCancelacion"
                        placeholder="Escribe el motivo del por qué se cancela..."
                        value={motivoCancelacion}
                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  )}

                  <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-6 w-full">
                    <div>
                      {(isAdmin || isCajero) && (
                        <Button type="button" variant="destructive" onClick={handleEliminarCita} className="rounded-xl font-semibold">
                          Desactivar Cita
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button type="button" variant="outline" onClick={() => setDialogCita(false)} className="rounded-xl">
                        Cerrar
                      </Button>
                      <Button type="button" onClick={handleCambiarEstado} disabled={citaSeleccionada.estado === nuevoEstado} className="rounded-xl">
                        Actualizar Estado
                      </Button>
                    </div>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <Separator />
                  <div className="flex gap-2 p-3 bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive text-sm font-semibold w-full">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <span>Esta cita ha sido inactivada/desactivada lógicamente.</span>
                  </div>

                  <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-6 w-full">
                    <div>
                      {/* Empty space or additional options for deleted if needed */}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button type="button" variant="outline" onClick={() => setDialogCita(false)} className="rounded-xl">
                        Cerrar
                      </Button>
                      {isAdmin && (
                        <Button type="button" onClick={handleRestaurarCita} className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md">
                          Restaurar Cita
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mascota">Mascota *</Label>
                <Select value={form.id_mascota_fk} onValueChange={(val) => setForm({ ...form, id_mascota_fk: val })}>
                  <SelectTrigger id="mascota" className="rounded-xl h-11">
                    <SelectValue placeholder="Seleccionar mascota" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(mascotas ?? []).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.dueno ? `${m.dueno.nombres} ${m.dueno.apellidos}` : 'Sin dueño'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicio">Servicio *</Label>
                <Select value={form.id_servicio_fk} onValueChange={(val) => setForm({ ...form, id_servicio_fk: val })}>
                  <SelectTrigger id="servicio" className="rounded-xl h-11">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(servicios ?? []).map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="veterinario">Veterinario *</Label>
                <Select value={form.id_veterinario_fk} onValueChange={(val) => setForm({ ...form, id_veterinario_fk: val })}>
                  <SelectTrigger id="veterinario" className="rounded-xl h-11">
                    <SelectValue placeholder="Asignar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {veterinarios.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.nombres} {v.apellidos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input id="fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Input id="hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Input id="motivo" placeholder="Motivo de la consulta..." value={form.motivo_cita} onChange={(e) => setForm({ ...form, motivo_cita: e.target.value })} className="rounded-xl h-11" />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 sm:col-span-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogCita(false)} className="rounded-xl">Cancelar</Button>
                <Button type="button" onClick={handleSave} className="rounded-xl">Guardar Cita</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UrgenciaModal open={openUrgencia} onOpenChange={setOpenUrgencia} />
      {confirmDialog}
    </div>
  )
}