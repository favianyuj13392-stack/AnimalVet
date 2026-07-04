"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { cloudinaryService } from "@/shared/lib/claudinary.service";
import { FileViewer } from "@/shared/components/ui/file-viewer";

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
  status: "uploading" | "success" | "error";
  url?: string;
}

interface FileDropzoneProps {
  label?: string;
  description?: string;
  onFilesChanged?: (files: AttachedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileDropzone({ 
  label = "Archivos Adjuntos e Historial Clínico", 
  description = "Formatos soportados: PDF, JPG, PNG, DICOM (Placas RX). Máximo 10MB por archivo.",
  onFilesChanged,
  maxFiles = 5,
  disabled = false
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [previewing, setPreviewing] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadToCloudinary = async (file: File, fileId: string) => {
    try {
      const url = await cloudinaryService.uploadFile(file);
      setFiles(prev => {
        const updated = prev.map(f =>
          f.id === fileId
            ? { ...f, progress: 100, status: "success" as const, url }
            : f
        );
        if (onFilesChanged) onFilesChanged(updated);
        return updated;
      });
      toast.success(`Archivo subido: ${file.name}`);
    } catch (err) {
      setFiles(prev => {
        const updated = prev.map(f =>
          f.id === fileId
            ? { ...f, status: "error" as const }
            : f
        );
        if (onFilesChanged) onFilesChanged(updated);
        return updated;
      });
      toast.error(`Error al subir ${file.name}`);
    }
  };

  const processFiles = (fileList: FileList) => {
    if (disabled) return;
    if (files.length + fileList.length > maxFiles) {
      toast.error(`Límite excedido`, {
        description: `Solo puedes subir un máximo de ${maxFiles} archivos por consulta.`,
      });
      return;
    }

    const newFiles: AttachedFile[] = [];
    const filesToUpload: { file: File; id: string }[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Archivo muy grande`, {
          description: `${file.name} supera los 10MB permitidos.`,
        });
        continue;
      }

      const fileId = `file-${Date.now()}-${i}`;
      newFiles.push({
        id: fileId,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        progress: 0,
        status: "uploading",
      });
      filesToUpload.push({ file, id: fileId });
    }

    if (newFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...newFiles];
        if (onFilesChanged) onFilesChanged(updated);
        return updated;
      });
      // Subir cada archivo a Cloudinary
      filesToUpload.forEach(({ file, id }) => uploadToCloudinary(file, id));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDelete = (id: string) => {
    if (disabled) return;
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (onFilesChanged) onFilesChanged(updated);
      return updated;
    });
    toast.info("Archivo adjunto eliminado");
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-indigo-500 shrink-0" />;
    }
    if (type === "application/pdf") {
      return <FileText className="h-5 w-5 text-rose-500 shrink-0" />;
    }
    return <Paperclip className="h-5 w-5 text-primary shrink-0" />;
  };

  return (
    <div className="space-y-4">
      {label && <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">{label}</label>}
      
      {/* DROPZONE AREA */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`border-2 border-dashed rounded-3xl p-6 transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] text-center relative ${
          disabled 
            ? "opacity-50 cursor-not-allowed border-border/40 bg-card/10" 
            : "cursor-pointer border-border/60 hover:border-primary/40 hover:bg-muted/10 bg-card/40"
        } ${
          dragActive && !disabled
            ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
            : ""
        } backdrop-blur-sm`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          disabled={disabled}
          className="hidden" 
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png,.dcm"
        />

        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="text-sm font-extrabold text-foreground">
          {disabled ? "Subida desactivada" : <>Arrastra tus archivos aquí o <span className="text-primary hover:underline">explorar</span></>}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px]">
          {disabled ? "Solo vista operativa" : description}
        </p>

        {dragActive && !disabled && (
          <div className="absolute inset-0 bg-primary/5 rounded-3xl flex items-center justify-center pointer-events-none">
            <span className="text-sm font-black text-primary uppercase tracking-widest animate-pulse">¡Suelta los archivos!</span>
          </div>
        )}
      </div>

      {/* FILE LIST */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/40 transition-colors animate-in slide-in-from-bottom-2 duration-200"
            >
              {getFileIcon(file.type)}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
                  <span className="text-[9px] text-muted-foreground font-mono shrink-0">{file.size}</span>
                </div>

                {file.status === "uploading" && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-primary font-bold flex items-center gap-1 font-mono shrink-0">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Subiendo...
                    </span>
                  </div>
                )}

                {file.status === "success" && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-green-500 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3 w-3 shrink-0" /> Subido a Cloudinary
                  </div>
                )}

                {file.status === "error" && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-destructive font-bold uppercase tracking-wider">
                    <AlertCircle className="h-3 w-3 shrink-0" /> Error al subir
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Botón ver — solo si ya tiene URL */}
                {file.status === "success" && file.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-primary hover:bg-primary/10"
                    onClick={(e) => { e.stopPropagation(); setPreviewing(file); }}
                    title="Ver archivo"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISOR GLOBAL — renderiza via Portal en document.body */}
      {previewing && previewing.url && (
        <FileViewer
          url={previewing.url}
          nombre={previewing.name}
          tipo={previewing.type}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
