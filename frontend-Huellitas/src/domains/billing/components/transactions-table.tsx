"use client";

import React from "react";
import { CheckCircle, HelpCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

interface Transaction {
  id: string;
  hora: string;
  cliente: string;
  concepto: string;
  metodo: string;
  monto: number;
  estado: string;
}

interface TransactionsTableProps {
  transacciones: Transaction[];
  cajaAbierta: boolean;
  ocultarMonto?: boolean;
}

export function TransactionsTable({ transacciones, cajaAbierta, ocultarMonto = false }: TransactionsTableProps) {
  return (
    <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
      <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
        <CardTitle className="text-lg">Libro Diario de Facturación</CardTitle>
        <CardDescription>
          {ocultarMonto 
            ? "Detalle de servicios registrados en tu turno de caja." 
            : "Detalle de cobros aprobados en la fecha actual."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="py-4 px-6 font-semibold">Factura ID</TableHead>
              <TableHead className="font-semibold">Hora</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Concepto</TableHead>
              <TableHead className="font-semibold">Método Pago</TableHead>
              {!ocultarMonto && <TableHead className="font-semibold text-right">Monto (Bs)</TableHead>}
              <TableHead className="font-semibold">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cajaAbierta || transacciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={ocultarMonto ? 6 : 7} className="text-center py-10 text-muted-foreground text-sm">
                  La caja se encuentra cerrada. Realiza la apertura para ver movimientos comerciales.
                </TableCell>
              </TableRow>
            ) : (
              transacciones.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors border-b-border/30">
                  <TableCell className="py-4 px-6 font-mono font-bold text-primary text-xs">{t.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.hora}</TableCell>
                  <TableCell className="font-medium text-foreground">{t.cliente}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{t.concepto}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.metodo}</Badge>
                  </TableCell>
                  {!ocultarMonto && <TableCell className="text-right font-mono font-bold">{t.monto.toFixed(2)}</TableCell>}
                  <TableCell>
                    <Badge className="bg-green-500 text-white flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" /> {t.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
