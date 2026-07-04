'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, Camera, Save, Loader2, User, Phone,
  Mail, Shield, CheckCircle2, PawPrint, Eye, EyeOff,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import api from '@/shared/lib/axios'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { cloudinaryService } from '@/shared/lib/claudinary.service'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { mascotasService } from '@/domains/pets/services/mascotas.service'

/* ─── helpers ─── */
function initials(n = '', a = '') {
  return `${n[0] ?? ''}${a[0] ?? ''}`.toUpperCase()
}

/* ─── Fila de campo ─── */
function Field({
  id, label, icon: Icon, children,
}: {
  id: string; label: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-2.5 h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {children}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ PAGE ══ */
export default function MiPerfilPage() {
  const { user, updateUser } = useAuthStore()

  const initial = {
    nombres:    user?.nombres    ?? '',
    apellidos:  user?.apellidos  ?? '',
    telefono:   user?.telefono   ?? '',
    avatar_url: user?.avatar_url ?? '',
  }

  const [form, setForm]               = useState(initial)
  const [password, setPassword]       = useState('')
  const [confirm,  setConfirm]        = useState('')
  const [showPwd,  setShowPwd]        = useState(false)
  const [saving,   setSaving]         = useState(false)
  const [uploading, setUploading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* detectar cambios */
  const isDirty =
    form.nombres    !== initial.nombres    ||
    form.apellidos  !== initial.apellidos  ||
    form.telefono   !== initial.telefono   ||
    form.avatar_url !== initial.avatar_url ||
    password.length > 0

  /* mascotas count */
  const { data: mascotas = [] } = useQuery({
    queryKey: ['mis-mascotas', user?.id],
    queryFn: () => mascotasService.getMisMascotas(user!.id).catch(() => []),
    enabled: !!user?.id,
  })

  /* subir foto directo */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await cloudinaryService.uploadFile(file)
      setForm(f => ({ ...f, avatar_url: url }))
      toast.success('Foto subida — recuerda guardar los cambios')
    } catch {
      toast.error('Error al subir la foto')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim()) {
      toast.error('El nombre y apellido son obligatorios')
      return
    }
    if (password && password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (password && password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        nombres:   form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono:  form.telefono.trim() || undefined,
        avatar_url: form.avatar_url || null,
      }
      if (password) payload.password = password

      await api.patch(`/usuarios/${user!.id}`, payload)

      updateUser({
        nombres:    form.nombres.trim(),
        apellidos:  form.apellidos.trim(),
        telefono:   form.telefono.trim() || undefined,
        avatar_url: form.avatar_url || null,
      })

      setPassword('')
      setConfirm('')
      toast.success('¡Perfil actualizado correctamente!')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setForm(initial)
    setPassword('')
    setConfirm('')
  }

  /* ── RENDER ── */
  return (
    <div className="max-w-4xl mx-auto pb-24 animate-in fade-in duration-500">

      {/* ── Breadcrumb ── */}
      <div className="mb-6">
        <Link href="/cliente/inicio">
          <Button variant="ghost" size="sm"
            className="-ml-2 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Inicio
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

        {/* ════════════ COLUMNA IZQUIERDA — TARJETA DE IDENTIDAD ════════════ */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* Avatar hero */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            {/* Fondo degradado */}
            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />

            <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
              {/* Avatar grande con botón cámara */}
              <div className="relative mb-4">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-card shadow-lg bg-primary/10 flex items-center justify-center">
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatar_url} alt="avatar"
                      className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-primary">
                      {initials(form.nombres, form.apellidos)}
                    </span>
                  )}
                </div>

                {/* Botón cámara overlay */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {uploading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <h2 className="text-lg font-bold text-foreground leading-tight">
                {form.nombres} {form.apellidos}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>

              <Badge variant="secondary" className="mt-3 rounded-full text-xs font-semibold px-3">
                {user?.rol?.nombre ?? 'Cliente'}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Resumen
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PawPrint className="h-3.5 w-3.5 text-primary" />
                </div>
                Mascotas registradas
              </div>
              <span className="text-sm font-bold text-foreground">{(mascotas as any[]).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                Estado de cuenta
              </div>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                Activo
              </Badge>
            </div>
          </div>

          {/* Indicador de cambios — solo visible si hay cambios */}
          {isDirty && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Tienes cambios sin guardar
              </p>
            </div>
          )}
        </div>

        {/* ════════════ COLUMNA DERECHA — FORMULARIO ════════════ */}
        <div className="space-y-4">

          {/* ── Sección: Información personal ── */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Información personal</p>
                <p className="text-xs text-muted-foreground">Tu nombre y datos de contacto</p>
              </div>
            </div>
            <div className="p-6 space-y-5">

              <div className="grid sm:grid-cols-2 gap-5">
                <Field id="nombres" label="Nombres" icon={User}>
                  <Input
                    id="nombres"
                    value={form.nombres}
                    onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
                    className="h-10 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/30"
                  />
                </Field>
                <Field id="apellidos" label="Apellidos" icon={User}>
                  <Input
                    id="apellidos"
                    value={form.apellidos}
                    onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                    className="h-10 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/30"
                  />
                </Field>
              </div>

              <Field id="telefono" label="Celular" icon={Phone}>
                <Input
                  id="telefono"
                  placeholder="Ej: 77712345"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="h-10 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/30"
                />
              </Field>

              <Field id="email" label="Correo electrónico" icon={Mail}>
                <Input
                  id="email"
                  value={user?.email ?? ''}
                  disabled
                  className="h-10 rounded-xl bg-muted/40 text-muted-foreground cursor-not-allowed border-border/30"
                />
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  El correo no puede modificarse directamente.
                </p>
              </Field>

            </div>
          </div>

          {/* ── Sección: Seguridad ── */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Seguridad</p>
                <p className="text-xs text-muted-foreground">Deja en blanco para no cambiar la contraseña</p>
              </div>
            </div>
            <div className="p-6 space-y-5">

              <Field id="password" label="Nueva contraseña" icon={Shield}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-10 rounded-xl bg-muted/20 border-border/50 pr-10 focus-visible:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-2.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field id="confirm" label="Confirmar contraseña" icon={Shield}>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={`h-10 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/30 ${
                    confirm && password !== confirm
                      ? 'border-destructive focus-visible:ring-destructive/30'
                      : ''
                  }`}
                />
                {confirm && password !== confirm && (
                  <p className="text-[11px] text-destructive mt-1">Las contraseñas no coinciden</p>
                )}
              </Field>

            </div>
          </div>
        </div>
      </div>

      {/* ════ BARRA FLOTANTE DE GUARDADO ════ */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isDirty
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-card/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Cambios sin guardar
          </span>
          <div className="w-px h-4 bg-border/60" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            disabled={saving}
            className="h-8 text-xs rounded-lg text-muted-foreground hover:text-foreground"
          >
            Descartar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs rounded-lg gap-1.5 shadow-sm"
          >
            {saving
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
              : <><Save className="h-3.5 w-3.5" /> Guardar cambios</>}
          </Button>
        </div>
      </div>

    </div>
  )
}
