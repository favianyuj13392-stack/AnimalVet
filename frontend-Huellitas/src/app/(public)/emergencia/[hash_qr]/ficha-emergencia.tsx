'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import api from '@/shared/lib/axios'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

const MapView = dynamic(
  () => import('@/shared/components/ui/map-view').then(m => m.MapView),
  { ssr: false, loading: () => <div className="h-48 rounded-2xl bg-muted/40 animate-pulse" /> }
)
import {
  Phone, ShieldAlert, MapPin, Heart, Info,
  AlertOctagon, CheckCircle2, AlertTriangle, Navigation,
  ExternalLink, Gift,
} from 'lucide-react'

export default function FichaEmergenciaCliente() {
  const { hash_qr } = useParams()

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'scanning' | 'success' | 'denied'>('idle')
  const [mascota, setMascota] = useState<any>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)

  useEffect(() => {
    if (!hash_qr) return
    api.get(`/publico/mascotas/perfil/${hash_qr}`)
      .then(res => setMascota(res.data))
      .catch(() => setMascota(null))
      .finally(() => setLoadingPerfil(false))
  }, [hash_qr])

  useEffect(() => {
    if (!hash_qr) return
    api.post(`/publico/mascotas/escanear/${hash_qr}`, {}).catch(() => {})
  }, [hash_qr])

  const solicitarUbicacion = () => {
    setGpsStatus('scanning')
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setGpsStatus('success')
          await api.post(`/publico/mascotas/escanear/${hash_qr}`, { latitud: lat, longitud: lng }).catch(() => {})
        },
        () => setGpsStatus('denied'),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setGpsStatus('denied')
    }
  }

  if (loadingPerfil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-muted-foreground">Cargando ficha médica...</p>
        </div>
      </div>
    )
  }

  if (!mascota) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-xl font-black text-foreground">Código QR no encontrado</p>
          <p className="text-sm text-muted-foreground">Este código no está registrado en el sistema Huellitas Digitales.</p>
        </div>
      </div>
    )
  }

  const telefono = mascota.contacto_dueno?.telefono
  const tienePuntoEntrega = !!mascota.punto_entrega?.nombre

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col py-6 px-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full mx-auto space-y-5">

        {mascota.estado_perdido ? (
          <div className="p-4 rounded-3xl bg-destructive/10 border-2 border-destructive/30 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-destructive text-white flex items-center justify-center mx-auto animate-pulse">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-destructive block">Mascota Extraviada</span>
              <h1 className="text-xl font-black text-foreground">Ficha de Emergencia</h1>
            </div>
            {mascota.recompensa && (
              <Badge className="bg-amber-500 text-white gap-1 text-[10px]">
                <Gift className="h-3 w-3" /> Se ofrece recompensa
              </Badge>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-primary/10 border-2 border-primary/20 text-center space-y-1">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center mx-auto">
              <Heart className="h-5 w-5 fill-white" />
            </div>
            <h1 className="text-lg font-black text-foreground">Ficha Médica QR</h1>
            <p className="text-xs text-muted-foreground">Sistema Huellitas Digitales</p>
          </div>
        )}

        <Card className="rounded-3xl border-border/40 shadow-lg overflow-hidden bg-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                {mascota.foto_url ? (
                  <Image src={mascota.foto_url} alt={mascota.nombre} width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-4xl font-black text-primary">{mascota.nombre?.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">{mascota.nombre}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{mascota.especie} · {mascota.raza} · {mascota.sexo}</p>
                <p className="text-xs text-muted-foreground">{mascota.esterilizado ? 'Esterilizado/a' : 'No esterilizado/a'}</p>
                {mascota.estado_perdido && (
                  <span className="inline-block mt-1 text-[10px] font-black bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    ¡Reportado como extraviado!
                  </span>
                )}
              </div>
            </div>

            {mascota.caracteristicas_fisicas && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Características físicas
                </span>
                <p className="text-xs p-3 rounded-xl bg-muted/40 border border-border/50 text-foreground">
                  {mascota.caracteristicas_fisicas}
                </p>
              </div>
            )}

            {mascota.mensaje_encontrador && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Mensaje del dueño</p>
                <p className="text-xs text-amber-900 dark:text-amber-300 italic">"{mascota.mensaje_encontrador}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {tienePuntoEntrega && (
          <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-md overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Punto de entrega</p>
                  <p className="text-sm font-black text-foreground">{mascota.punto_entrega.nombre}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pl-11">{mascota.punto_entrega.direccion}</p>
              {mascota.punto_entrega.referencia && (
                <p className="text-xs text-muted-foreground italic pl-11">{mascota.punto_entrega.referencia}</p>
              )}
              {mascota.punto_entrega.lat && mascota.punto_entrega.lng && (
                <>
                  <MapView
                    markers={[{ lat: mascota.punto_entrega.lat, lng: mascota.punto_entrega.lng, color: "primary", popup: mascota.punto_entrega.nombre, label: mascota.punto_entrega.nombre }]}
                    zoom={15} height="200px" className="mt-2"
                  />
                  <a href={`https://maps.google.com/?q=${mascota.punto_entrega.lat},${mascota.punto_entrega.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="pl-11 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir en Google Maps
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {telefono && telefono !== 'No disponible' && (
            <Button size="lg" className="w-full rounded-2xl h-14 font-black text-sm gap-2" asChild>
              <a href={`tel:${telefono}`}><Phone className="h-5 w-5" /> Llamar al dueño — {mascota.contacto_dueno?.nombre}</a>
            </Button>
          )}

          {gpsStatus === 'idle' && (
            <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-primary" /> ¿Quieres avisar dónde estás?
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Opcional. Tu ubicación GPS se enviará únicamente al dueño. No se almacena ni comparte con nadie más.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full rounded-xl font-bold text-xs gap-1.5" onClick={solicitarUbicacion}>
                <MapPin className="h-3.5 w-3.5" /> Compartir mi ubicación
              </Button>
            </div>
          )}

          {gpsStatus === 'scanning' && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs font-semibold text-foreground">Obteniendo coordenadas GPS...</p>
            </div>
          )}

          {gpsStatus === 'success' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">¡Ubicación enviada al dueño!</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">El dueño fue notificado con tus coordenadas.</p>
              </div>
            </div>
          )}

          {gpsStatus === 'denied' && (
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground">Permiso denegado. Puedes llamar al dueño directamente.</p>
            </div>
          )}
        </div>

        <div className="text-[10px] leading-relaxed text-muted-foreground bg-muted p-3.5 rounded-xl border border-border flex gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>Por protección de datos, solo se muestra el nombre y teléfono de contacto del propietario. El sistema no recopila ni almacena tus datos personales.</span>
        </div>
      </div>

      <div className="text-center pt-8 text-xs text-muted-foreground">
        <span>Sistema de Placas QR por </span>
        <strong className="text-primary">Huellitas Digitales</strong>
      </div>
    </div>
  )
}
