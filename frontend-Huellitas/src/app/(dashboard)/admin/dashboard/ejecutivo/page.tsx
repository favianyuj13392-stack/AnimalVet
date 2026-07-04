"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, Calendar, PawPrint, CheckCircle2,
  Activity, BarChart2, PieChart as PieIcon, LineChart,
  Loader2, Filter, ShoppingBag, Package, Syringe, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { reportesService } from "@/domains/admin/services/reportes.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const VISTAS = [
  { key: "overview",   label: "Vista General",      icon: BarChart2    },
  { key: "species",    label: "Por Especie",         icon: PieIcon      },
  { key: "services",   label: "Tipos de Atención",   icon: Activity     },
  { key: "vets",       label: "Por Veterinario",     icon: CheckCircle2 },
  { key: "monthly",    label: "Análisis Mensual",    icon: LineChart    },
  { key: "inventario", label: "Inventario Crítico",  icon: Package      },
  { key: "vacunas",    label: "Vacunas Pendientes",  icon: Syringe      },
];

const MESES = [
  { v: "0",  l: "Todo el año"  },
  { v: "1",  l: "Enero"       }, { v: "2",  l: "Febrero"    }, { v: "3",  l: "Marzo"      },
  { v: "4",  l: "Abril"       }, { v: "5",  l: "Mayo"        }, { v: "6",  l: "Junio"      },
  { v: "7",  l: "Julio"       }, { v: "8",  l: "Agosto"      }, { v: "9",  l: "Septiembre" },
  { v: "10", l: "Octubre"     }, { v: "11", l: "Noviembre"   }, { v: "12", l: "Diciembre"  },
];

