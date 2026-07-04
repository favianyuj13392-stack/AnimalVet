"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

interface CanilGridProps {
  caniles: any[];
  selectedCanil: any;
  onCanilClick: (canil: any) => void;
  getStatusColor: (status: string) => string;
}

export function CanilGrid({
  caniles,
  selectedCanil,
  onCanilClick,
  getStatusColor,
}: CanilGridProps) {
  return (
    <Card className="rounded-3xl border-border/50 shadow-md">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
        <CardTitle className="text-lg">Mapa de Caniles / Cunas</CardTitle>
        <CardDescription>Visualización y estado del internado clínico.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 grid grid-cols-2 gap-4">
        {caniles.map((canil) => {
          const isSelected = selectedCanil?.id === canil.id;
          return (
            <button
              key={canil.id}
              onClick={() => onCanilClick(canil)}
              className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 ${
                canil.occupied
                  ? isSelected
                    ? "border-destructive ring-2 ring-destructive bg-destructive/5"
                    : "border-border hover:border-muted-foreground hover:-translate-y-0.5"
                  : "border-dashed border-muted bg-muted/10 hover:bg-muted/20"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-mono font-bold text-muted-foreground">{canil.id}</span>
                {canil.occupied ? (
                  <Badge className={`${getStatusColor(canil.estado!)} text-[10px] uppercase font-bold py-0 px-2`}>
                    {canil.estado}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-semibold">Vacante</span>
                )}
              </div>

              <div className="mt-3">
                {canil.occupied ? (
                  <>
                    <h4 className="font-bold text-foreground truncate">{canil.paciente}</h4>
                    <p className="text-xs text-muted-foreground">{canil.especie} • {canil.raza}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">{canil.area}</p>
                  </>
                ) : (
                  <div className="py-4 text-center w-full">
                    <Plus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
