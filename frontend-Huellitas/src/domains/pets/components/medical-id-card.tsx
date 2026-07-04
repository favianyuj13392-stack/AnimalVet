"use client";

import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Dna, Calendar, Scale, User, Phone, ShieldAlert } from "lucide-react";

interface Mascota {
  nombre: string;
  especie: string;
  raza: string;
  edad: string;
  sexo: string;
  esterilizado: boolean;
  peso: string;
  nombrePropietario: string;
  telefonoUrgencia: string;
  foto: string;
  alergias: string;
  condiciones: string;
}

interface MedicalIdCardProps {
  mascota: Mascota;
}

export function MedicalIdCard({ mascota }: MedicalIdCardProps) {
  return (
    <Card className="rounded-3xl border-border/50 overflow-hidden bg-card/60 backdrop-blur-sm self-start">
      <div className="h-32 relative bg-gradient-to-r from-primary to-primary/60">
        <div className="absolute top-4 left-6">
          <span className="text-white/80 text-[10px] uppercase font-bold tracking-widest">
            Carnet Veterinario Oficial
          </span>
          <p className="text-white text-xl font-black">Huellitas Digitales</p>
        </div>
        <div className="absolute bottom-4 right-6">
          <Badge className="bg-white/20 text-white border-0 font-bold backdrop-blur-sm">
            Activo
          </Badge>
        </div>
      </div>

      <CardContent className="relative px-6 pb-6 pt-0">
        {/* Foto perfil flotante */}
        <div className="absolute -top-12 left-6">
          <div className="h-24 w-24 rounded-2xl border-4 border-background overflow-hidden bg-muted shadow-md">
            <img src={mascota.foto} alt={mascota.nombre} className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Datos biológicos */}
        <div className="mt-14 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">{mascota.nombre}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Dna className="h-4 w-4 text-primary" /> {mascota.especie} • {mascota.raza}
            </p>
          </div>

          {/* Alertas médicas destacadas */}
          {mascota.alergias !== "Ninguna conocida" || mascota.condiciones !== "Ninguna" ? (
            <div className="p-3.5 rounded-2xl bg-emergency/10 border border-emergency/20 text-emergency text-xs space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Alerta Médica Propietario
              </p>
              {mascota.alergias !== "Ninguna conocida" && (
                <p>
                  <strong>Alergias:</strong> {mascota.alergias}
                </p>
              )}
              {mascota.condiciones !== "Ninguna" && (
                <p>
                  <strong>Condición:</strong> {mascota.condiciones}
                </p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
            <div className="bg-muted/40 p-3 rounded-2xl space-y-1">
              <span className="text-muted-foreground block">Edad</span>
              <span className="font-bold text-foreground text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> {mascota.edad}
              </span>
            </div>
            <div className="bg-muted/40 p-3 rounded-2xl space-y-1">
              <span className="text-muted-foreground block">Peso Actual</span>
              <span className="font-bold text-foreground text-sm flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-primary" /> {mascota.peso}
              </span>
            </div>
            <div className="bg-muted/40 p-3 rounded-2xl space-y-1">
              <span className="text-muted-foreground block">Género / Sexo</span>
              <span className="font-bold text-foreground text-sm">{mascota.sexo}</span>
            </div>
            <div className="bg-muted/40 p-3 rounded-2xl space-y-1">
              <span className="text-muted-foreground block">Esterilizado</span>
              <Badge variant={mascota.esterilizado ? "default" : "outline"} className="text-[10px]">
                {mascota.esterilizado ? "Sí" : "No"}
              </Badge>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="pt-4 border-t border-border/40 space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <div>
                <span className="block text-[10px] uppercase">Propietario</span>
                <strong className="text-foreground">{mascota.nombrePropietario}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <div>
                <span className="block text-[10px] uppercase">Contacto Emergencia</span>
                <strong className="text-foreground">{mascota.telefonoUrgencia}</strong>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
