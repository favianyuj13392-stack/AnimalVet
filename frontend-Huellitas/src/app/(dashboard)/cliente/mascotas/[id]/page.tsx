'use client'

import { useState } from 'react'
import { usePdfViewer } from "@/shared/hooks/usePdfViewer";
import { FileViewer } from "@/shared/components/ui/file-viewer";
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, QrCode, PawPrint, Loader2, Activity,
  Calendar, Syringe, FileText, Paperclip, HeartPulse,
  Download, ExternalLink, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

import { MedicalIdCard } from '@/domains/pets/components/medical-id-card'
import { VaccinesTable } from '@/domains/pets/components/vaccines-table'
import { QrEmergencyModal } from '@/domains/pets/components/qr-emergency-modal'
import { PetLostStatus } from '@/domains/pets/components/pet-lost-status'
import { useQuery } from '@tanstack/react-query'
import { mascotasService } from '@/domains/pets/services/mascotas.service'
import { speciesService } from '@/domains/pets/services/especies.service'
import { breedsService } from '@/domains/pets/services/breeds.service'
import { historialClinicoService } from '@/domains/clinical/services/historial-clinico.service'
import { archivosAdjuntosService } from '@/domains/clinical/services/archivos-adjuntos.service'
import { hospitalizacionesService } from '@/domains/clinical/services/hospitalizaciones.service'
import { Mascota, Especie, Raza } from '@/domains/pets/pets.types'
import { HistorialClinico } from '@/domains/clinical/clinical.types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/huellitas'

