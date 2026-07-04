"use client";

import React, { useMemo } from "react";
import { HeartPulse, Activity, Thermometer, Scale, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { triageSchema } from "@/lib/validations/clinical.schemas";

interface HistorialSigno {
  fecha: string;
  peso_kg: number;
  temperatura_c: number;
  frecuencia_cardiaca: number;
  frecuencia_respiratoria: number;
}

interface TriageFormProps {
  peso: string;
  setPeso: (v: string) => void;
  temperatura: string;
  setTemperatura: (v: string) => void;
  fc: string;
  setFc: (v: string) => void;
  fr: string;
  setFr: (v: string) => void;
  pesoPrevio: string;
  historialSignos?: HistorialSigno[];
  disabled?: boolean;
}

function TendenciaIcon({ actual, previo }: { actual: number; previo: number }) {
  const diff = actual - previo;
  if (Math.abs(diff) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (diff > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
  return <TrendingDown className="h-3 w-3 text-destructive" />;
}

export function TriageForm({
  peso,
  setPeso,
  temperatura,
  setTemperatura,
  fc,
  setFc,
  fr,
  setFr,
  pesoPrevio,
  historialSignos = [],
  disabled = false,
}: TriageFormProps) {
  const ultimoRegistro = historialSignos[0];

  // Validación en tiempo real
  const errors = useMemo(() => {
    const result = triageSchema.safeParse({ peso, temperatura: temperatura || undefined, fc: fc || undefined, fr: fr || undefined });
    if (result.success) return {} as Record<string, string>;
    const errs: Record<string, string> = {};
    result.error.issues.forEach((e: any) => {
      const key = e.path[0] as string;
      if (!errs[key]) errs[key] = e.message;
    });
    return errs;
  }, [peso, temperatura, fc, fr]);

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <HeartPulse className="h-5 w-5 text-primary" /> 1. Constantes Vitales y Triaje
        </CardTitle>
        <CardDescription>Valores biológicos medidos en consulta.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">

        {/* CAMPOS ACTUALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peso" className="flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-muted-foreground" /> Peso Actual (Kg) *
            </Label>
            <Input
              id="peso"
              type="number"
              step="0.01"
              placeholder={`Prev: ${pesoPrevio}`}
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              disabled={disabled}
              className={`rounded-xl h-11 ${errors.peso ? "border-destructive" : ""}`}
            />
            {errors.peso && <p className="text-xs text-destructive">{errors.peso}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp" className="flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-muted-foreground" /> Temp (°C)
            </Label>
            <Input
              id="temp"
              type="number"
              step="0.1"
              placeholder="Ej. 38.5"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              disabled={disabled}
              className={`rounded-xl h-11 ${errors.temperatura ? "border-destructive" : ""}`}
            />
            {errors.temperatura && <p className="text-xs text-destructive">{errors.temperatura}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-muted-foreground" /> F. Cardíaca (bpm)
            </Label>
            <Input
              id="fc"
              type="number"
              placeholder="Ej. 110"
              value={fc}
              onChange={(e) => setFc(e.target.value)}
              disabled={disabled}
              className={`rounded-xl h-11 ${errors.fc ? "border-destructive" : ""}`}
            />
            {errors.fc && <p className="text-xs text-destructive">{errors.fc}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fr" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-muted-foreground" /> F. Resp (rpm)
            </Label>
            <Input
              id="fr"
              type="number"
              placeholder="Ej. 24"
              value={fr}
              onChange={(e) => setFr(e.target.value)}
              disabled={disabled}
              className={`rounded-xl h-11 ${errors.fr ? "border-destructive" : ""}`}
            />
            {errors.fr && <p className="text-xs text-destructive">{errors.fr}</p>}
          </div>
        </div>

        {/* HISTORIAL DE SIGNOS VITALES */}
        {historialSignos.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Historial de consultas anteriores
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground">Fecha</th>
                    <th className="text-center py-1.5 px-3 font-semibold text-muted-foreground">Peso (kg)</th>
                    <th className="text-center py-1.5 px-3 font-semibold text-muted-foreground">Temp (°C)</th>
                    <th className="text-center py-1.5 px-3 font-semibold text-muted-foreground">FC (bpm)</th>
                    <th className="text-center py-1.5 px-3 font-semibold text-muted-foreground">FR (rpm)</th>
                  </tr>
                </thead>
                <tbody>
                  {historialSignos.slice(0, 5).map((h, idx) => {
                    const prev = historialSignos[idx + 1];
                    return (
                      <tr key={idx} className={`border-b border-border/20 ${idx === 0 ? "bg-primary/5" : ""}`}>
                        <td className="py-2 pr-4 text-muted-foreground font-mono">
                          {new Date(h.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                          {idx === 0 && <Badge className="ml-2 text-[9px] bg-primary/10 text-primary border-primary/20 py-0">Última</Badge>}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold">
                          <span className="flex items-center justify-center gap-1">
                            {h.peso_kg}
                            {prev && <TendenciaIcon actual={h.peso_kg} previo={prev.peso_kg} />}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={h.temperatura_c > 39.5 ? "text-destructive font-bold" : h.temperatura_c < 37.5 ? "text-blue-500" : ""}>
                            {h.temperatura_c}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{h.frecuencia_cardiaca}</td>
                        <td className="py-2 px-3 text-center font-mono">{h.frecuencia_respiratoria}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {historialSignos.length > 5 && (
              <p className="text-[10px] text-muted-foreground text-right">
                Mostrando las últimas 5 de {historialSignos.length} consultas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
