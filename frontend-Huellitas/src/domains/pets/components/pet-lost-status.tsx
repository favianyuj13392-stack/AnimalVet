"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MapPicker = dynamic(
  () => import("@/shared/components/ui/map-picker").then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" /> }
);
import {
  MapPin, AlertTriangle, History, Smartphone,
  CheckCircle, Phone, Navigation, ExternalLink,
} from "lucide-react";

const MapView = dynamic(
  () => import("@/shared/components/ui/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" /> }
);
import { Switch } from "@/shared/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { mascotasService } from "../services/mascotas.service";
import { escaneosQrService } from "@/domains/admin/services/escaneos-qr.service";
import { Mascota, UpdateEstadoPerdidoDto } from "../pets.types";

interface PetLostStatusProps {
  mascota: Mascota;
}

export function PetLostStatus({ mascota }: PetLostStatusProps) {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Omit<UpdateEstadoPerdidoDto, "estado_perdido">>({
    punto_entrega_nombre: mascota.punto_entrega_nombre ?? "",
    punto_entrega_direccion: mascota.punto_entrega_direccion ?? "",
    punto_entrega_referencia: mascota.punto_entrega_referencia ?? "",
    recompensa: mascota.recompensa ?? false,
    mensaje_encontrador: mascota.mensaje_encontrador ?? "",
  });

  // Escaneos reales desde el backend
  const { data: escaneos = [], isLoading: loadingEscaneos } = useQuery({
    queryKey: ["escaneos-qr", mascota.id],
    queryFn: () => escaneosQrService.getPorMascota(mascota.id),
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateEstadoPerdidoDto) =>
      mascotasService.actualizarParcial(mascota.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mascota", mascota.id] });
      queryClient.invalidateQueries({ queryKey: ["escaneos-qr", mascota.id] });
    },
  });

  const handleActivar = () => {
    // Si ya tiene punto de entrega configurado, activar directo
    if (mascota.punto_entrega_nombre && mascota.punto_entrega_direccion) {
      mutation.mutate({ estado_perdido: true }, {
        onSuccess: () => toast.error(`¡Alerta activada para ${mascota.nombre}!`, {
          description: "Se notificará al dueño cuando alguien escanee el QR.",
        }),
      });
    } else {
      // Si no tiene punto de entrega, abrir el formulario primero
      setOpenForm(true);
    }
  };

  const handleDesactivar = () => {
    mutation.mutate({
      estado_perdido: false,
      punto_entrega_nombre: "",
      punto_entrega_direccion: "",
      punto_entrega_referencia: "",
      mensaje_encontrador: "",
      recompensa: false,
    }, {
      onSuccess: () => toast.success(`${mascota.nombre} marcada como a salvo.`),
    });
  };

  const handleToggle = (checked: boolean) => {
    if (checked) handleActivar();
    else handleDesactivar();
  };

  const handleGuardarYActivar = () => {
    if (!form.punto_entrega_nombre) {
      toast.error("El nombre del punto de entrega es obligatorio.");
      return;
    }
    if (!form.punto_entrega_lat || !form.punto_entrega_lng) {
      toast.error("Toca el mapa para marcar el punto de entrega.");
      return;
    }
    if (!form.punto_entrega_direccion) {
      toast.error("La dirección es obligatoria.");
      return;
    }
    mutation.mutate(
      { estado_perdido: true, ...form },
      {
        onSuccess: () => {
          setOpenForm(false);
          toast.error(`¡Alerta activada para ${mascota.nombre}!`, {
            description: "Se notificará al dueño cuando alguien escanee el QR.",
          });
        },
      }
    );
  };

  const estaPerdido = mascota.estado_perdido;

  return (
    <div className="space-y-6">

      {/* TARJETA CONTROL DE ESTADO */}
      <Card className={`rounded-3xl border-2 transition-all ${
        estaPerdido
          ? "border-destructive/40 bg-destructive/5"
          : "border-border/50 bg-card/60"
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-foreground">Estado de Alerta</h3>
                {estaPerdido ? (
                  <Badge variant="destructive" className="animate-pulse text-[10px]">EXTRAVIADO 🚨</Badge>
                ) : (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500/90 text-[10px]">A SALVO ✓</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {estaPerdido
                  ? "La alerta está activa. Cuando alguien escanee el QR verá el punto de entrega y podrá llamarte."
                  : `Activa la alerta si ${mascota.nombre} se extravía. Deberás indicar un punto de entrega.`}
              </p>

              {/* Punto de entrega activo */}
              {estaPerdido && mascota.punto_entrega_nombre && (
                <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1 text-xs">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {mascota.punto_entrega_nombre}
                  </p>
                  <p className="text-muted-foreground">{mascota.punto_entrega_direccion}</p>
                  {mascota.punto_entrega_referencia && (
                    <p className="text-muted-foreground italic">{mascota.punto_entrega_referencia}</p>
                  )}
                  {mascota.punto_entrega_lat && mascota.punto_entrega_lng && (
                    <a
                      href={`https://maps.google.com/?q=${mascota.punto_entrega_lat},${mascota.punto_entrega_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver en Google Maps
                    </a>
                  )}
                  {mascota.recompensa && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-[10px]">
                      Se ofrece recompensa
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <span className="text-sm font-bold text-muted-foreground">
                {estaPerdido ? "Alerta activa" : "Protegido"}
              </span>
              <Switch
                checked={estaPerdido}
                onCheckedChange={handleToggle}
                disabled={mutation.isPending}
                className="data-[state=checked]:bg-destructive"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAPA DE ESCANEOS CON GPS */}
      {escaneos.some(s => s.latitud && s.longitud) && (
        <Card className="rounded-3xl border-border/50 bg-card/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Ubicaciones registradas
            </CardTitle>
            <CardDescription>
              Escaneos donde el encontrador compartió su ubicación voluntariamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <MapView
              markers={escaneos
                .filter(s => s.latitud && s.longitud)
                .map((s, i) => ({
                  lat: Number(s.latitud),
                  lng: Number(s.longitud),
                  color: "red" as const,
                  popup: `Escaneo ${new Date(s.createdAt).toLocaleString("es-BO")}`,
                  label: `#${i + 1}`,
                }))}
              zoom={13}
              height="280px"
            />
          </CardContent>
        </Card>
      )}

      {/* HISTORIAL DE ESCANEOS REALES */}
      <Card className="rounded-3xl border-border/50 bg-card/60 overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Historial de Lecturas QR
          </CardTitle>
          <CardDescription>
            Cada vez que alguien escanea la placa física de {mascota.nombre} queda registrado aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingEscaneos ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              Cargando escaneos...
            </div>
          ) : escaneos.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Navigation className="h-6 w-6 opacity-30" />
              <p className="text-sm">No se han registrado escaneos aún.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-4 px-6 font-semibold">Fecha y hora</TableHead>
                  <TableHead className="font-semibold">Ubicación GPS</TableHead>
                  <TableHead className="font-semibold">Dispositivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escaneos.map((scan) => (
                  <TableRow key={scan.id} className="hover:bg-muted/30 border-b border-border/30">
                    <TableCell className="py-4 px-6 font-mono text-xs font-semibold text-foreground">
                      {new Date(scan.createdAt).toLocaleString("es-BO")}
                    </TableCell>
                    <TableCell>
                      {scan.latitud && scan.longitud ? (
                        <a
                          href={`https://maps.google.com/?q=${scan.latitud},${scan.longitud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <MapPin className="h-3.5 w-3.5 text-destructive" />
                          {Number(scan.latitud).toFixed(4)}, {Number(scan.longitud).toFixed(4)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin ubicación compartida</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[180px]">{scan.user_agent ? scan.user_agent.slice(0, 40) + (scan.user_agent.length > 40 ? "…" : "") : "Desconocido"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DIALOG ANCHO — Formulario punto de entrega */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent
          className="!max-w-5xl w-full p-0 gap-0 rounded-3xl overflow-hidden"
          style={{ maxWidth: "min(90vw, 1024px)", width: "min(90vw, 1024px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        >

          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-destructive">
              <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              Activar alerta de extravío — {mascota.nombre}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              Marca el punto de entrega en el mapa y completa los datos. Aparecerá en la ficha pública del QR.
            </DialogDescription>
          </DialogHeader>

          {/* Body — 2 columnas, con scroll propio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden min-h-0">

            {/* Columna izquierda — formulario */}
            <div className="flex flex-col gap-4 px-6 py-4 border-r border-border/50 overflow-y-auto">

              <div className="space-y-1">
                <Label className="text-xs font-bold">Nombre del punto de entrega *</Label>
                <Input
                  placeholder="Ej: Clínica Huellitas Digitales"
                  value={form.punto_entrega_nombre}
                  onChange={e => setForm(f => ({ ...f, punto_entrega_nombre: e.target.value }))}
                  className="rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Dirección *</Label>
                <Input
                  placeholder="Se completa automáticamente al tocar el mapa"
                  value={form.punto_entrega_direccion}
                  onChange={e => setForm(f => ({ ...f, punto_entrega_direccion: e.target.value }))}
                  className="rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Referencia (opcional)</Label>
                <Input
                  placeholder="Ej: Frente al parque, portón azul"
                  value={form.punto_entrega_referencia}
                  onChange={e => setForm(f => ({ ...f, punto_entrega_referencia: e.target.value }))}
                  className="rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Mensaje para quien la encuentre</Label>
                <Textarea
                  placeholder="Ej: Mi perrita necesita medicación diaria, por favor llámame."
                  value={form.mensaje_encontrador}
                  onChange={e => setForm(f => ({ ...f, mensaje_encontrador: e.target.value }))}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Switch
                  checked={form.recompensa}
                  onCheckedChange={v => setForm(f => ({ ...f, recompensa: v }))}
                />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Ofrecer recompensa</p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-500/60">
                    Badge visible en la ficha pública del QR
                  </p>
                </div>
              </div>

              {form.punto_entrega_lat && form.punto_entrega_lng && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Pin marcado ✓ {Number(form.punto_entrega_lat).toFixed(4)}, {Number(form.punto_entrega_lng).toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            {/* Columna derecha — mapa */}
            <div className="flex flex-col gap-2 px-5 py-4 bg-muted/20 overflow-hidden">
              <div>
                <Label className="text-xs font-bold">Marca el punto en el mapa *</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Busca un lugar o toca el mapa. Puedes arrastrar el pin para ajustarlo.
                </p>
              </div>
              <MapPicker
                lat={form.punto_entrega_lat}
                lng={form.punto_entrega_lng}
                height="380px"
                onChange={(lat, lng, direccion) =>
                  setForm(f => ({
                    ...f,
                    punto_entrega_lat: lat,
                    punto_entrega_lng: lng,
                    punto_entrega_direccion: f.punto_entrega_direccion || direccion,
                  }))
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/20 shrink-0">
            <Button variant="outline" className="rounded-xl h-9 px-5 text-sm" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-xl h-9 px-6 bg-destructive hover:bg-destructive/90 font-bold gap-2 text-sm"
              onClick={handleGuardarYActivar}
              disabled={mutation.isPending}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {mutation.isPending ? "Activando..." : "Activar alerta"}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
