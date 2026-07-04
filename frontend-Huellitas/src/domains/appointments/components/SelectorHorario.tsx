"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CalendarX, Clock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { citasService } from "@/domains/appointments/services/citas.service"; // Ajusta la ruta

interface SelectorHorarioProps {
  veterinarioId: string;
  fecha: string; // Formato YYYY-MM-DD
  horaSeleccionada: string | null;
  onSelectHora: (hora: string) => void;
}

export function SelectorHorario({ veterinarioId, fecha, horaSeleccionada, onSelectHora }: SelectorHorarioProps) {
  
  // React Query hace la magia de llamar al backend automáticamente cuando cambia el veterinario o la fecha
  const { data: slots, isLoading, isError } = useQuery({
    queryKey: ["disponibilidad", veterinarioId, fecha],
    queryFn: () => citasService.getDisponibilidad(veterinarioId, fecha),
    enabled: !!veterinarioId && !!fecha, // Solo busca si ya eligieron doctor y fecha
  });

  if (!veterinarioId || !fecha) {
    return <p className="text-sm text-muted-foreground text-center py-8">Selecciona un médico y una fecha primero.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-primary">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm font-medium">Buscando espacios disponibles...</p>
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-500 text-center py-8">Error al cargar la disponibilidad.</p>;
  }

  // Si el backend devuelve un arreglo vacío, significa que es feriado o el doc no trabaja ese día
  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-muted/10">
        <CalendarX className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">No hay atención este día.</p>
        <p className="text-xs">El médico seleccionado no tiene turnos programados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Horarios para el {fecha}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {slots.map((slot: { hora: string; ocupado: boolean }) => {
          const isSelected = horaSeleccionada === slot.hora;
          
          return (
            <Button
              key={slot.hora}
              disabled={slot.ocupado} // 👈 ¡ESTO BLOQUEA LOS HORARIOS LLENOS!
              onClick={() => onSelectHora(slot.hora)}
              variant={isSelected ? "default" : "outline"}
              className={`
                h-10 rounded-xl font-mono text-sm transition-all
                ${slot.ocupado 
                  ? "bg-red-500/5 text-red-500/50 border-red-500/10 cursor-not-allowed" // Estilo bloqueado (rojo tenue)
                  : isSelected
                    ? "bg-primary text-primary-foreground shadow-md scale-105" // Estilo seleccionado
                    : "hover:border-primary/50 hover:bg-primary/5" // Estilo libre (normal)
                }
              `}
            >
              {slot.hora}
            </Button>
          );
        })}
      </div>
      
      {/* Pequeña leyenda explicativa */}
      <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border bg-background"></div> Disponible</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/10"></div> Ocupado</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary"></div> Seleccionado</div>
      </div>
    </div>
  );
}