"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

interface KardexTableProps {
  kardex: any[];
}

export function KardexTable({ kardex }: KardexTableProps) {
  return (
    <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
      <CardHeader>
        <CardTitle>Historial de Movimientos de Almacén</CardTitle>
        <CardDescription>Registro cronológico de ingresos, egresos clínicos y ajustes manuales.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="py-4 px-6 font-semibold">Fecha y Hora</TableHead>
              <TableHead className="font-semibold">ID Mov</TableHead>
              <TableHead className="font-semibold">Producto</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold text-right">Cantidad</TableHead>
              <TableHead className="font-semibold">Concepto / Motivo</TableHead>
              <TableHead className="font-semibold">Operador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kardex.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se registraron movimientos en el Kardex.
                </TableCell>
              </TableRow>
            ) : (
              kardex.map((mov) => (
                <TableRow key={mov.id} className="hover:bg-muted/30 transition-colors border-b-border/30">
                  <TableCell className="py-4 px-6 font-mono text-sm">{mov.fecha}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{mov.id}</TableCell>
                  <TableCell className="font-semibold">{mov.producto}</TableCell>
                  <TableCell>
                    <Badge className={mov.tipo === "Entrada" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}>
                      {mov.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">{mov.cantidad} uds</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{mov.motivo}</TableCell>
                  <TableCell className="text-sm font-medium">{mov.responsable}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
