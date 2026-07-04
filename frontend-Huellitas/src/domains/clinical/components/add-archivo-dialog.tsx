"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { Paperclip, UploadCloud, Loader2 } from "lucide-react";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface AddArchivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    file: File;
    tipo_estudio: "Radiografia" | "Laboratorio" | "Ecografia" | "Electrocardiograma" | "Otro";
    observaciones: string
  }) => Promise<void>;
  pacienteNombre: string;
}

type TipoEstudio = "Radiografia" | "Laboratorio" | "Ecografia" | "Electrocardiograma" | "Otro";
type FormErrors = { file?: string; tipo_estudio?: string };

export function AddArchivoDialog({ open, onOpenChange, onSubmit, pacienteNombre }: AddArchivoDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tipoEstudio, setTipoEstudio] = useState<TipoEstudio>("Radiografia");
  const [observaciones, setObservaciones] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { openConfirm, dialog } = useConfirmDialog();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      if (selected.size > MAX_FILE_SIZE) {
        setErrors((p) => ({ ...p, file: "El archivo no puede superar los 5 MB" }));
        setFile(null);
        e.target.value = "";
        return;
      }
      setErrors((p) => ({ ...p, file: undefined }));
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!file) errs.file = "Selecciona un archivo";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    openConfirm({
      title: "Subir archivo",
      description: `¿Confirmar la subida de este estudio para ${pacienteNombre}?`,
      variant: "default",
      confirmLabel: "Sí, subir",
      onConfirm: async () => {
        await onSubmit({ file: file!, tipo_estudio: tipoEstudio, observaciones });
        setFile(null); setTipoEstudio("Radiografia"); setObservaciones("");
      },
    });
  };

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/50 bg-background/95 backdrop-blur-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Paperclip className="h-5 w-5 text-primary" /> Adjuntar Estudio
            </DialogTitle>
            <DialogDescription>
              Sube resultados de laboratorio o imágenes para <strong>{pacienteNombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Seleccionar Archivo</label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className={`rounded-xl cursor-pointer file:text-primary file:font-bold file:bg-primary/10 file:border-0 file:rounded-lg file:mr-4 file:px-4 file:py-1 hover:file:bg-primary/20 ${errors.file ? "border-destructive" : ""}`}
              />
              {errors.file
                ? <p className="text-xs text-destructive">{errors.file}</p>
                : <p className="text-[11px] text-muted-foreground">JPG, PNG o PDF · Máximo 5 MB</p>
              }
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Estudio</label>
              <Select
                value={tipoEstudio}
                onValueChange={(val) => setTipoEstudio(val as TipoEstudio)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona la categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Radiografia">Radiografía</SelectItem>
                  <SelectItem value="Ecografia">Ecografía</SelectItem>
                  <SelectItem value="Laboratorio">Análisis de Laboratorio</SelectItem>
                  <SelectItem value="Electrocardiograma">Electrocardiograma</SelectItem>
                  <SelectItem value="Otro">Otro Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Interpretación / Notas</label>
              <Textarea
                placeholder="Ej. Se observa fisura en fémur derecho..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold">
              Cancelar
            </Button>
            <Button type="submit" disabled={!file} className="rounded-xl font-bold bg-primary shadow-md">
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir Archivo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {dialog}
  </>
  );
}
