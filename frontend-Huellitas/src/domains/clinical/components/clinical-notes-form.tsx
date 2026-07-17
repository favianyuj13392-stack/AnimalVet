"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileText, ClipboardList, X, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
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

  // Nuevos Campos de Ficha Clínica
  turno: string;
  setTurno: (v: string) => void;
  mucosas: string;
  setMucosas: (v: string) => void;
  anamnesis: string;
  setAnamnesis: (v: string) => void;

  // Diagnósticos Estructurados
  presuntivas: any[];
  setPresuntivas: (v: any[]) => void;
  definitivas: any[];
  setDefinitivas: (v: any[]) => void;
  dbPatologiasMaster: any[];

  // Exámenes Complementarios
  examEcografia: boolean;
  setExamEcografia: (v: boolean) => void;
  examRayosX: boolean;
  setExamRayosX: (v: boolean) => void;
  examHemograma: boolean;
  setExamHemograma: (v: boolean) => void;
  examQuimicaSanguinea: boolean;
  setExamQuimicaSanguinea: (v: boolean) => void;
  examOtros: boolean;
  setExamOtros: (v: boolean) => void;
  examResultados: string;
  setExamResultados: (v: string) => void;
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

  turno,
  setTurno,
  mucosas,
  setMucosas,
  anamnesis,
  setAnamnesis,

  presuntivas,
  setPresuntivas,
  definitivas,
  setDefinitivas,
  dbPatologiasMaster = [],

  examEcografia,
  setExamEcografia,
  examRayosX,
  setExamRayosX,
  examHemograma,
  setExamHemograma,
  examQuimicaSanguinea,
  setExamQuimicaSanguinea,
  examOtros,
  setExamOtros,
  examResultados,
  setExamResultados,
}: ClinicalNotesFormProps) {
  const [selPresuntiva, setSelPresuntiva] = useState("");
  const [selDefinitiva, setSelDefinitiva] = useState("");

  // Sincronizar legacy diagnostico con las definitivas seleccionadas
  useEffect(() => {
    const list = definitivas.map(d => d.nombre).join(", ");
    setDiagnostico(list || "");
  }, [definitivas, setDiagnostico]);

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
          <FileText className="h-5 w-5 text-primary" /> 2. Ficha Clínica de la Consulta
        </CardTitle>
        <CardDescription>Completá el historial clínico de atención general para esta consulta.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* FILA 1: Turno, Mucosas y Motivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="turno">Turno *</Label>
            <Select value={turno} onValueChange={setTurno} disabled={disabled}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Seleccionar turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mañana">Mañana</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="Noche">Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mucosas">Mucosas</Label>
            <Input
              id="mucosas"
              placeholder="Ej. Rosadas, pálidas, congestivas"
              value={mucosas}
              onChange={(e) => setMucosas(e.target.value)}
              disabled={disabled}
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Motivo de Consulta (Cita)</Label>
            <div className="p-3 bg-muted/40 rounded-xl border text-sm text-foreground truncate h-11 flex items-center">
              {motivo}
            </div>
          </div>
        </div>

        <Separator />

        {/* Anamnesis y Síntomas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="anamnesis">Anamnesis (Historial del Paciente)</Label>
            <Textarea
              id="anamnesis"
              placeholder="Notas sobre el historial del paciente, alimentación, vacunas previas, etc..."
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
              disabled={disabled}
              className="rounded-xl min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sintomas">Síntomas Clínicos *</Label>
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
        </div>

        <Separator />

        {/* Diagnósticos Estructurados (Patologías Catálogo) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diagnóstico Presuntivo */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Diagnósticos Presuntivos</Label>
            <div className="flex gap-2">
              <Select value={selPresuntiva} onValueChange={setSelPresuntiva} disabled={disabled}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Buscar patología presuntiva..." />
                </SelectTrigger>
                <SelectContent>
                  {dbPatologiasMaster
                    .filter(p => !presuntivas.some(x => x.id === p.id))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.codigoCie ? `[${p.codigoCie}]` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => {
                  const found = dbPatologiasMaster.find(p => p.id === selPresuntiva);
                  if (found) {
                    setPresuntivas([...presuntivas, found]);
                    setSelPresuntiva("");
                  }
                }}
                disabled={!selPresuntiva || disabled}
                className="rounded-xl h-11"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border border-dashed rounded-xl bg-muted/20">
              {presuntivas.length === 0 ? (
                <span className="text-xs text-muted-foreground self-center">Ninguno seleccionado</span>
              ) : (
                presuntivas.map(p => (
                  <Badge key={p.id} variant="secondary" className="px-3 py-1 rounded-full flex items-center gap-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                    {p.nombre}
                    <button
                      type="button"
                      onClick={() => setPresuntivas(presuntivas.filter(x => x.id !== p.id))}
                      disabled={disabled}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Diagnóstico Definitivo */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Diagnósticos Definitivos *</Label>
            <div className="flex gap-2">
              <Select value={selDefinitiva} onValueChange={setSelDefinitiva} disabled={disabled}>
                <SelectTrigger className={`h-11 rounded-xl ${errors.diagnostico ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Buscar patología definitiva..." />
                </SelectTrigger>
                <SelectContent>
                  {dbPatologiasMaster
                    .filter(p => !definitivas.some(x => x.id === p.id))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.codigoCie ? `[${p.codigoCie}]` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => {
                  const found = dbPatologiasMaster.find(p => p.id === selDefinitiva);
                  if (found) {
                    setDefinitivas([...definitivas, found]);
                    setSelDefinitiva("");
                  }
                }}
                disabled={!selDefinitiva || disabled}
                className="rounded-xl h-11"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.diagnostico && <p className="text-xs text-destructive">{errors.diagnostico}</p>}

            <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border border-dashed rounded-xl bg-muted/20">
              {definitivas.length === 0 ? (
                <span className="text-xs text-muted-foreground self-center">Ninguno seleccionado (Obligatorio)</span>
              ) : (
                definitivas.map(d => (
                  <Badge key={d.id} variant="secondary" className="px-3 py-1 rounded-full flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    {d.nombre}
                    <button
                      type="button"
                      onClick={() => setDefinitivas(definitivas.filter(x => x.id !== d.id))}
                      disabled={disabled}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Exámenes Complementarios */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Exámenes Complementarios
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">Marcá las casillas de los exámenes solicitados o realizados.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 bg-muted/20 border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={examEcografia}
                onChange={(e) => setExamEcografia(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <span className="text-sm font-semibold">Ecografía</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-muted/20 border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={examRayosX}
                onChange={(e) => setExamRayosX(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <span className="text-sm font-semibold">Rayos X</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-muted/20 border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={examHemograma}
                onChange={(e) => setExamHemograma(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <span className="text-sm font-semibold">Hemograma</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-muted/20 border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={examQuimicaSanguinea}
                onChange={(e) => setExamQuimicaSanguinea(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <span className="text-sm font-semibold">Química Sanguínea</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-muted/20 border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={examOtros}
                onChange={(e) => setExamOtros(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <span className="text-sm font-semibold">Otros</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examResultados">Resultados de Exámenes</Label>
            <Textarea
              id="examResultados"
              placeholder="Anotá los hallazgos y resultados de los exámenes complementarios..."
              value={examResultados}
              onChange={(e) => setExamResultados(e.target.value)}
              disabled={disabled}
              className="rounded-xl min-h-[80px] resize-none"
            />
          </div>
        </div>

        <Separator />

        {/* Recomendaciones / Notas del Tratamiento */}
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