export default function PerfilMascotaPage() {
  const { id } = useParams()
  const [openQrDialog, setOpenQrDialog] = useState(false)
  const { pdf, loading: loadingPdf, openPdf, closePdf } = usePdfViewer();

  const { data: apiMascota, isLoading: loadingMascota, isError: errorMascota } = useQuery<Mascota>({
    queryKey: ['mascota', id],
    queryFn: () => mascotasService.getOne(id as string),
    enabled: !!id,
  })

  const { data: especies } = useQuery<Especie[]>({
    queryKey: ['especies'],
    queryFn: () => speciesService.getAll(),
  })

  const { data: razas } = useQuery<Raza[]>({
    queryKey: ['razas'],
    queryFn: () => breedsService.getAll(),
  })

  const { data: expedienteData, isLoading: loadingHistorial } = useQuery({
    queryKey: ['historial-mi-mascota', id],
    queryFn: () => historialClinicoService.getByMiMascota(id as string),
    enabled: !!id,
  })

  const { data: hospitalizaciones = [], isLoading: loadingHosp } = useQuery({
    queryKey: ['hospitalizaciones-mascota', id],
    queryFn: () => hospitalizacionesService.getByMascota(id as string),
    enabled: !!id,
  })

  // Archivos adjuntos: fetch por cada historial en paralelo
  const historiales: HistorialClinico[] = expedienteData?.historiales ?? []

  const { data: archivosData = [], isLoading: loadingArchivos } = useQuery({
    queryKey: ['archivos-mascota', id, historiales.map((h) => h.id)],
    queryFn: async () => {
      if (historiales.length === 0) return []
      const results = await Promise.all(
        historiales.map((h) => archivosAdjuntosService.getByHistorial(h.id).catch(() => []))
      )
      return results.flat()
    },
    enabled: historiales.length > 0,
  })

  if (loadingMascota) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground animate-in fade-in">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm">Cargando expediente...</p>
      </div>
    )
  }

  if (errorMascota || !apiMascota) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-border rounded-2xl text-center px-8">
        <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
          <PawPrint className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No se pudo cargar la mascota</p>
          <p className="text-sm text-muted-foreground mt-0.5">Verifica que el identificador sea correcto.</p>
        </div>
        <Link href="/cliente/mascotas">
          <Button size="sm" variant="outline" className="rounded-lg mt-1">Volver a mis mascotas</Button>
        </Link>
      </div>
    )
  }

  const resolvedRaza    = (razas    ?? []).find(r => Number(r.id) === Number(apiMascota.id_raza_fk))
  const resolvedEspecie = (especies ?? []).find(e => Number(e.id) === Number(resolvedRaza?.id_especie_fk))

  const calcularEdad = (fechaNac: string) => {
    if (!fechaNac) return '—'
    const birth = new Date(fechaNac)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age > 0 ? `${age} ${age === 1 ? 'año' : 'años'}` : 'Menor de 1 año'
  }

  // Vacunas reales extraídas de vacunas_aplicadas de cada historial
  const vacunasReales = historiales.flatMap((h: any) =>
    (h.vacunas_aplicadas ?? []).map((v: any) => ({
      nombre: v.vacuna?.nombre ?? v.nombre_vacuna ?? 'Vacuna',
      fecha:  v.fecha_aplicacion ? v.fecha_aplicacion.split('T')[0] : '—',
      lote:   v.lote_vacuna ?? '—',
      vet:    v.veterinario ? `${v.veterinario.nombres} ${v.veterinario.apellidos}` : 'Medico Huellitas',
      estado: 'Aplicada',
    }))
  )

  // Recetas extraídas de los historiales
  const recetasReales = historiales.flatMap((h: any) =>
    (h.recetas ?? []).map((r: any) => ({
      ...r,
      fecha_consulta: h.fecha_consulta,
      tipo_atencion:  h.tipo_atencion,
    }))
  )

  // Hospitalización activa (sin fecha de alta)
  const hospActiva = (hospitalizaciones as any[]).find(h => !h.fecha_alta)

  // Último peso registrado en historial (el más reciente)
  const ultimoPeso = historiales.length > 0
    ? [...historiales]
        .sort((a: any, b: any) => new Date(b.fecha_consulta || 0).getTime() - new Date(a.fecha_consulta || 0).getTime())
        .find((h: any) => h.triaje?.peso_kg && Number(h.triaje.peso_kg) > 0)?.triaje?.peso_kg ?? null
    : null

  const mascotaFormatted = {
    nombre:           apiMascota.nombre,
    especie:          resolvedEspecie?.nombre || 'Desconocida',
    raza:             resolvedRaza?.nombre    || 'Desconocida',
    edad:             calcularEdad(apiMascota.fecha_nacimiento),
    sexo:             apiMascota.sexo === 'M' ? 'Macho' : 'Hembra',
    esterilizado:     !!apiMascota.esterilizado,
    peso:             ultimoPeso ? `${ultimoPeso} kg` : '—',
    nombrePropietario: apiMascota.dueno
      ? `${apiMascota.dueno.nombres} ${apiMascota.dueno.apellidos}`.trim()
      : 'Sin dueño',
    telefonoUrgencia: apiMascota.dueno?.telefono || 'Sin teléfono',
    foto:             (apiMascota as any).foto_url ||
      apiMascota.url_perfil_publico ||
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400',
    alergias:    'Ninguna conocida',
    condiciones: 'Ninguna',
    hash_qr_identidad: apiMascota.hash_qr_identidad,
    historial: [],
    vacunas:   vacunasReales,
  }

  const urlEmergenciaPublica = `https://huellitas-digitales.net/emergencia/${apiMascota.hash_qr_identidad}`

  // Estado visual para hospitalizacion
  const HOSP_COLOR: Record<string, string> = {
    Observacion: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
    Estable:     'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
    Grave:       'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
    Alta:        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">

      {/* ─── PAGE HEADER ─── */}
      <div>
        <Link href="/cliente/mascotas">
          <Button variant="ghost" size="sm"
            className="-ml-2 mb-3 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Mis mascotas
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              {(apiMascota as any).foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(apiMascota as any).foto_url} alt={mascotaFormatted.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-primary">
                  {mascotaFormatted.nombre.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {mascotaFormatted.nombre}
                </h1>
                {hospActiva && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 gap-1">
                    <HeartPulse className="h-2.5 w-2.5" /> Internado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {mascotaFormatted.especie} · {mascotaFormatted.raza} · {mascotaFormatted.edad}
                </span>
                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-medium ${
                  mascotaFormatted.esterilizado
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'border-border bg-transparent text-muted-foreground'
                }`}>
                  {mascotaFormatted.esterilizado ? 'Esterilizado' : 'No esterilizado'}
                </Badge>
              </div>
            </div>
          </div>
          <Button size="sm" className="rounded-lg gap-1.5 h-9 text-xs shrink-0 w-full sm:w-auto"
            onClick={() => setOpenQrDialog(true)}>
            <QrCode className="h-3.5 w-3.5" /> Placa QR de emergencia
          </Button>
        </div>
      </div>

      <QrEmergencyModal open={openQrDialog} onOpenChange={setOpenQrDialog}
        mascota={mascotaFormatted} urlEmergenciaPublica={urlEmergenciaPublica} />

      {/* ─── ALERTA INTERNACIÓN ACTIVA ─── */}
      {hospActiva && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {mascotaFormatted.nombre} está internado actualmente
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
              Motivo: {hospActiva.motivo_ingreso} · Estado: {hospActiva.estado_actual}
              {hospActiva.veterinario && ` · Dr. ${hospActiva.veterinario.nombres} ${hospActiva.veterinario.apellidos}`}
            </p>
          </div>
        </div>
      )}

      {/* ─── DETALLE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Carnet médico */}
        <MedicalIdCard mascota={mascotaFormatted} />

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="historial" className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-xl bg-muted/50 p-1 mb-5 border border-border/40 h-10">
              <TabsTrigger value="historial"   className="rounded-lg text-xs font-semibold">Historial</TabsTrigger>
              <TabsTrigger value="vacunas"     className="rounded-lg text-xs font-semibold">Vacunas</TabsTrigger>
              <TabsTrigger value="recetas"     className="rounded-lg text-xs font-semibold">Recetas</TabsTrigger>
              <TabsTrigger value="archivos"    className="rounded-lg text-xs font-semibold">Archivos</TabsTrigger>
              <TabsTrigger value="qr"          className="rounded-lg text-xs font-semibold">QR</TabsTrigger>
            </TabsList>

            {/* ── HISTORIAL ── */}
            <TabsContent value="historial" className="outline-none">
              <Card className="rounded-xl border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Consultas y tratamientos
                  </CardTitle>
                  <CardDescription className="text-xs">Cronologia de atenciones en la clinica.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistorial ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm">Cargando historial...</span>
                    </div>
                  ) : historiales.length === 0 ? (
                    <EmptyState icon={Activity} title="Sin consultas registradas"
                      desc="Las atenciones clinicas aparecerán aqui." />
                  ) : (
                    <div className="space-y-5">
                      {historiales.map((h: any, idx: number) => (
                        <div key={h.id ?? idx} className="relative pl-5 pb-5 border-l-2 border-primary/20 last:pb-0">
                          <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                          <div className="space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                {h.fecha_consulta ? h.fecha_consulta.split('T')[0] : '—'}
                              </span>
                              {h.veterinario && (
                                <span className="text-[11px] text-muted-foreground">
                                  {h.veterinario.nombres} {h.veterinario.apellidos}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-sm text-foreground">{h.tipo_atencion ?? 'Consulta'}</p>
                            {h.motivo_consulta && (
                              <p className="text-xs text-muted-foreground">{h.motivo_consulta}</p>
                            )}
                            {h.diagnostico && (
                              <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1.5 mt-1.5">
                                <p><span className="font-medium text-foreground">Diagnostico: </span>{h.diagnostico}</p>
                                {h.peso_actual_kg && (
                                  <p><span className="font-medium text-foreground">Peso: </span>{h.peso_actual_kg} kg</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── VACUNAS ── */}
            <TabsContent value="vacunas" className="outline-none">
              {loadingHistorial ? (
                <LoadingCard label="Cargando vacunas..." />
              ) : vacunasReales.length === 0 ? (
                <Card className="rounded-xl border-border/50 shadow-sm">
                  <CardContent className="pt-6">
                    <EmptyState icon={Syringe} title="Sin vacunas registradas"
                      desc="Las vacunas aplicadas en consulta aparecerán aqui." />
                  </CardContent>
                </Card>
              ) : (
                <VaccinesTable vacunas={vacunasReales} onPrint={() => window.print()} />
              )}
            </TabsContent>

            {/* ── RECETAS ── */}
            <TabsContent value="recetas" className="outline-none">
              <Card className="rounded-xl border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Prescripciones medicas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Medicamentos indicados por el veterinario. Descarga el PDF para presentarlo en farmacia.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistorial ? (
                    <LoadingCard label="Cargando recetas..." />
                  ) : recetasReales.length === 0 ? (
                    <EmptyState icon={FileText} title="Sin recetas registradas"
                      desc="Las prescripciones emitidas apareceran aqui." />
                  ) : (
                    <div className="space-y-3">
                      {recetasReales.map((receta: any, idx: number) => (
                        <div key={receta.id ?? idx} className="rounded-lg border border-border/50 p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {receta.tipo_atencion ?? 'Consulta'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {receta.fecha_consulta ? receta.fecha_consulta.split('T')[0] : '—'}
                                {receta.veterinario && ` · ${receta.veterinario.nombres} ${receta.veterinario.apellidos}`}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg h-8 text-xs gap-1.5 shrink-0"
                              disabled={loadingPdf}
                              onClick={() => openPdf(`/recetas/${receta.id}/pdf`, `Receta-${receta.id.slice(-6).toUpperCase()}.pdf`)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {loadingPdf ? "Cargando..." : "Ver PDF"}
                            </Button>
                          </div>
                          {receta.indicaciones_grales && (
                            <p className="text-xs text-muted-foreground italic">
                              {receta.indicaciones_grales}
                            </p>
                          )}
                          {receta.detalles && receta.detalles.length > 0 && (
                            <div className="space-y-1.5">
                              {receta.detalles.map((d: any, i: number) => (
                                <div key={i} className="bg-muted/30 rounded-lg px-3 py-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
                                  <span className="font-medium text-foreground">
                                    {d.producto?.nombre || d.medicamento_texto || 'Medicamento'}
                                  </span>
                                  <span className="text-muted-foreground">Dosis: {d.dosis}</span>
                                  <span className="text-muted-foreground">Frecuencia: {d.frecuencia}</span>
                                  {d.duracion_dias && (
                                    <span className="text-muted-foreground">{d.duracion_dias} dias</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── ARCHIVOS ── */}
            <TabsContent value="archivos" className="outline-none">
              <Card className="rounded-xl border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" /> Archivos medicos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Radiografias, resultados de laboratorio, ecografias y otros estudios.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingArchivos ? (
                    <LoadingCard label="Cargando archivos..." />
                  ) : archivosData.length === 0 ? (
                    <EmptyState icon={Paperclip} title="Sin archivos adjuntos"
                      desc="Los estudios y resultados médicos apareceran aqui." />
                  ) : (
                    <div className="space-y-2">
                      {archivosData.map((archivo: any) => (
                        <div key={archivo.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Paperclip className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {archivo.nombre_archivo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {archivo.tipo_estudio ?? archivo.tipo_archivo}
                              {archivo.fecha_estudio && ` · ${archivo.fecha_estudio.split('T')[0]}`}
                            </p>
                          </div>
                          <a href={archivo.url_archivo} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* ── QR / ESTADO PERDIDO ── */}
            <TabsContent value="qr" className="outline-none">
              <PetLostStatus mascota={apiMascota} />
            </TabsContent>

          </Tabs>

          {/* Hospitalizaciones históricas (fuera de tabs, al final) */}
          {!loadingHosp && (hospitalizaciones as any[]).length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Historial de internaciones
              </p>
              {(hospitalizaciones as any[]).map((h: any) => (
                <div key={h.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.motivo_ingreso}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ingreso: {h.fecha_ingreso ? h.fecha_ingreso.split('T')[0] : '—'}
                        {h.fecha_alta && ` · Alta: ${h.fecha_alta.split('T')[0]}`}
                        {h.veterinario && ` · ${h.veterinario.nombres} ${h.veterinario.apellidos}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 shrink-0 ${HOSP_COLOR[h.estado_actual] ?? 'border-border bg-muted text-muted-foreground'}`}>
                      {h.estado_actual}
                    </Badge>
                  </div>
                  {h.costo_por_dia > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Costo por dia: {h.costo_por_dia} Bs
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pdf && (
        <FileViewer
          url={pdf.url}
          nombre={pdf.nombre}
          tipo="application/pdf"
          onClose={closePdf}
        />
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center text-muted-foreground">
      <Icon className="h-7 w-7 opacity-25" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs">{desc}</p>
    </div>
  )
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
