"use client";

import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { 
  Calendar, 
  Stethoscope, 
  Syringe, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Clock,
  Printer,
  History
} from "lucide-react";

interface OwnerHistoryTimelineProps {
  historialFiltrado: any[];
  recetasAbiertas: Record<string, boolean>;
  onToggleReceta: (id: string) => void;
}

export function OwnerHistoryTimeline({
  historialFiltrado,
  recetasAbiertas,
  onToggleReceta,
}: OwnerHistoryTimelineProps) {
  
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "Consulta":
        return <Stethoscope className="h-5 w-5 text-primary" />;
      case "Vacunación":
        return <Syringe className="h-5 w-5 text-sky-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-amber-500" />;
    }
  };

  if (historialFiltrado.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 border border-dashed border-border rounded-3xl">
        <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-foreground">Sin registros coincidentes</h3>
        <p className="text-sm text-muted-foreground mt-1">Intenta ajustando los filtros o realizando otra búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {historialFiltrado.map((item) => {
        const isOpen = recetasAbiertas[item.id] || false;
        return (
          <Card key={item.id} className="rounded-3xl border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Cabecera Tarjeta */}
            <div className="p-6 border-b border-border/30 bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-background border border-border/50 shadow-sm shrink-0">
                  {getIcon(item.tipo)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-foreground">{item.servicio}</span>
                    <Badge className="bg-primary/20 text-primary border-0 rounded-full font-bold text-[10px] px-2.5 py-0.5">
                      {item.mascota}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">ID Registro: {item.id} • Atendido por: {item.veterinario}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {item.fecha_agendada && (
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Agendada: {new Date(item.fecha_agendada).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-xl border border-border/40">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Atendida: {item.fecha}
                </div>
              </div>
            </div>

            {/* Contenido Tarjeta (Diagnóstico) */}
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Diagnóstico Médico</span>
                <p className="text-sm text-foreground leading-relaxed font-medium bg-muted/10 p-3 rounded-2xl border border-border/30">
                  {item.diagnostico}
                </p>
              </div>

              {/* Receta Adjunta (si existe) */}
              {item.receta ? (
                <div className="border border-border/50 rounded-2xl overflow-hidden bg-background">
                  <button
                    onClick={() => onToggleReceta(item.id)}
                    className="w-full p-4 flex justify-between items-center bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                  >
                    <span className="text-xs font-extrabold flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" /> Receta Médica Adjunta ({item.receta.id})
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 border-t border-border/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                        {item.receta.detalles.map((det: any, dIdx: number) => (
                          <div key={dIdx} className="p-3.5 rounded-xl bg-muted/40 border border-border/20 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <p className="font-extrabold text-foreground text-sm">{det.medicamento}</p>
                              <p className="text-muted-foreground mt-0.5">Dosis: {det.dosis}</p>
                            </div>
                            <div className="sm:text-right shrink-0">
                              <p className="text-foreground font-semibold flex items-center gap-1 sm:justify-end">
                                <Clock className="h-3 w-3 text-primary" /> {det.frecuencia}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase">Uso por: {det.duracion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => window.print()}>
                          <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir Indicaciones
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/80 bg-muted/20 p-4 rounded-2xl border border-dashed border-border/40 text-center">
                  No se emitieron medicamentos en esta atención.
                </div>
              )}
            </CardContent>

          </Card>
        );
      })}
    </div>
  );
}
