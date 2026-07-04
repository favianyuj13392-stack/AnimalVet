"use client";

import { useRef, useState } from "react";
import { cloudinaryService } from "@/shared/lib/claudinary.service";
import { Button } from "./button";
import { ImageIcon, Loader2, X } from "lucide-react";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export function ImageUploader({
  value,
  onChange,
  label = "Imagen",
  placeholder = "Subir imagen",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await cloudinaryService.uploadFile(file);
      onChange(url);
    } catch {
      // cloudinaryService ya loguea el error
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium leading-none">{label}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border/50 bg-muted/10 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg text-xs h-8"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
              )}
              Cambiar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
              className="rounded-lg text-xs h-8"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 rounded-xl border-2 border-dashed border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Subiendo...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">{placeholder}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