const fmt  = (n: number) => new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-xl text-xs space-y-1.5">
      {label && <p className="font-black text-foreground text-sm mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <p style={{ color: p.color }} className="font-semibold">
            {p.name}:{" "}
            {typeof p.value === "number"
              ? p.dataKey === "ingresos" || p.name?.includes("Bs")
                ? `Bs. ${fmt(p.value)}`
                : p.value
              : p.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, bg, fg }: {
  label: string; value: string; sub?: string; icon: any; bg: string; fg: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
            <Icon className={`h-4 w-4 ${fg}`} />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
        </div>
        <p className="text-xl font-black text-foreground tracking-tight leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardEjecutivoPage() {
  const [vista,      setVista]      = useState("overview");
  const [anio,       setAnio]       = useState(new Date().getFullYear());
  const [mes,        setMes]        = useState("0");
  const [diasLotes,  setDiasLotes]  = useState("60");
  const [diasVacunas,setDiasVacunas]= useState("30");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-ejecutivo", anio, mes],
    queryFn:  () => reportesService.getDashboard(anio, mes !== "0" ? Number(mes) : undefined),
  });

  const { data: inventario, isLoading: loadInv } = useQuery({
    queryKey: ["dash-inventario"],
    queryFn:  () => reportesService.getInventario().catch(() => null),
    enabled:  vista === "inventario",
  });

  const { data: reporteLotes, isLoading: loadLotes } = useQuery({
    queryKey: ["dash-lotes", diasLotes],
    queryFn:  () => reportesService.getLotesPorVencer(diasLotes).catch(() => null),
    enabled:  vista === "inventario",
  });

  const { data: reporteVacunas, isLoading: loadVacunas } = useQuery({
    queryKey: ["dash-vacunas", diasVacunas],
    queryFn:  () => reportesService.getVacunasPendientes(diasVacunas).catch(() => null),
    enabled:  vista === "vacunas",
  });

  const kpis = data?.kpis ?? {};

  const vistaActual = VISTAS.find(v => v.key === vista);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">

      {/* ── NAVBAR SUPERIOR ───────────────────────────────────────────── */}
      <div className="bg-card border-b border-border/50 px-6 py-3 flex items-center justify-between shrink-0 gap-4">
        {/* Título */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-foreground leading-none">Dashboard Ejecutivo</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {anio} {mes !== "0" ? `· ${MESES.find(m => m.v === mes)?.l}` : "· Todo el año"}
            </p>
          </div>
        </div>

        {/* Tabs de vistas */}
        <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
          {VISTAS.map(v => (
            <button
              key={v.key}
              onClick={() => setVista(v.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                vista === v.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <v.icon className="h-3.5 w-3.5 shrink-0" />
              {v.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Actualizando...
          </div>
        )}
      </div>

      {/* ── ÁREA CENTRAL + FILTROS ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Columna principal */}
        <div className="flex-1 flex flex-col overflow-hidden">

        {/* KPI Cards */}
        <div className="px-6 pt-5 pb-4 grid grid-cols-5 gap-3 shrink-0">
          <KpiCard
            label="Total Ingresos" value={`Bs. ${fmt(kpis.total_ingresos ?? 0)}`}
            sub={`${kpis.total_transacciones ?? 0} transacciones`}
            icon={DollarSign} bg="bg-primary/10" fg="text-primary"
          />
          <KpiCard
            label="En Servicios" value={`Bs. ${fmt(kpis.total_servicios ?? 0)}`}
            sub="estimado ~70%"
            icon={TrendingUp} bg="bg-emerald-500/10" fg="text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard
            label="En Productos" value={`Bs. ${fmt(kpis.total_productos ?? 0)}`}
            sub="estimado ~30%"
            icon={ShoppingBag} bg="bg-blue-500/10" fg="text-blue-600 dark:text-blue-400"
          />
          <KpiCard
            label="Total Citas" value={String(kpis.total_citas ?? 0)}
            sub={`${kpis.tasa_completadas ?? 0}% completadas`}
            icon={Calendar} bg="bg-amber-500/10" fg="text-amber-600 dark:text-amber-400"
          />
          <KpiCard
            label="Mascotas" value={String(kpis.total_mascotas ?? 0)}
            sub="registradas"
            icon={PawPrint} bg="bg-rose-500/10" fg="text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Gráficas */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando datos del dashboard...</p>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {vista === "overview" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                  {/* Área — ingresos por mes (ocupa 2 columnas) */}
                  <Card className="rounded-2xl border-border/50 shadow-sm xl:col-span-2">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Ingresos por Mes (Bs.)
                      </CardTitle>
                      <CardDescription>Evolución de ingresos durante el año</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data?.ingresos_por_mes ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}    />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={fmtK} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="ingresos" name="Ingresos Bs." stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad1)" dot={{ fill: "hsl(var(--primary))", r: 3.5, strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Dona — métodos de pago */}
                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <PieIcon className="h-4 w-4 text-primary" /> Métodos de Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={data?.metodos_pago ?? []} dataKey="valor" nameKey="metodo" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                            {(data?.metodos_pago ?? []).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 mt-2">
                        {(data?.metodos_pago ?? []).map((m: any, i: number) => (
                          <div key={m.metodo} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-xs text-muted-foreground">{m.metodo}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground">Bs. {fmt(m.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Barra horizontal — citas por vet */}
                  <Card className="rounded-2xl border-border/50 shadow-sm xl:col-span-3">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Citas por Veterinario
                      </CardTitle>
                      <CardDescription>Completadas vs total asignadas</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data?.citas_por_veterinario ?? []} layout="vertical" margin={{ left: 0, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis type="category" dataKey="nombre" width={130} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          <Bar dataKey="total"       name="Total"       fill="hsl(var(--primary)/0.2)" radius={[0, 4, 4, 0]} barSize={14} />
                          <Bar dataKey="completadas" name="Completadas" fill="hsl(var(--primary))"     radius={[0, 4, 4, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── ESPECIE ── */}
              {vista === "species" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base font-bold">Citas por Especie — Dona</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-8 pt-2">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie data={data?.citas_por_especie ?? []} dataKey="cantidad" nameKey="especie" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                            {(data?.citas_por_especie ?? []).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-3">
                        {(data?.citas_por_especie ?? []).map((e: any, i: number) => (
                          <div key={e.especie} className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <div>
                              <p className="text-sm font-bold text-foreground">{e.especie}</p>
                              <p className="text-xs text-muted-foreground">{e.cantidad} citas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base font-bold">Citas por Especie — Barras</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data?.citas_por_especie ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="especie" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="cantidad" name="Citas" radius={[8, 8, 0, 0]} barSize={50}>
                            {(data?.citas_por_especie ?? []).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── TIPOS ATENCIÓN ── */}
              {vista === "services" && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base font-bold">Atenciones por Tipo de Consulta</CardTitle>
                    <CardDescription>Distribución de historiales clínicos según tipo</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={data?.atenciones_por_tipo ?? []} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="tipo" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="cantidad" name="Atenciones" radius={[10, 10, 0, 0]} barSize={60}>
                          {(data?.atenciones_por_tipo ?? []).map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* ── VETERINARIOS ── */}
              {vista === "vets" && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base font-bold">Productividad por Veterinario</CardTitle>
                    <CardDescription>Citas completadas vs total en el período</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={data?.citas_por_veterinario ?? []} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis type="category" dataKey="nombre" width={150} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                        <Bar dataKey="total"       name="Total"       fill="hsl(var(--primary)/0.2)" radius={[0, 6, 6, 0]} barSize={20} />
                        <Bar dataKey="completadas" name="Completadas" fill="hsl(var(--primary))"     radius={[0, 6, 6, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* ── INVENTARIO CRÍTICO ── */}
              {vista === "inventario" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" /> Productos con Stock Crítico
                      </CardTitle>
                      <CardDescription>Productos bajo el mínimo requerido</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadInv ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow>
                              <TableHead className="py-3 px-5 font-semibold">Producto</TableHead>
                              <TableHead className="font-semibold">Categoría</TableHead>
                              <TableHead className="font-semibold text-right px-5">Stock</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(inventario?.productos_criticos ?? []).length === 0 ? (
                              <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Sin stock crítico 🎉</TableCell></TableRow>
                            ) : (inventario?.productos_criticos ?? []).slice(0, 10).map((p: any) => (
                              <TableRow key={p.id} className="hover:bg-muted/30">
                                <TableCell className="py-3 px-5 font-semibold text-sm">{p.nombre}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{p.categoria}</Badge></TableCell>
                                <TableCell className="text-right px-5">
                                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                    {p.stock_actual} / mín {p.stock_minimo}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/50 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Package className="h-4 w-4 text-amber-500" /> Lotes por Vencer
                        </CardTitle>
                        <CardDescription>Próximos {diasLotes} días</CardDescription>
                      </div>
                      <Select value={diasLotes} onValueChange={setDiasLotes}>
                        <SelectTrigger className="w-28 h-8 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 días</SelectItem>
                          <SelectItem value="60">60 días</SelectItem>
                          <SelectItem value="90">90 días</SelectItem>
                          <SelectItem value="180">6 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadLotes ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow>
                              <TableHead className="py-3 px-5 font-semibold">Producto</TableHead>
                              <TableHead className="font-semibold">Vencimiento</TableHead>
                              <TableHead className="font-semibold text-right px-5">Cant.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(reporteLotes?.lotes ?? []).length === 0 ? (
                              <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Sin lotes próximos a vencer 🎉</TableCell></TableRow>
                            ) : (reporteLotes?.lotes ?? []).slice(0, 10).map((l: any) => (
                              <TableRow key={l.id_lote} className="hover:bg-muted/30">
                                <TableCell className="py-3 px-5 font-semibold text-sm">
                                  {l.producto}
                                  <span className="block text-[10px] text-muted-foreground">{l.numero_lote}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-xs ${l.criticidad === 'CRÍTICO' ? 'bg-destructive text-white' : l.criticidad === 'URGENTE' ? 'bg-amber-500 text-white' : 'bg-yellow-400 text-black'}`}>
                                    {new Date(l.fecha_vencimiento).toLocaleDateString('es-BO')} · {l.dias_restantes}d
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right px-5 font-mono font-bold">{l.cantidad_disponible}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── VACUNAS PENDIENTES ── */}
              {vista === "vacunas" && (
                <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between border-b border-border/40">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Syringe className="h-4 w-4 text-primary" /> Vacunas Pendientes de Refuerzo
                      </CardTitle>
                      <CardDescription>Mascotas con próxima dosis en los próximos {diasVacunas} días</CardDescription>
                    </div>
                    <Select value={diasVacunas} onValueChange={setDiasVacunas}>
                      <SelectTrigger className="w-28 h-8 text-xs rounded-xl bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="60">60 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadVacunas ? (
                      <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow>
                            <TableHead className="py-3 px-5 font-semibold">Mascota</TableHead>
                            <TableHead className="font-semibold">Vacuna</TableHead>
                            <TableHead className="font-semibold">Próxima Dosis</TableHead>
                            <TableHead className="font-semibold">Dueño</TableHead>
                            <TableHead className="font-semibold">Teléfono</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(reporteVacunas?.vacunas_pendientes ?? []).length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Sin vacunas pendientes 🎉</TableCell></TableRow>
                          ) : (reporteVacunas?.vacunas_pendientes ?? []).map((v: any) => (
                            <TableRow key={v.id_vacuna_aplicada} className="hover:bg-muted/30 border-b border-border/30">
                              <TableCell className="py-3 px-5 font-semibold text-sm">{v.mascota?.nombre ?? "—"}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{v.vacuna}</Badge></TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${v.dias_restantes <= 7 ? 'bg-destructive text-white' : 'bg-amber-500 text-white'}`}>
                                  {new Date(v.fecha_proxima_dosis).toLocaleDateString('es-BO')} · {v.dias_restantes}d
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{v.dueno?.nombres ?? "—"} {v.dueno?.apellidos ?? ""}</TableCell>
                              <TableCell className="font-mono text-sm">{v.dueno?.telefono ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── MENSUAL ── */}
              {vista === "monthly" && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base font-bold">Ingresos Mensuales — {anio}</CardTitle>
                    <CardDescription>Evolución de ingresos mes a mes en Bolivianos</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={data?.ingresos_por_mes ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradMensual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13 }} tickFormatter={fmtK} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="ingresos" name="Ingresos Bs." stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#gradMensual)" dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2.5, stroke: "hsl(var(--background))" }} activeDot={{ r: 7 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
        </div>{/* fin columna principal */}

      {/* ── PANEL FILTROS DERECHO ─────────────────────────────────────── */}
      <aside className="w-52 shrink-0 bg-card border-l border-border/50 flex flex-col py-5 px-4 gap-5 overflow-y-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <span className="font-black text-sm text-foreground">Filtros</span>
        </div>

        <Separator className="opacity-50" />

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Año</p>
          <Select value={String(anio)} onValueChange={v => setAnio(Number(v))}>
            <SelectTrigger className="rounded-xl h-10 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mes</p>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="rounded-xl h-10 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map(m => (
                <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="opacity-50" />

        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resumen</p>

          {[
            { label: "Completadas",   value: kpis.citas_completadas ?? 0,  color: "bg-primary/10 text-primary border-primary/20" },
            { label: "Total citas",   value: kpis.total_citas ?? 0,         color: "bg-muted text-muted-foreground" },
            { label: "Tasa de éxito", value: `${kpis.tasa_completadas ?? 0}%`, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
            { label: "Transacciones", value: kpis.total_transacciones ?? 0, color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <Badge variant="outline" className={`text-[11px] h-5 font-bold ${item.color}`}>
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </aside>
      </div>{/* fin flex área central + filtros */}
    </div>
  );
}
