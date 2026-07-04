"use client";

import Link from "next/link";
import { ArrowLeft, Stethoscope, Clock, CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { servicesService, Servicio } from "@/domains/billing/services/services.service";

export default function ServiciosClinicaPage() {
  const { data: servicios = [], isLoading } = useQuery<Servicio[]>({
    queryKey: ["servicios"],
    queryFn: () => servicesService.getAll(),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">

      {/* Header */}
      <div>
        <Link href="/cliente/inicio">
          <Button variant="ghost" size="sm"
            className="-ml-2 mb-3 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Inicio
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuestros servicios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Conoce los servicios veterinarios que ofrecemos para el cuidado de tu mascota.
        </p>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Cargando servicios...</p>
        </div>
      ) : servicios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed rounded-2xl text-center px-8">
          <Stethoscope className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">Sin servicios disponibles</p>
          <p className="text-xs text-muted-foreground">Pronto publicaremos nuestro catalogo de servicios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {servicios.map((s) => (
            <div key={s.id}
              className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all">

              {/* Imagen de cabecera si existe */}
              {(s as any).imagen_url && (
                <div className="w-full h-36 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(s as any).imagen_url} alt={s.nombre} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-5 flex flex-col gap-4 flex-1">
              {/* Ícono + nombre */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{s.nombre}</h3>
                  {s.descripcion && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.descripcion}</p>
                  )}
                </div>
              </div>

              {/* Detalles */}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs gap-1.5 border-border/60">
                  <Clock className="h-3 w-3" /> {Number(s.duracion_minutos)} min
                </Badge>
                {s.requiereVeterinario && (
                  <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">
                    Con veterinario
                  </Badge>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Precio</p>
                  <p className="text-xl font-bold text-primary leading-none mt-0.5">
                    {Number(s.precio)} <span className="text-sm font-medium text-muted-foreground">Bs</span>
                  </p>
                </div>
                <Link href="/cliente/agendar">
                  <Button size="sm" className="rounded-lg h-8 text-xs gap-1.5">
                    <CalendarPlus className="h-3.5 w-3.5" /> Agendar
                  </Button>
                </Link>
              </div>
              </div>{/* fin p-5 */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
