"use client";

import React, { useState } from "react";
import {
  Package, Search, AlertTriangle, History,
  Archive, RefreshCw, Loader2, Barcode, ShieldAlert,
  TrendingDown, TrendingUp, Box, CalendarX2, Download,
  Pencil, Trash2
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useAuthStore } from "@/shared/store/useAuthStore"; // <-- Ajusta esta ruta
import { productosService } from "@/domains/inventory/services/productos.service";
import { categoriesService } from "@/domains/inventory/services/categories.service";
import { lotesService } from "@/domains/billing/services/lotes.service";
import { kardexService } from "@/domains/billing/services/kardex.service";
import { Producto, Categoria } from "@/domains/inventory/inventory.types";

import { RegisterProductDialog } from "@/domains/inventory/components/register-product-dialog";
import { RegisterMermaDialog } from "@/domains/inventory/components/register-merma-dialog";
import { RegisterLoteDialog } from "@/domains/inventory/components/register-lote-dialog";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function diasHastaVencer(fecha: string | undefined | null) {
  if (!fecha) return 999;
  try { return differenceInDays(parseISO(fecha), new Date()); }
  catch { return 999; }
}

function BadgeEstadoLote({ dias }: { dias: number }) {
  if (dias < 0)   return <Badge variant="destructive">Vencido</Badge>;
  if (dias <= 30) return <Badge className="bg-red-500 text-white">Vence en {dias}d</Badge>;
  if (dias <= 60) return <Badge className="bg-orange-500 text-white">Vence en {dias}d</Badge>;
  return <Badge className="bg-emerald-500 text-white">Vigente</Badge>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "primary" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    red:     "bg-red-500/10 text-red-500",
    orange:  "bg-orange-500/10 text-orange-500",
    green:   "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-black">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function InventarioPage() {
  const queryClient = useQueryClient();
  // Obtenemos el usuario logueado desde Zustand
 // Obtenemos el usuario logueado desde Zustand
  const user = useAuthStore((state) => state.user);

  // Verificamos si el ID del rol es 1 (Admin). Si es 3 (Cajero) u otro, será false.
  const esAdmin = user?.rol?.id === 1;

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();
  const [busqueda, setBusqueda]               = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [modalOpen, setModalOpen]             = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Producto | null>(null);
  const [busquedaKardex, setBusquedaKardex]   = useState("");
  const [busquedaLote, setBusquedaLote]       = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ["productos-inventario"],
    queryFn: () => productosService.getAll().catch(() => []),
  });

  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias-producto"],
    queryFn: () => categoriesService.getAll().catch(() => []),
  });

  // Solo cargar lotes y kardex si es ADMIN para ahorrar peticiones de red
  const { data: lotes = [], isLoading: loadingLotes } = useQuery({
    queryKey: ["lotes-caducidad"],
    queryFn: () => lotesService.getAll().catch(() => []),
    enabled: esAdmin, 
  });

  const { data: kardex = [], isLoading: loadingKardex } = useQuery({
    queryKey: ["kardex-inventario"],
    queryFn: () => kardexService.getAll().catch(() => []),
    enabled: esAdmin,
  });

  // ── Mutations (Solo para Admin, pero las dejamos instanciadas) ───────────
  const createMut = useMutation({
    mutationFn: (p: any) => productosService.create(p),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productos-inventario"] }); toast.success("Producto registrado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => productosService.update(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productos-inventario"] }); toast.success("Producto actualizado"); setEditingProduct(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productosService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productos-inventario"] }); toast.success("Producto desactivado"); },
  });

  const activarMut = useMutation({
    mutationFn: (id: string) => productosService.activar(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productos-inventario"] }); toast.success("Producto reactivado"); },
  });

  // ── Derived data ─────────────────────────────────────────────────────────
  const mapped = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria?.nombre ?? "Sin Categoría",
    id_categoria_fk: p.id_categoria_fk,
    stock: p.stockActual,
    stockMinimo: p.stockMinimo,
    precioVenta: p.precioVenta,
    unidadMedida: p.unidadMedida,
    requiereReceta: p.requiereReceta,
    descripcion: p.descripcion ?? "",
    deletedAt: p.deletedAt,
    imagen_url: (p as any).imagen_url ?? null,
  }));

  const filtrados = mapped.filter((p) => {
    const hayBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.id.toLowerCase().includes(busqueda.toLowerCase());
    const hayCategoria = filtroCategoria === "todas" || p.categoria === filtroCategoria;
    // Si no es admin, solo mostramos productos activos
    const estaActivo = esAdmin ? true : !p.deletedAt; 
    return hayBusqueda && hayCategoria && estaActivo;
  });

  const lotesFiltered = lotes.filter((l: any) =>
    l.producto?.nombre?.toLowerCase().includes(busquedaLote.toLowerCase()) ||
    l.numeroLote?.toLowerCase().includes(busquedaLote.toLowerCase())
  );

  const kardexFiltered = kardex.filter((k: any) =>
    k.producto?.nombre?.toLowerCase().includes(busquedaKardex.toLowerCase()) ||
    k.tipo_movimiento?.toLowerCase().includes(busquedaKardex.toLowerCase())
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalProductos   = mapped.filter((p) => !p.deletedAt).length;
  const stockCritico     = mapped.filter((p) => !p.deletedAt && p.stock <= p.stockMinimo).length;
  const lotesPorVencer   = lotes.filter((l: any) => { const d = diasHastaVencer(l.fechaVencimiento); return d >= 0 && d <= 60; }).length;
  const lotesVencidos    = lotes.filter((l: any) => diasHastaVencer(l.fechaVencimiento) < 0).length;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground animate-in fade-in">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-semibold">Cargando inventario...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 rounded-full">
              {esAdmin ? "Control de Inventario" : "Catálogo de Productos"}
            </Badge>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Almacén & Suministros
            </h1>
            <p className="text-muted-foreground mt-1 max-w-lg">
              {esAdmin 
                ? "Fármacos, alimentos, insumos médicos y control de caducidades en tiempo real." 
                : "Consulta rápida de existencias y precios de venta."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl" onClick={() => { queryClient.invalidateQueries({ queryKey: ["productos-inventario"] }); toast.info("Catálogo sincronizado"); }}>
              <RefreshCw className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Sincronizar</span>
            </Button>
            
            {/* Solo Admin puede ver estos botones */}
            {esAdmin && (
              <>
                <RegisterMermaDialog
                  productos={mapped.map((p) => ({ id: p.id, nombre: p.nombre, stockActual: p.stock }))}
                  onMermaRegistered={() => { queryClient.invalidateQueries({ queryKey: ["productos-inventario"] }); toast.info("Merma registrada"); }}
                />
                <RegisterProductDialog
                  open={modalOpen}
                  onOpenChange={(o) => { setModalOpen(o); if (!o) setEditingProduct(null); }}
                  editingProduct={editingProduct}
                  onSave={async (payload) => {
                    if (editingProduct) await updateMut.mutateAsync({ id: editingProduct.id, payload });
                    else await createMut.mutateAsync(payload);
                  }}
                />
              </>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* ── STATS CARDS ────────────────────────────────────────────────── */}
      <div className={`grid gap-4 ${esAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        <StatCard icon={Box}       label="Total Productos"   value={totalProductos}    color="primary" />
        
        {/* Solo Admin ve estadísticas sensibles */}
        {esAdmin && (
          <>
            <StatCard icon={ShieldAlert} label="Stock Crítico"   value={stockCritico}      color="red"    sub="por debajo del mínimo" />
            <StatCard icon={CalendarX2} label="Lotes por vencer" value={lotesPorVencer}    color="orange" sub="en los próximos 60 días" />
            <StatCard icon={TrendingDown} label="Lotes vencidos" value={lotesVencidos}     color="red"    sub="requieren baja" />
          </>
        )}
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="stock" className="w-full">
        {/* Solo mostrar la lista de pestañas si es Admin */}
        {esAdmin && (
          <TabsList className="bg-muted/40 p-1 rounded-2xl mb-6">
            <TabsTrigger value="stock"   className="rounded-xl px-5 py-2 gap-2"><Archive className="h-4 w-4" /> Stock</TabsTrigger>
            <TabsTrigger value="lotes"   className="rounded-xl px-5 py-2 gap-2"><Barcode className="h-4 w-4" /> Lotes & Caducidad</TabsTrigger>
            <TabsTrigger value="kardex"  className="rounded-xl px-5 py-2 gap-2"><History className="h-4 w-4" /> Kardex</TabsTrigger>
          </TabsList>
        )}

        {/* ── TAB STOCK (Visible para todos) ─────────────────────────── */}
        <TabsContent value="stock" className="m-0">
          <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9 bg-background rounded-xl" />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="w-[180px] bg-background rounded-xl">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las categorías</SelectItem>
                      {categorias.map((c) => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="rounded-xl bg-background"><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="py-4 px-6 font-semibold">Producto</TableHead>
                    <TableHead className="font-semibold">Categoría</TableHead>
                    <TableHead className="font-semibold text-right">Stock</TableHead>
                    <TableHead className="font-semibold text-right">Precio Venta</TableHead>
                    <TableHead className="font-semibold">Receta</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    
                    {/* Columna Acciones solo para Admin */}
                    {esAdmin && <TableHead className="text-right px-6 font-semibold">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow><TableCell colSpan={esAdmin ? 7 : 6} className="text-center py-12 text-muted-foreground">No se encontraron productos.</TableCell></TableRow>
                  ) : filtrados.map((p) => {
                    const critico = !p.deletedAt && p.stock <= p.stockMinimo;
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                        <TableCell className="py-4 px-6">
                          <p className="font-semibold">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.unidadMedida}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{p.categoria}</Badge></TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          <span className={critico ? "text-destructive" : ""}>{p.stock}</span>
                          {esAdmin && <span className="text-xs text-muted-foreground ml-1">/ mín {p.stockMinimo}</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">{Number(p.precioVenta).toFixed(2)} Bs</TableCell>
                        <TableCell>
                          {p.requiereReceta
                            ? <Badge variant="outline" className="border-red-400/40 text-red-500 bg-red-500/5">Con Receta</Badge>
                            : <Badge variant="outline" className="border-green-400/40 text-green-600 bg-green-500/5">Libre</Badge>}
                        </TableCell>
                        <TableCell>
                          {p.deletedAt
                            ? <Badge variant="destructive">Inactivo</Badge>
                            : critico
                              ? <Badge className="bg-destructive text-white gap-1"><AlertTriangle className="h-3 w-3" /> {esAdmin ? "Stock Crítico" : "Bajo Stock"}</Badge>
                              : <Badge className="bg-emerald-500 text-white">Óptimo</Badge>}
                        </TableCell>
                        
                        {/* Celdas de Acción solo para Admin */}
                        {esAdmin && (
                          <TableCell className="text-right px-6 space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(productos.find((x) => x.id === p.id) ?? null); setModalOpen(true); }} disabled={!!p.deletedAt} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {p.deletedAt
                              ? <Button variant="ghost" size="icon" onClick={() => activarMut.mutate(p.id)} className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"><RefreshCw className="h-4 w-4" /></Button>
                              : <Button variant="ghost" size="icon" onClick={() => openConfirm({ title: "Desactivar producto", description: `¿Desactivar "${p.nombre}" del catálogo?`, variant: "destructive", confirmLabel: "Sí, desactivar", onConfirm: () => deleteMut.mutate(p.id) })} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB LOTES (Solo Admin) ──────────────────────────────────── */}
        {esAdmin && (
          <TabsContent value="lotes">
            {/* ... Resto del código de Lotes que tenías intacto ... */}
            <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Lotes y fechas de caducidad</CardTitle>
                    <CardDescription>Farmacovigilancia — alertas a 60 dias de anticipacion</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar lote o producto..." value={busquedaLote} onChange={(e) => setBusquedaLote(e.target.value)} className="pl-9 bg-background rounded-xl" />
                    </div>
                    <RegisterLoteDialog
                      productos={mapped
                        .filter((p) => !p.deletedAt)
                        .map((p) => ({ id: p.id, nombre: p.nombre, unidadMedida: p.unidadMedida }))}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingLotes ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="py-4 px-6 font-semibold">Producto</TableHead>
                        <TableHead className="font-semibold">Código Lote</TableHead>
                        <TableHead className="font-semibold text-right">Cantidad</TableHead>
                        <TableHead className="font-semibold">Vencimiento</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotesFiltered.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Sin lotes registrados.</TableCell></TableRow>
                      ) : lotesFiltered.map((l: any) => {
                        const dias = diasHastaVencer(l.fechaVencimiento);
                        return (
                          <TableRow key={l.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                            <TableCell className="py-4 px-6 font-semibold">{l.producto?.nombre ?? "—"}</TableCell>
                            <TableCell className="font-mono text-sm font-bold text-primary">{l.numeroLote ?? "—"}</TableCell>
                            <TableCell className="text-right font-mono">{l.cantidadActual ?? 0} / {l.cantidadInicial ?? 0}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {l.fechaVencimiento
                                ? format(parseISO(l.fechaVencimiento), "dd MMM yyyy", { locale: es })
                                : "—"}
                            </TableCell>
                            <TableCell><BadgeEstadoLote dias={dias} /></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── TAB KARDEX (Solo Admin) ─────────────────────────────────── */}
        {esAdmin && (
          <TabsContent value="kardex">
             {/* ... Resto del código de Kardex que tenías intacto ... */}
            <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/30 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Kardex de Movimientos</CardTitle>
                    <CardDescription>Registro inmutable de entradas, salidas y ajustes de inventario</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar movimiento..." value={busquedaKardex} onChange={(e) => setBusquedaKardex(e.target.value)} className="pl-9 bg-background rounded-xl" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingKardex ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="py-4 px-6 font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Producto</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold text-right">Cantidad</TableHead>
                        <TableHead className="font-semibold text-right">Saldo</TableHead>
                        <TableHead className="font-semibold">Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kardexFiltered.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Sin movimientos registrados.</TableCell></TableRow>
                      ) : kardexFiltered.map((k: any) => {
                        const tipo   = k.tipo_movimiento ?? "";
                        const esEntrada = tipo.toLowerCase().includes("entrada");
                        const TIPO_LABEL: Record<string, string> = {
                          Entrada:        "Entrada",
                          Salida_Venta:   "Venta",
                          Salida_Clinica: "Uso clínico",
                          Merma:          "Merma",
                          Ajuste:         "Ajuste",
                        };
                        return (
                          <TableRow key={k.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                            <TableCell className="py-4 px-6 font-mono text-xs text-muted-foreground">
                              {k.createdAt ? format(new Date(k.createdAt), "dd/MM/yy HH:mm") : "—"}
                            </TableCell>
                            <TableCell className="font-semibold">{k.producto?.nombre ?? "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`gap-1 ${esEntrada
                                  ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/30"
                                  : "border-red-300 text-red-600 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950/30"}`}
                              >
                                {esEntrada
                                  ? <TrendingUp className="h-3 w-3" />
                                  : <TrendingDown className="h-3 w-3" />}
                                {TIPO_LABEL[tipo] ?? tipo}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono font-bold ${esEntrada ? "text-emerald-600" : "text-red-500"}`}>
                              {esEntrada ? "+" : "-"}{k.cantidad}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {k.saldo_resultante ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {k.motivo_detalle ?? k.motivo ?? "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      {confirmDialog}
    </div>
  );
}