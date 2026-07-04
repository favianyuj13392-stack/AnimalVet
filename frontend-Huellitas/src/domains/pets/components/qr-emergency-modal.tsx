"use client";

import React from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ShieldAlert, Printer } from "lucide-react";

interface Mascota {
  nombre: string;
  hash_qr_identidad?: string;
}

interface QrEmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mascota: Mascota;
  urlEmergenciaPublica: string;
}

export function QrEmergencyModal({
  open,
  onOpenChange,
  mascota,
  urlEmergenciaPublica,
}: QrEmergencyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden flex flex-col" style={{ maxHeight: "90vh", width: "460px", maxWidth: "calc(100vw - 2rem)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center justify-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emergency" /> Placa QR de Emergencia
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cualquier persona puede escanear este QR para ver datos médicos
              clave y llamarte sin exponer tus datos personales.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border rounded-2xl bg-muted/30 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-border shadow-md flex items-center justify-center">
              <QRCodeSVG
                value={urlEmergenciaPublica}
                size={180}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
              />
            </div>
            <div className="text-center space-y-1.5 w-full">
              <Badge
                variant="outline"
                className="border-primary/30 text-primary uppercase font-bold text-[10px] tracking-widest bg-primary/5"
              >
                ID: {mascota.hash_qr_identidad ?? mascota.nombre.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground">Enlace de emergencia pública:</p>
              <Link
                href={urlEmergenciaPublica}
                className="text-xs font-semibold text-primary underline break-all hover:text-primary/80 block"
              >
                {urlEmergenciaPublica}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-border/50 shrink-0">
          <Button className="w-full rounded-xl h-11" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir Placa
          </Button>
          <Button className="w-full rounded-xl h-11" onClick={() => onOpenChange(false)}>
            Aceptar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
