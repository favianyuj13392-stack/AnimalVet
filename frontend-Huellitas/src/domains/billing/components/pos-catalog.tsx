"use client";

import React, { useState } from "react";
import { Search, Barcode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";

interface CatalogItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

interface PosCatalogProps {
  items: CatalogItem[];
  onAgregarAlCarrito: (item: CatalogItem) => void;
}

export function PosCatalog({ items, onAgregarAlCarrito }: PosCatalogProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("todas");

  const categorias = ["todas", ...Array.from(new Set(items.map((i) => i.categoria)))];

  const itemsFiltrados = items.filter((item) => {
    const coincideBusqueda =
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.id.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaSel === "todas" || item.categoria === categoriaSel;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Barcode className="h-5 w-5 text-primary" /> 2. Catálogo de Artículos y Servicios
          </CardTitle>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categorias.map((cat) => (
              <Badge
                key={cat}
                variant={categoriaSel === cat ? "default" : "outline"}
                className="cursor-pointer capitalize px-3 py-1 text-xs rounded-lg"
                onClick={() => setCategoriaSel(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artículo o servicio en catálogo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 rounded-xl h-11 bg-background"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsFiltrados.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground text-sm">
              No se encontraron artículos que coincidan con la búsqueda.
            </div>
          ) : (
            itemsFiltrados.map((item) => (
              <button
                key={item.id}
                onClick={() => onAgregarAlCarrito(item)}
                className="flex flex-col text-left p-4 bg-muted/20 border border-border/60 rounded-2xl hover:border-primary hover:bg-muted/40 transition-all duration-300 group"
              >
                <Badge variant="outline" className="text-[10px] w-fit mb-1 bg-background">
                  {item.categoria}
                </Badge>
                <h4 className="font-bold text-sm text-foreground flex-1 mt-1 leading-snug group-hover:text-primary transition-colors">
                  {item.nombre}
                </h4>
                <p className="font-mono font-bold text-primary mt-2 text-base">
                  {item.precio.toFixed(2)} Bs
                </p>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
