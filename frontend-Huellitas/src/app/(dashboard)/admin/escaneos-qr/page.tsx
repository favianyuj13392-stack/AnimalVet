"use client";

import React, { useState } from "react";
import { QrCode, MapPin, Loader2, Search, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { escaneosQrService, EscaneoQr } from "@/domains/admin/services/escaneos-qr.service";

export default function EscaneosQrPage() {
  const [busqueda, setBusqueda] = useState("");

  const { data: escaneos = [], isLoading } = useQuery<EscaneoQr[]>({
    queryKey: ["escaneos-qr"],
    queryFn: () => escaneosQrService.getAll().catch(() => []),
  });

  const filtrados = escaneos.filter((e) =>
    e.mascota?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.user_agent?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const conGeo = escaneos.filter((e) => e.latitud && e.longitud).length;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground animate-in fade-in">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-semibold">Cargando escaneos...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">Identidad Digital</Badge>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">Escaneos QR</h1>
        <p className="text-muted-foreground mt-1">Registro de lecturas del código QR de cada mascota con geolocalización.</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: QrCode,  label: "Total Escaneos",       value: escaneos.length,    color: "bg-primary/10 text-primary" },
          { icon: MapPin,  label: "Con Geolocalización",  value: conGeo,             color: "bg-emerald-500/10 text-emerald-600" },
          { icon: Globe,   label: "Sin Geolocalización",  value: escaneos.length - conGeo, color: "bg-muted-foreground/10 text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABLA */}
      <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Registro de Escaneos</CardTitle>
              <CardDescription>Cada lectura del QR registra la IP y coordenadas del escáner</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar mascota o dispositivo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9 bg-background rounded-xl" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="py-4 px-6 font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Mascota</TableHead>
                <TableHead className="font-semibold">User Agent</TableHead>
                <TableHead className="font-semibold">Latitud</TableHead>
                <TableHead className="font-semibold">Longitud</TableHead>
                <TableHead className="font-semibold">Mapa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Sin escaneos registrados.</TableCell></TableRow>
              ) : filtrados.map((e) => (
                <TableRow key={e.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="py-4 px-6 font-mono text-xs text-muted-foreground">{format(new Date(e.createdAt), "dd MMM yyyy HH:mm", { locale: es })}</TableCell>
                  <TableCell className="font-semibold">{e.mascota?.nombre ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{e.user_agent ? e.user_agent.slice(0, 40) + (e.user_agent.length > 40 ? "…" : "") : "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{e.latitud?.toFixed(6) ?? <span className="text-muted-foreground text-xs">sin dato</span>}</TableCell>
                  <TableCell className="font-mono text-sm">{e.longitud?.toFixed(6) ?? <span className="text-muted-foreground text-xs">sin dato</span>}</TableCell>
                  <TableCell>
                    {e.latitud && e.longitud ? (
                      <a href={`https://www.google.com/maps?q=${e.latitud},${e.longitud}`} target="_blank" rel="noopener noreferrer">
                        <Badge className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors gap-1">
                          <MapPin className="h-3 w-3" /> Ver mapa
                        </Badge>
                      </a>
                    ) : <Badge variant="outline" className="text-muted-foreground">Sin coords</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
