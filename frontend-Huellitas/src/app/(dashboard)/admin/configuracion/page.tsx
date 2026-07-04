'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Separator } from '@/shared/components/ui/separator'
import { Switch } from '@/shared/components/ui/switch'
import { Settings, Save, Building2, Phone, Mail, Percent, Loader2, Clock, Package, Coins } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/shared/lib/axios'

interface ConfigState {
  nombreClinica: string
  slogan: string
  ciudad: string
  direccion: string
  telefono: string
  email: string
  monedaSimbolo: string
  monedaNombre: string
  descuentoMaximo: number
  descuentoMaximoPorcentaje: number
  citasDuracionDefault: number
  stockAlertaDias: number
  notificacionesWhatsApp: boolean
  notificacionesEmail: boolean
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigState>({
    nombreClinica: 'Veterinaria Huellitas',
    slogan: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    email: '',
    monedaSimbolo: 'Bs.',
    monedaNombre: 'Boliviano',
    descuentoMaximo: 20,
    descuentoMaximoPorcentaje: 20,
    citasDuracionDefault: 30,
    stockAlertaDias: 60,
    notificacionesWhatsApp: false,
    notificacionesEmail: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dbConfigs, setDbConfigs] = useState<any[]>([])

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/configuracion-clinica');
        setDbConfigs(data);
        const m: Record<string, string> = {};
        data.forEach((item: any) => { m[item.clave] = item.valor; });

        setConfig({
          nombreClinica:            m['nombre_clinica'] || 'Veterinaria Huellitas',
          slogan:                   m['clinica_slogan'] || '',
          ciudad:                   m['clinica_ciudad'] || '',
          direccion:                m['direccion'] || '',
          telefono:                 m['telefono'] || '',
          email:                    m['email'] || '',
          monedaSimbolo:            m['moneda_simbolo'] || 'Bs.',
          monedaNombre:             m['moneda_nombre'] || 'Boliviano',
          descuentoMaximo:          parseInt(m['descuento_maximo']) || 20,
          descuentoMaximoPorcentaje: parseInt(m['descuento_maximo_porcentaje']) || 20,
          citasDuracionDefault:     parseInt(m['citas_duracion_default']) || 30,
          stockAlertaDias:          parseInt(m['stock_alerta_dias']) || 60,
          notificacionesWhatsApp:   m['notificaciones_whatsapp'] === 'true',
          notificacionesEmail:      m['notificaciones_email'] === 'true',
        });
      } catch (err) {
        console.error("Error al cargar la configuración clínica:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const keysToSave = [
        { clave: 'nombre_clinica',              valor: config.nombreClinica,                        descripcion: 'Nombre de la Clínica' },
        { clave: 'clinica_slogan',              valor: config.slogan,                               descripcion: 'Slogan de la clínica' },
        { clave: 'clinica_ciudad',              valor: config.ciudad,                               descripcion: 'Ciudad donde opera la clínica' },
        { clave: 'direccion',                   valor: config.direccion,                            descripcion: 'Dirección física' },
        { clave: 'telefono',                    valor: config.telefono,                             descripcion: 'Teléfono de contacto' },
        { clave: 'email',                       valor: config.email,                                descripcion: 'Correo de contacto' },
        { clave: 'moneda_simbolo',              valor: config.monedaSimbolo,                        descripcion: 'Símbolo de moneda' },
        { clave: 'moneda_nombre',               valor: config.monedaNombre,                         descripcion: 'Nombre de la moneda' },
        { clave: 'descuento_maximo',            valor: config.descuentoMaximo.toString(),           descripcion: 'Descuento máximo para POS' },
        { clave: 'descuento_maximo_porcentaje', valor: config.descuentoMaximoPorcentaje.toString(), descripcion: 'Descuento máximo % para el back' },
        { clave: 'citas_duracion_default',      valor: config.citasDuracionDefault.toString(),      descripcion: 'Duración por defecto de citas en minutos' },
        { clave: 'stock_alerta_dias',           valor: config.stockAlertaDias.toString(),           descripcion: 'Días de anticipación para alerta de vencimiento' },
        { clave: 'notificaciones_whatsapp',     valor: config.notificacionesWhatsApp.toString(),    descripcion: 'Notificaciones WhatsApp' },
        { clave: 'notificaciones_email',        valor: config.notificacionesEmail.toString(),       descripcion: 'Notificaciones Email' },
      ];

      const promises = keysToSave.map(async (item) => {
        const existe = dbConfigs.find(c => c.clave === item.clave);
        if (existe) {
          return api.patch(`/configuracion-clinica/${item.clave}`, { valor: item.valor, descripcion: item.descripcion });
        } else {
          return api.post('/configuracion-clinica', item);
        }
      });

      await Promise.all(promises);
      toast.success('Configuración guardada correctamente');
      const { data } = await api.get('/configuracion-clinica');
      setDbConfigs(data);
    } catch (err) {
      console.error("Error al guardar la configuración:", err);
      toast.error('Error al guardar la configuración clínica');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ConfigState, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground animate-in fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold">Cargando configuración clínica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" /> Configuración Clínica
        </h1>
        <p className="text-muted-foreground mt-1">Parámetros generales del sistema</p>
      </div>

      {/* DATOS DE LA CLÍNICA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Datos de la Clínica</CardTitle>
          <CardDescription>Información visible para clientes y en documentos oficiales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombreClinica">Nombre de la Clínica</Label>
              <Input id="nombreClinica" value={config.nombreClinica} onChange={(e) => updateField('nombreClinica', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Input id="slogan" placeholder="Ej. Cuidamos a tu mejor amigo" value={config.slogan} onChange={(e) => updateField('slogan', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input id="ciudad" placeholder="Ej. Santa Cruz" value={config.ciudad} onChange={(e) => updateField('ciudad', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={config.direccion} onChange={(e) => updateField('direccion', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</Label>
              <Input id="telefono" value={config.telefono} onChange={(e) => updateField('telefono', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input id="email" type="email" value={config.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MONEDA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5" /> Moneda</CardTitle>
          <CardDescription>Configuración de moneda que aparece en tickets y reportes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monedaSimbolo">Símbolo</Label>
              <Input id="monedaSimbolo" placeholder="Ej. Bs." value={config.monedaSimbolo} onChange={(e) => updateField('monedaSimbolo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monedaNombre">Nombre de la Moneda</Label>
              <Input id="monedaNombre" placeholder="Ej. Boliviano" value={config.monedaNombre} onChange={(e) => updateField('monedaNombre', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PARÁMETROS DE OPERACIÓN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" /> Parámetros de Operación</CardTitle>
          <CardDescription>Configura los límites y reglas del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descuento" className="flex items-center gap-1"><Percent className="h-3 w-3" /> Descuento Máximo (%)</Label>
              <Input id="descuento" type="number" min={0} max={100} value={config.descuentoMaximo}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setConfig(prev => ({ ...prev, descuentoMaximo: v, descuentoMaximoPorcentaje: v }));
                }} />
              <p className="text-xs text-muted-foreground">Un cajero no podrá exceder este porcentaje (RF-24)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="citasDuracion" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Duración de Cita (min)</Label>
              <Input id="citasDuracion" type="number" min={5} max={480} value={config.citasDuracionDefault}
                onChange={(e) => updateField('citasDuracionDefault', parseInt(e.target.value) || 30)} />
              <p className="text-xs text-muted-foreground">Duración por defecto al agendar una cita</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stockAlerta" className="flex items-center gap-1"><Package className="h-3 w-3" /> Días de alerta de vencimiento de lotes</Label>
            <Input id="stockAlerta" type="number" min={1} max={365} value={config.stockAlertaDias}
              onChange={(e) => updateField('stockAlertaDias', parseInt(e.target.value) || 60)} />
            <p className="text-xs text-muted-foreground">Se mostrará alerta si un lote vence en menos de estos días</p>
          </div>
          <Separator />
          <div className="space-y-4">
            <Label>Notificaciones Automáticas</Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Enviar recordatorios de citas por WhatsApp</p>
              </div>
              <Switch checked={config.notificacionesWhatsApp} onCheckedChange={(v) => updateField('notificacionesWhatsApp', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-xs text-muted-foreground">Enviar notificaciones por correo electrónico</p>
              </div>
              <Switch checked={config.notificacionesEmail} onCheckedChange={(v) => updateField('notificacionesEmail', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Guardar Configuración</>
          )}
        </Button>
      </div>
    </div>
  )
}
