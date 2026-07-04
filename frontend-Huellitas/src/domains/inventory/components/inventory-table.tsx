"use client";

import React from "react";
import { Search, Download, AlertTriangle, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Producto } from "../inventory.types";

interface InventoryTableProps {
  productosFiltrados: any[];
  busqueda: string;
  setBusqueda: (val: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (val: string) => void;
  categories: any[];
  onEdit?: (prod: any) => void;
  onDelete?: (id: string) => void;
  onActivar?: (id: string) => void;
}

export function InventoryTable({
  productosFiltrados,
  busqueda,
  setBusqueda,
  filtroCategoria,
  setFiltroCategoria,
  categories,
  onEdit,
  onDelete,
  onActivar,
}: InventoryTableProps) {
  return (
    <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
      <CardHeader className="bg-muted/20 border-b border-border/30 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción, código o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-background"><Download className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="py-4 px-6 font-semibold">Producto</TableHead>
              <TableHead className="font-semibold">Categoría</TableHead>
              <TableHead className="font-semibold text-right">Stock Físico</TableHead>
              <TableHead className="font-semibold text-right">Costo Compra</TableHead>
              <TableHead className="font-semibold text-right">Precio Venta</TableHead>
              <TableHead className="font-semibold">Fecha Vcto</TableHead>
              <TableHead className="font-semibold">Receta</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="text-right px-6 py-4 font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No se encontraron productos en el inventario.
                </TableCell>
              </TableRow>
            ) : (
              productosFiltrados.map((prod) => {
                const esBajo = prod.stock <= prod.stockMinimo;
                const catName = typeof prod.categoria === "object" 
                  ? prod.categoria?.nombre 
                  : prod.categoria;

                return (
                  <TableRow key={prod.id} className="hover:bg-muted/30 transition-colors border-b-border/30">
                    <TableCell className="py-4 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        {prod.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prod.imagen_url} alt={prod.nombre} className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border/40" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">{prod.nombre?.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-foreground">{prod.nombre}</p>
                          <span className="text-xs text-muted-foreground font-mono">{prod.id} • {prod.unidadMedida || "Unidad"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{catName || "Sin Categoría"}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      <span className={esBajo ? "text-destructive" : "text-foreground"}>
                        {prod.stock} unidades
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{(prod.precioCompra || 0).toFixed(2)} Bs</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">{Number(prod.precioVenta).toFixed(2)}  Bs</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{prod.vencimiento || "N/A"}</TableCell>
                    <TableCell>
                      {prod.requiereReceta ? (
                        <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/5">Receta ⚠️</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5">Libre</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {prod.deletedAt ? (
                        <Badge variant="destructive" className="w-fit">Inactivo</Badge>
                      ) : esBajo ? (
                        <Badge className="bg-destructive hover:bg-destructive text-white flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> Stock Crítico
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500 hover:bg-green-500 text-white w-fit">Óptimo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-6 py-4 space-x-1 shrink-0">
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(prod)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" disabled={!!prod.deletedAt}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {prod.deletedAt ? (
                        onActivar && (
                          <Button variant="ghost" size="icon" onClick={() => onActivar(prod.id)} className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-500" title="Reactivar">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )
                      ) : (
                        onDelete && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(prod.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Desactivar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
