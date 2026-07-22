"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Calendar, Phone, User, PawPrint, Loader2, Search, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import api from "@/shared/lib/axios";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { toast } from "sonner";

interface VacunaPendiente {
  id_vacuna_aplicada: string;
  vacuna: string;
  fecha_proxima_dosis: string;
  dias_restantes: number;
  mascota: {
    id: string;
    nombre: string;
  } | null;
  dueno: {
    nombres: string;
    apellidos: string;
    telefono: string | null;
    email: string;
  } | null;
}

export default function RecordatoriosPage() {
  const [dias, setDias] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para envío en lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queueActive, setQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const { data, isLoading } = useQuery<{ total_pendientes: number; vacunas_pendientes: VacunaPendiente[] }>({
    queryKey: ["vacunas-pendientes", dias],
    queryFn: async () => {
      const res = await api.get(`/reportes/vacunas-pendientes`, {
        params: { dias },
      });
      return res.data;
    },
  });

  const listado = data?.vacunas_pendientes ?? [];

  const filteredListado = listado.filter((item) => {
    const term = searchQuery.toLowerCase();
    const nombreMascota = item.mascota?.nombre?.toLowerCase() ?? "";
    const nombreDueno = `${item.dueno?.nombres ?? ""} ${item.dueno?.apellidos ?? ""}`.toLowerCase();
    const vacuna = item.vacuna.toLowerCase();
    return nombreMascota.includes(term) || nombreDueno.includes(term) || vacuna.includes(term);
  });

  const getWhatsAppLink = (telefono: string, mascota: string, vacuna: string, fecha: string, dueno: string) => {
    let cleanPhone = telefono.replace(/\D/g, "");
    if (cleanPhone.length === 8 && (cleanPhone.startsWith("6") || cleanPhone.startsWith("7") || cleanPhone.startsWith("4"))) {
      cleanPhone = `591${cleanPhone}`;
    }
    const formattedFecha = format(parseISO(fecha), "dd 'de' MMMM", { locale: es });
    const mensaje = `Hola ${dueno}, te escribimos de *Animal Vet* 🐾 para recordarte que a *${mascota}* le toca su próxima dosis de la vacuna *${vacuna}* el día *${formattedFecha}*.\n\nEscríbenos por este medio para confirmar el horario de tu visita. ¡Cuidar de tu mascota es nuestra prioridad!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
  };

  // --- Lógica del Envío en Lotes ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredListado.filter(item => item.dueno?.telefono).map(item => item.id_vacuna_aplicada);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const selectedItems = filteredListado.filter(item => selectedIds.includes(item.id_vacuna_aplicada));

  const iniciarColaEnvio = () => {
    if (selectedItems.length === 0) return;
    setQueueIndex(0);
    setQueueActive(true);
  };

  const enviarSiguiente = () => {
    const item = selectedItems[queueIndex];
    if (!item || !item.dueno?.telefono) return;

    const link = getWhatsAppLink(
      item.dueno.telefono,
      item.mascota?.nombre ?? "su mascota",
      item.vacuna,
      item.fecha_proxima_dosis,
      item.dueno.nombres
    );

    // Abrir WhatsApp Web
    window.open(link, "_blank");

    if (queueIndex + 1 < selectedItems.length) {
      setQueueIndex(prev => prev + 1);
    } else {
      // Fin de la cola
      setQueueActive(false);
      setSelectedIds([]);
      toast.success("¡Lote de recordatorios enviado con éxito!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full font-bold">Recordatorios</Badge>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Agenda Preventiva Animal Vet
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Enviá recordatorios de vacunas y desparasitaciones pendientes de forma directa y sin costo.
            </p>
          </div>
          {selectedIds.length > 0 && (
            <Button onClick={iniciarColaEnvio} className="rounded-2xl font-bold bg-[#25D366] hover:bg-[#20ba56] text-white shadow-md shadow-emerald-500/20 animate-in zoom-in-95">
              <MessageSquare className="mr-2 h-5 w-5" /> Enviar en Lote ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mascota, dueño o vacuna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-2xl"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rango de vencimiento:</span>
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger className="w-[180px] rounded-2xl">
              <SelectValue placeholder="Seleccionar días" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="7">Próximos 7 días</SelectItem>
              <SelectItem value="15">Próximos 15 días</SelectItem>
              <SelectItem value="30">Próximos 30 días</SelectItem>
              <SelectItem value="60">Próximos 60 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CONTENIDO principal */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Buscando vacunas próximas a vencer...</p>
        </div>
      ) : filteredListado.length === 0 ? (
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-20" />
            <p className="text-sm">No se encontraron recordatorios pendientes para este rango de días.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 pl-6">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredListado.filter(i => i.dueno?.telefono).length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="font-bold">Mascota</TableHead>
                  <TableHead className="font-bold">Dueño / Contacto</TableHead>
                  <TableHead className="font-bold">Vacuna / Tratamiento</TableHead>
                  <TableHead className="font-bold">Fecha Programada</TableHead>
                  <TableHead className="font-bold text-center">Estado</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListado.map((item) => {
                  const duenoName = item.dueno ? `${item.dueno.nombres} ${item.dueno.apellidos}` : "Sin dueño";
                  const phone = item.dueno?.telefono;
                  const isOverdue = item.dias_restantes < 0;
                  const isSelected = selectedIds.includes(item.id_vacuna_aplicada);

                  return (
                    <TableRow key={item.id_vacuna_aplicada} className={`hover:bg-muted/30 ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''}`}>
                      <TableCell className="pl-6">
                        {phone ? (
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(item.id_vacuna_aplicada, e.target.checked)}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          <PawPrint className="h-4 w-4 text-primary" />
                          {item.mascota?.nombre ?? "Paciente"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {duenoName}
                          </div>
                          {phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-bold bg-primary/5 text-primary border-primary/10">
                          {item.vacuna}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(parseISO(item.fecha_proxima_dosis), "dd 'de' MMM, yyyy", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isOverdue ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 rounded-full font-semibold">
                            Vencido ({Math.abs(item.dias_restantes)}d)
                          </Badge>
                        ) : item.dias_restantes === 0 ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 rounded-full font-semibold">
                            Toca hoy
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 rounded-full font-semibold">
                            En {item.dias_restantes} días
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {phone ? (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl gap-1.5 font-bold shadow-sm shadow-emerald-500/10"
                          >
                            <a
                              href={getWhatsAppLink(phone, item.mascota?.nombre ?? "su mascota", item.vacuna, item.fecha_proxima_dosis, item.dueno?.nombres ?? "Cliente")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Recordatorio
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin teléfono</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* MODAL / WIDGET DE COLA DE ENVÍO ACTIVA */}
      {queueActive && selectedItems[queueIndex] && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border-2 border-primary/20 rounded-3xl p-5 shadow-2xl flex items-center gap-6 max-w-xl w-full z-50 animate-in slide-in-from-bottom-8">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Asistente de Envío por Lotes</p>
            <p className="text-sm font-semibold">
              Enviando recordatorio <strong className="text-primary font-black">{queueIndex + 1} de {selectedItems.length}</strong>
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Mascota: <strong>{selectedItems[queueIndex].mascota?.nombre}</strong> · Dueño: {selectedItems[queueIndex].dueno?.nombres}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => setQueueActive(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="rounded-xl bg-[#25D366] hover:bg-[#20ba56] text-white font-bold" onClick={enviarSiguiente}>
              {queueIndex + 1 === selectedItems.length ? "Finalizar y Enviar" : "Abrir y Siguiente"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
