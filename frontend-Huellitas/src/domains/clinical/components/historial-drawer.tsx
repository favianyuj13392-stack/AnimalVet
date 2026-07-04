"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  X, ClipboardList, Scale, Thermometer, Activity,
  HeartPulse, Stethoscope, FileText, Syringe, Loader2,
  Paperclip, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { historialClinicoService } from "@/domains/clinical/services/historial-clinico.service";
import { FileViewer } from "@/shared/components/ui/file-viewer";

interface HistorialDrawerProps {
  mascotaId: string;
  mascotaNombre: string;
  onClose: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  Abierto:   "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Cerrado:   "bg-green-500/10 text-green-500 border-green-500/20",
  Facturado: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

function VitalCard({ icon: Icon, label, value, alert }: any) {
  return (
    <div className="flex flex-col items-center py-3 border-r border-border/20 last:border-r-0">
      <Icon className={`h-4 w-4 mb-1 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
      <p className={`text-sm font-bold font-mono ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function ConsultaCard({ h, idx, total }: { h: any; idx: number; total: number }) {
  const [expanded, setExpanded] = useState(idx === 0);
  const [previewing, setPreviewing] = useState<any>(null);

  const vacunas = h.vacunas_aplicadas ?? [];
  const recetas = h.recetas ?? [];
  const archivos = h.archivosAdjuntos ?? [];

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
      {/* Header clickeable */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors border-b border-border/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-muted-foreground font-mono">
            #{total - idx}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {new Date(h.fecha_consulta).toLocaleDateString("es-BO", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {h.tipo_atencion ?? "Consulta"}
          </Badge>
          <Badge className={`text-[10px] px-1.5 py-0 border ${ESTADO_COLOR[h.estado] ?? ""}`}>
            {h.estado}
          </Badge>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          {/* Signos vitales */}
          <div className="grid grid-cols-4 border-b border-border/20 bg-muted/5">
            <VitalCard icon={Scale}       label="Peso"  value={h.peso_actual_kg ? `${h.peso_actual_kg}kg` : "—"} />
            <VitalCard icon={Thermometer} label="Temp"  value={h.temperatura_c ? `${h.temperatura_c}°C` : "—"} alert={h.temperatura_c > 39.5} />
            <VitalCard icon={HeartPulse}  label="FC"    value={h.frecuencia_cardiaca ?? "—"} />
            <VitalCard icon={Activity}    label="FR"    value={h.frecuencia_respiratoria ?? "—"} />
          </div>

          {/* Contenido clínico */}
          <div className="px-4 py-4 space-y-4">
            {h.motivo_consulta && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Motivo</p>
                <p className="text-sm text-foreground leading-relaxed">{h.motivo_consulta}</p>
              </div>
            )}

            {h.sintomas && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Síntomas</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{h.sintomas}</p>
              </div>
            )}

            {h.diagnostico && (
              <div className="flex items-start gap-2">
                <Stethoscope className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Diagnóstico</p>
                  <p className="text-sm font-semibold text-foreground">{h.diagnostico}</p>
                </div>
              </div>
            )}

            {h.notas_internas && (
              <div className="bg-primary/5 rounded-xl px-3 py-3 border border-primary/10">
                <p className="text-[10px] font-bold uppercase text-primary mb-1">Notas internas</p>
                <p className="text-sm text-foreground/80 italic leading-relaxed">{h.notas_internas}</p>
              </div>
            )}

            {/* Vacunas aplicadas */}
            {vacunas.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Syringe className="h-3 w-3 text-primary" /> Vacunas aplicadas
                </p>
                <div className="space-y-1.5">
                  {vacunas.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold">{v.vacuna?.nombre ?? "Vacuna"}</span>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-muted-foreground">{v.lote_vacuna}</p>
                        {v.fecha_proxima_dosis && (
                          <p className="text-[10px] text-amber-500">
                            Próx: {new Date(v.fecha_proxima_dosis).toLocaleDateString("es-BO")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recetas */}
            {recetas.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-primary" /> Medicamentos recetados
                </p>
                <div className="space-y-1.5">
                  {recetas.map((r: any) =>
                    (r.detalles ?? []).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                        <span className="text-xs font-semibold truncate flex-1">
                          {d.medicamento_texto || (d.producto?.nombre ?? "Medicamento")}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {d.dosis} · {d.frecuencia} · {d.duracion_dias}d
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Archivos adjuntos */}
            {archivos.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Paperclip className="h-3 w-3 text-primary" /> Archivos adjuntos
                </p>
                <div className="space-y-1.5">
                  {archivos.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => setPreviewing(a)}
                      className="w-full flex items-center justify-between bg-muted/20 hover:bg-muted/40 rounded-lg px-3 py-2 transition-colors group"
                    >
                      <span className="text-xs font-semibold truncate flex-1 text-left">
                        {a.nombreArchivo ?? a.nombre_archivo}
                      </span>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vet */}
            {h.veterinario && (
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                Atendido por Dr(a). {h.veterinario.nombres} {h.veterinario.apellidos}
              </p>
            )}
          </div>
        </>
      )}

      {/* Visor de archivo */}
      {previewing && (
        <FileViewer
          url={previewing.urlArchivo ?? previewing.url_archivo}
          nombre={previewing.nombreArchivo ?? previewing.nombre_archivo}
          tipo={previewing.tipoArchivo ?? previewing.tipo_archivo ?? "application/pdf"}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}

export function HistorialDrawer({ mascotaId, mascotaNombre, onClose }: HistorialDrawerProps) {
  const { data: historiales = [], isLoading } = useQuery({
    queryKey: ["historial-drawer", mascotaId],
    queryFn: () => historialClinicoService.getByMascota(mascotaId),
    enabled: !!mascotaId,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const drawer = (
    <>
      <div className="fixed inset-0 z-[998] bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full z-[999] w-full max-w-lg flex flex-col bg-background border-l border-border/50 shadow-2xl animate-in slide-in-from-right duration-300">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold">Historial de {mascotaNombre}</p>
              <p className="text-xs text-muted-foreground">
                {historiales.length} consulta{historiales.length !== 1 ? "s" : ""} registrada{historiales.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm">Cargando historial...</p>
            </div>
          ) : historiales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <ClipboardList className="h-12 w-12 opacity-20" />
              <p className="text-sm font-semibold">Sin consultas anteriores</p>
              <p className="text-xs">Esta es la primera vez que atienden a {mascotaNombre}</p>
            </div>
          ) : (
            historiales.map((h: any, idx: number) => (
              <ConsultaCard key={h.id} h={h} idx={idx} total={historiales.length} />
            ))
          )}
        </div>
      </div>
    </>
  );

  return createPortal(drawer, document.body);
}
