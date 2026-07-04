"use client";

import React, { useMemo } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { clinicalNotesSchema } from "@/lib/validations/clinical.schemas";

interface ClinicalNotesFormProps {
  motivo: string;
  sintomas: string;
  setSintomas: (v: string) => void;
  diagnostico: string;
  setDiagnostico: (v: string) => void;
  indicaciones: string;
  setIndicaciones: (v: string) => void;
  disabled?: boolean;
}

export function ClinicalNotesForm({
  motivo,
  sintomas,
  setSintomas,
  diagnostico,
  setDiagnostico,
  indicaciones,
  setIndicaciones,
  disabled = false,
}: ClinicalNotesFormProps) {
  const errors = useMemo(() => {
    const result = clinicalNotesSchema.safeParse({ sintomas, diagnostico, indicaciones: indicaciones || undefined });
    if (result.success) return {} as Record<string, string>;
    const errs: Record<string, string> = {};
    result.error.issues.forEach((e: any) => {
      const key = e.path[0] as string;
      if (!errs[key]) errs[key] = e.message;
    });
    return errs;
  }, [sintomas, diagnostico, indicaciones]);

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" /> 2. Notas de la Consulta
        </CardTitle>
        <CardDescription>Síntomas presentados, examen físico y diagnóstico.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="motivo" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Motivo de Ingreso (Referencia)</Label>
          <div className="p-3 bg-muted/40 rounded-xl border text-sm text-foreground">
            {motivo}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sintomas">Síntomas Clínicos / Anamnesis *</Label>
          <Textarea
            id="sintomas"
            placeholder="Describe los síntomas observados y relatados por el dueño..."
            value={sintomas}
            onChange={(e) => setSintomas(e.target.value)}
            disabled={disabled}
            className={`rounded-xl min-h-[100px] resize-none ${errors.sintomas ? "border-destructive" : ""}`}
          />
          {errors.sintomas && <p className="text-xs text-destructive">{errors.sintomas}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnostico">Diagnóstico Clínico *</Label>
          <Input
            id="diagnostico"
            placeholder="Ej. Gastroenteritis infecciosa por parvovirus / Otitis bilateral"
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            disabled={disabled}
            className={`rounded-xl h-11 ${errors.diagnostico ? "border-destructive" : ""}`}
          />
          {errors.diagnostico && <p className="text-xs text-destructive">{errors.diagnostico}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="indicaciones">Indicaciones Generales / Recomendaciones de Cuidado</Label>
          <Textarea
            id="indicaciones"
            placeholder="Reposo absoluto, hidratación oral frecuente, reevaluación en 48 horas..."
            value={indicaciones}
            onChange={(e) => setIndicaciones(e.target.value)}
            disabled={disabled}
            className="rounded-xl min-h-[80px] resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
