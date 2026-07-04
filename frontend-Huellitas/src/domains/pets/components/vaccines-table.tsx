"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Syringe, Download } from "lucide-react";

interface Vacuna {
  nombre: string;
  fecha: string;
  lote: string;
  vet: string;
  estado: string;
}

interface VaccinesTableProps {
  vacunas: Vacuna[];
  onPrint: () => void;
}

export function VaccinesTable({ vacunas, onPrint }: VaccinesTableProps) {
  return (
    <Card className="rounded-3xl border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" /> Historial de Inmunización
          </CardTitle>
          <CardDescription>Control de dosis y vencimientos de vacunas.</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-semibold h-8"
          onClick={onPrint}
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Guardar PDF
        </Button>
      </CardHeader>
      <CardContent className="p-0 sm:px-6 pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40">
                <TableHead className="font-bold">Vacuna / Antígeno</TableHead>
                <TableHead className="font-bold">Fecha</TableHead>
                <TableHead className="font-bold">N° Lote</TableHead>
                <TableHead className="font-bold">Aplicada Por</TableHead>
                <TableHead className="font-bold text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacunas.map((v, idx) => (
                <TableRow key={idx} className="border-b border-border/30 hover:bg-muted/10">
                  <TableCell className="font-semibold text-foreground">{v.nombre}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.fecha}</TableCell>
                  <TableCell className="text-xs text-mono font-medium">{v.lote}</TableCell>
                  <TableCell className="text-xs">{v.vet}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={v.estado === "Aplicada" ? "default" : "outline"}
                      className={
                        v.estado === "Aplicada"
                          ? "bg-primary/20 text-primary border-0 rounded-full font-semibold text-[10px]"
                          : "border-amber-500/30 text-amber-600 bg-amber-500/5 rounded-full font-semibold text-[10px]"
                      }
                    >
                      {v.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
