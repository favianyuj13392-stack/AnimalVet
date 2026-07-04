"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { Button } from "./button";

interface FileViewerProps {
  url: string;
  nombre: string;
  tipo: string;
  onClose: () => void;
}

export function FileViewer({ url, nombre, tipo, onClose }: FileViewerProps) {
  const esPdf   = tipo === "application/pdf" || nombre.toLowerCase().endsWith(".pdf");
  const esImagen = tipo.startsWith("image/");

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    // Bloquear scroll del body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const icon = esImagen
    ? <ImageIcon className="h-4 w-4 text-indigo-500" />
    : esPdf
    ? <FileText className="h-4 w-4 text-rose-500" />
    : <Paperclip className="h-4 w-4 text-primary" />;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <p className="text-sm font-bold truncate max-w-[500px]">{nombre}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Abrir en nueva pestaña ↗
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-auto bg-muted/20">
          {esPdf ? (
            <iframe
              src={url}
              className="w-full h-[82vh]"
              title={nombre}
            />
          ) : esImagen ? (
            <div className="flex items-center justify-center p-6 min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={nombre}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-md"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
              <Paperclip className="h-12 w-12 opacity-20" />
              <p className="text-sm">Vista previa no disponible para este tipo de archivo</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-semibold"
              >
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Renderiza en el body via Portal
  return createPortal(modal, document.body);
}
