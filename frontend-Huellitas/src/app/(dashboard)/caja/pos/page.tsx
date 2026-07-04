"use client";

import { useState, useMemo, useEffect } from "react";
import { io } from "socket.io-client";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Receipt, Loader2,
  Banknote, CreditCard, QrCode, CheckCircle2, Package, Stethoscope,
  UserSearch, RefreshCw, UserPlus, HeartPulse, FileText, CalendarClock,
  Info, X, Eye, Sun, Cloud, Moon, Activity
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isToday, parseISO } from "date-fns";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

import { productosService } from "@/domains/inventory/services/productos.service";
import { servicesService } from "@/domains/billing/services/services.service";
import { transaccionesService, TransaccionCaja } from "@/domains/billing/services/transacciones.service";
import { cierresCajaService } from "@/domains/billing/services/cierres-caja.service";
import { usuariosService } from "@/domains/users/services/usuarios.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { citasService } from "@/domains/appointments/services/citas.service";
import { hospitalizacionesService } from "@/domains/clinical/services/hospitalizaciones.service";
import { authService } from "@/domains/users/autenticacion/services/auth.service";
import { NuevoPacienteDialog } from "@/domains/users/components/nuevo-paciente-dialog";
import { ClientePerfilModal } from "@/domains/users/components/cliente-perfil-modal";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { Hospitalizacion } from "@/domains/clinical/clinical.types";
import { Mascota } from "@/domains/pets/pets.types";

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: "producto" | "servicio";
}

const METODO_OPTIONS = [
  { value: "Efectivo",         label: "Efectivo",     icon: Banknote },
  { value: "QR_Transferencia", label: "QR / Transf.", icon: QrCode },
  { value: "Tarjeta",          label: "Tarjeta",      icon: CreditCard },
];
const TURNOS = ["Mañana", "Tarde", "Noche"] as const;

const getTurnoActual = (): string => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 14) return "Mañana";
  if (hora >= 14 && hora < 20) return "Tarde";
  return "Noche";
};

export default function CajaPosPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // ── Carrito y Contexto ───────────────────────────────────────────────────
  const [carrito, setCarrito]       = useState<CartItem[]>([]);
  const [descuento, setDescuento]   = useState(0);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [clienteId, setClienteId]   = useState("");
  const [busquedaProd, setBusqProd] = useState("");
  const [busquedaServ, setBusqServ] = useState("");
  const [busquedaCliente, setBusqCli] = useState("");
  const [ticketOpen, setTicketOpen]         = useState(false);
  const [lastTx, setLastTx]                 = useState<any>(null);
  const [motivoDescuento, setMotivoDescuento] = useState("");

  // NUEVO: Manejo de estado para saber qué estamos cobrando
  const [modoCaja, setModoCaja] = useState<"normal" | "historial" | "hospitalizacion">("normal");
  const [entidadId, setEntidadId] = useState<string | null>(null);

  // ── Cierre de turno ──────────────────────────────────────────────────────
  const [cierreOpen, setCierreOpen]     = useState(false);
  const [turnoSel, setTurnoSel]         = useState<string>(getTurnoActual);
  const [pinCierre, setPinCierre]       = useState("");
  const [pinError, setPinError]         = useState("");
  const [pinVerificando, setPinVerif]   = useState(false);

  // ── Nuevo paciente ───────────────────────────────────────────────────────
  const [nuevoPacienteOpen, setNuevoPacienteOpen] = useState(false);
  const [perfilOpen, setPerfilOpen]               = useState(false);

  // ── Selecciones Clínicas ─────────────────────────────────────────────────
  const [busquedaMascota, setBusqMascota]       = useState("");
  const [mascotaSelHist, setMascotaSelHist]     = useState<Mascota | null>(null);
  const [historialSel, setHistorialSel]         = useState<any>(null);
  const [hospSel, setHospSel]                   = useState<Hospitalizacion | null>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: productos = [], isLoading: loadProd } = useQuery({
    queryKey: ["productos-pos"],
    queryFn: () => productosService.getAll().catch(() => []),
  });
  const { data: servicios = [], isLoading: loadServ } = useQuery({
    queryKey: ["servicios-pos"],
    queryFn: () => servicesService.getAll().catch(() => []),
  });
  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-pos"],
    queryFn: () => usuariosService.getClientes().catch(() => []),
  });
  const { data: mascotas = [] } = useQuery<Mascota[]>({
    queryKey: ["mascotas"],
    queryFn: () => mascotasService.getAll().catch(() => []),
  });
  const { data: hospitalizaciones = [], isLoading: loadHosp } = useQuery<Hospitalizacion[]>({
    queryKey: ["hospitalizaciones-pos"],
    queryFn: () => hospitalizacionesService.getAll().catch(() => []),
  });
  const { data: transacciones = [], isLoading: loadTx, refetch: refetchTx } = useQuery<TransaccionCaja[]>({
    queryKey: ["transacciones-pos"],
    queryFn: () => transaccionesService.getAll({ cajeroId: user?.id }).catch(() => []),
  });
  const { data: cierresPrevios = [] } = useQuery({
    queryKey: ["cierres-pos"],
    queryFn: () => cierresCajaService.getAll().catch(() => []),
  });

  const { data: pendientesHistorial = [], isLoading: loadExp } = useQuery<any[]>({
    queryKey: ["pendientes-cobro-pos", mascotaSelHist?.id],
    queryFn: () => citasService.getPendientesCobro(mascotaSelHist!.id),
    enabled: !!mascotaSelHist,
  });

  const { data: todosPendientes = [], refetch: refetchTodosPendientes, isLoading: loadTodosPendientes } = useQuery<any[]>({
    queryKey: ["todos-pendientes-cobro-pos"],
    queryFn: () => citasService.getPendientesCobro(),
  });

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socket.on("citaActualizada", () => {
      refetchTodosPendientes();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetchTodosPendientes]);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const onSuccessVenta = (tx: TransaccionCaja) => {
    setLastTx(tx);
    setTicketOpen(true);
    limpiarCaja();
    queryClient.invalidateQueries({ queryKey: ["transacciones-pos"] });
    queryClient.invalidateQueries({ queryKey: ["hospitalizaciones-pos"] });
    toast.success("Cobro procesado correctamente");
  };

  const cobrarMut = useMutation({
    mutationFn: () =>
      transaccionesService.crear({
        metodo_pago: metodoPago,
        turno: turnoSel,
        descuento: descuentoAplicado,
        motivo_descuento: descuentoAplicado > 0 ? motivoDescuento : undefined,
        id_cliente_fk: clienteId || undefined,
        detalles: carrito.map((item) => ({
          ...(item.tipo === "producto" ? { id_producto_fk: item.id } : { id_servicio_fk: item.id }),
          cantidad: item.cantidad,
          precio_unitario: item.precio,
        })),
      }),
    onSuccess: onSuccessVenta,
  });

  const cobrarHistorialMut = useMutation({
    mutationFn: () =>
      transaccionesService.crearDesdeHistorial(entidadId!, {
        metodo_pago: metodoPago,
        descuento: descuentoAplicado,
        motivo_descuento: descuentoAplicado > 0 ? motivoDescuento : undefined,
        turno: turnoSel,
        cobrar_producto_vacuna: true,
      }),
    onSuccess: onSuccessVenta,
  });

  const cobrarHospMut = useMutation({
    mutationFn: () =>
      transaccionesService.crearDesdeHospitalizacion(entidadId!, {
        metodo_pago: metodoPago,
        descuento: descuentoAplicado,
        motivo_descuento: descuentoAplicado > 0 ? motivoDescuento : undefined,
        turno: turnoSel,
        id_servicio_hospitalizacion_fk: 4,
      }),
    onSuccess: onSuccessVenta,
  });

  const cierreMut = useMutation({
    mutationFn: () => {
      // Buscar el último cierre registrado (cualquier turno) para este cajero
      const cierresOrdenados = [...(cierresPrevios as any[])]
        .filter((c) => c.id_cajero_fk === user?.id)
        .sort((a, b) => new Date(b.cerrado_en ?? b.createdAt).getTime() - new Date(a.cerrado_en ?? a.createdAt).getTime());
      const ultimoCierre = cierresOrdenados[0];
      const desdeFecha = ultimoCierre ? new Date(ultimoCierre.cerrado_en ?? ultimoCierre.createdAt) : new Date(0);

      // Capturar todas las transacciones Completadas creadas después del último cierre
      const txCierre = (transacciones as any[]).filter((t) => {
        try {
          return t.estado === "Completada" && new Date(t.createdAt) > desdeFecha;
        } catch { return false; }
      });

      const total_efectivo   = txCierre.filter((t) => t.metodoPago === "Efectivo").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0);
      const total_qr         = txCierre.filter((t) => t.metodoPago === "QR_Transferencia").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0);
      const total_tarjeta    = txCierre.filter((t) => t.metodoPago === "Tarjeta").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0);
      const total_descuentos = txCierre.reduce((s, t) => s + Number(t.descuento ?? 0), 0);
      const total_general    = total_efectivo + total_qr + total_tarjeta;

      const now = new Date();
      const fecha_turno = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      return cierresCajaService.crear({
        turno: turnoSel,
        fecha_turno,
        id_cajero_fk: user?.id,
        total_transacciones: txCierre.length,
        total_efectivo,
        total_qr,
        total_tarjeta,
        total_descuentos,
        total_general,
      });
    },
    onSuccess: () => {
      setCierreOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transacciones-pos"] });
      queryClient.invalidateQueries({ queryKey: ["cierres-pos"] });
      toast.success(`Cierre de turno (${turnoSel}) generado correctamente`);
    },
  });

  // ─── Helpers del Contexto Clínico ──────────────────────────────────────────

  const limpiarCaja = () => {
    setCarrito([]);
    setDescuento(0);
    setMotivoDescuento("");
    setClienteId("");
    setBusqCli("");
    setModoCaja("normal");
    setEntidadId(null);
    setHistorialSel(null);
    setHospSel(null);
  };

  const cargarHistorialAlCarrito = (h: any) => {
    if (carrito.length > 0) toast.info("El carrito actual fue reemplazado.");

    // El endpoint /citas/pendientes-cobro devuelve solo datos de facturación (conceptos)
    const itemsPreview: CartItem[] = (h.conceptos ?? []).map((c: any, idx: number) => ({
      id: `concepto-${idx}`,
      nombre: c.nombre,
      precio: Number(c.precio),
      cantidad: Number(c.cantidad) || 1,
      tipo: "servicio" as const,
    }));

    setCarrito(itemsPreview);
    setModoCaja("historial");
    setEntidadId(h.id_historial);

    if (h.dueno?.id) setClienteId(h.dueno.id);

    toast.success("Historial cargado en caja.");
  };

  // Cargar automáticamente historial si viene por parámetro en la URL desde agenda
  useEffect(() => {
    if (typeof window !== "undefined" && todosPendientes && todosPendientes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const idHistorial = params.get("id_historial");
      if (idHistorial) {
        const item = (todosPendientes as any[]).find((t: any) => t.id_historial === idHistorial);
        if (item) {
          cargarHistorialAlCarrito(item);
          // Limpiar el parámetro de la URL para evitar recargas accidentadas
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      }
    }
  }, [todosPendientes]);

  const cargarHospAlCarrito = (h: any) => {
    if (carrito.length > 0) toast.info("El carrito actual fue reemplazado.");
    const itemsPreview: CartItem[] = [];

    // 1. Cálculo de días de internación (backend devuelve snake_case)
    if (h.fecha_ingreso && Number(h.costo_por_dia) > 0) {
      const fechaFin = h.fecha_alta ? new Date(h.fecha_alta) : new Date();
      const diff = Math.ceil((fechaFin.getTime() - new Date(h.fecha_ingreso).getTime()) / (24 * 60 * 60 * 1000));
      const dias = Math.max(diff, 1);
      itemsPreview.push({ id: "hosp-dias", nombre: `Días de internación (${dias})`, precio: Number(h.costo_por_dia), cantidad: dias, tipo: "servicio" });
    }

    // 2. Insumos — backend mapea a { nombre_item, cantidad, tipo }
    (h.insumos ?? []).forEach((i: any) => {
      if (i.nombre_item) {
        itemsPreview.push({
          id: `insumo-${i.id}`,
          nombre: i.nombre_item,
          precio: 0, // el backend cobra via crearDesdeHospitalizacion, precio referencial
          cantidad: Number(i.cantidad) || 1,
          tipo: i.tipo === "PRODUCTO" ? "producto" : "servicio",
        });
      }
    });

    // 3. Vacunas — backend devuelve vacunas_aplicadas con nombre_vacuna
    (h.vacunas_aplicadas ?? []).forEach((v: any) => {
      if (v.nombre_vacuna) {
        itemsPreview.push({
          id: `vacuna-${v.id}`,
          nombre: `Vacuna: ${v.nombre_vacuna}`,
          precio: 0,
          cantidad: 1,
          tipo: "producto",
        });
      }
    });

    setCarrito(itemsPreview);
    setModoCaja("hospitalizacion");
    setEntidadId(h.id);
    
    if (h.mascota?.id_dueno_fk) setClienteId(h.mascota.id_dueno_fk);

    toast.success("Hospitalización cargada en caja.");
  };

  // ─── Lógica de Precios y Validaciones ─────────────────────────────────────
  const subtotal = useMemo(() => carrito.reduce((s, i) => s + i.precio * i.cantidad, 0), [carrito]);
  const MAX_DESC = 20;
  const descuentoAplicado = Math.min(descuento, MAX_DESC);
  const totalFinal = subtotal * (1 - descuentoAplicado / 100);

  const isPendingMutations = cobrarMut.isPending || cobrarHistorialMut.isPending || cobrarHospMut.isPending;

  const handleProcesarVenta = () => {
    if (descuento > 0 && !motivoDescuento.trim()) {
      toast.error("Debes indicar el motivo del descuento.");
      return;
    }
    if (modoCaja === "historial") cobrarHistorialMut.mutate();
    else if (modoCaja === "hospitalizacion") cobrarHospMut.mutate();
    else cobrarMut.mutate();
  };

  // ─── Acciones de Carrito (Solo en modo normal) ────────────────────────────
  const agregarItem = (item: Omit<CartItem, "cantidad">) => {
    if (modoCaja !== "normal") return toast.error("Debes cancelar el cobro clínico para agregar ítems sueltos.");
    setCarrito((prev) => {
      const ex = prev.find((c) => c.id === item.id && c.tipo === item.tipo);
      if (ex) return prev.map((c) => c.id === item.id && c.tipo === item.tipo ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id: string, tipo: string, delta: number) => {
    if (modoCaja !== "normal") return;
    setCarrito((prev) => prev.map((c) => c.id === id && c.tipo === tipo ? { ...c, cantidad: Math.max(1, c.cantidad + delta) } : c));
  };

  const eliminarItem = (id: string, tipo: string) => {
    if (modoCaja !== "normal") return;
    setCarrito((prev) => prev.filter((c) => !(c.id === id && c.tipo === tipo)));
  };

  // ─── Filtros ──────────────────────────────────────────────────────────────
  const prodFiltrados   = (productos as any[]).filter((p) => !p.deletedAt && p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()));
  const servFiltrados   = (servicios as any[]).filter((s) => !s.deletedAt && s.nombre.toLowerCase().includes(busquedaServ.toLowerCase()));
  const clientesFilt    = (clientes as any[]).filter((c) => `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busquedaCliente.toLowerCase()));
  const mascotasFilt    = mascotas.filter((m) => m.nombre.toLowerCase().includes(busquedaMascota.toLowerCase()));
  const hospActivas     = hospitalizaciones.filter((h) =>
    h.estado_actual === "Alta" &&
    !(transacciones as any[]).some((t) => t.id_hospitalizacion_fk === h.id && t.estadoTransaccion === "Completada")
  );
  const clienteSelected = (clientes as any[]).find((c) => c.id === clienteId);
  const txHoy = transacciones.filter((t) => { try { return isToday(parseISO(t.createdAt)); } catch { return false; } });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Badge variant="outline" className="mb-1 bg-primary/10 text-primary border-primary/20 rounded-full">Punto de Venta</Badge>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">Caja — POS</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de turno activo */}
            <Select value={turnoSel} onValueChange={setTurnoSel}>
              <SelectTrigger className="rounded-2xl h-9 w-36 border-border/50 text-sm font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mañana"><span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5" />Mañana</span></SelectItem>
                <SelectItem value="Tarde"><span className="flex items-center gap-1.5"><Cloud className="h-3.5 w-3.5" />Tarde</span></SelectItem>
                <SelectItem value="Noche"><span className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" />Noche</span></SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-2xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setNuevoPacienteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Nuevo Paciente
            </Button>
            <Button variant="outline" className="rounded-2xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => setCierreOpen(true)}>
              <Receipt className="h-4 w-4" /> Cierre de Turno
            </Button>
          </div>
        </div>
      </div>

      {/* ── WIDGET RESUMEN DEL TURNO ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Transacciones hoy", value: txHoy.length, suffix: "", color: "text-primary bg-primary/10" },
          { label: "Efectivo",  value: txHoy.filter((t: any) => t.metodoPago === "Efectivo").reduce((s: number, t: any) => s + Number(t.totalCobrado ?? 0), 0), suffix: "Bs", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "QR / Transf.", value: txHoy.filter((t: any) => t.metodoPago === "QR_Transferencia").reduce((s: number, t: any) => s + Number(t.totalCobrado ?? 0), 0), suffix: "Bs", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "Total recaudado", value: txHoy.reduce((s: number, t: any) => s + Number(t.totalCobrado ?? 0), 0), suffix: "Bs", color: "text-primary bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-xl font-black rounded-xl py-1 px-2 ${s.color}`}>
                {s.suffix && `${s.suffix} `}{typeof s.value === "number" && s.suffix ? (s.value as number).toFixed(2) : s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── CATÁLOGO E HISTORIALES (izq 3/5) ───────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* BUSCAR CLIENTE */}
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserSearch className="h-4 w-4 text-primary" /> 1. Cliente (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente..." value={busquedaCliente}
                  onChange={(e) => { setBusqCli(e.target.value); setClienteId(""); }}
                  className="pl-9 rounded-xl bg-background" />
              </div>
              {busquedaCliente && !clienteId && clientesFilt.length > 0 && (
                <div className="rounded-2xl border border-border/50 bg-card shadow-sm max-h-36 overflow-y-auto">
                  {clientesFilt.slice(0, 6).map((c: any) => (
                    <button key={c.id}
                      onClick={() => { setClienteId(c.id); setBusqCli(`${c.nombres} ${c.apellidos}`); }}
                      className="w-full text-left px-4 py-2 hover:bg-muted/40 transition-colors text-sm">
                      {c.nombres} {c.apellidos}
                      <span className="text-muted-foreground text-xs ml-2">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {clienteId && clienteSelected && (
                <div className="flex items-center justify-between bg-primary/5 rounded-2xl px-4 py-2 border border-primary/20">
                  <span className="text-sm font-semibold">{clienteSelected.nombres} {clienteSelected.apellidos}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
                      title="Ver perfil del cliente"
                      onClick={() => setPerfilOpen(true)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                      onClick={() => { setClienteId(""); setBusqCli(""); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TABS PRINCIPALES (Catálogo suelto vs Clínico) */}
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
             <Tabs defaultValue="catalogo" className="w-full">
              <div className="bg-muted/30 p-2 border-b border-border/50">
                <TabsList className="bg-background rounded-xl w-full grid grid-cols-2">
                  <TabsTrigger value="catalogo" className="rounded-lg text-xs gap-2">
                    <ShoppingCart className="h-3.5 w-3.5" /> Venta Rápida
                  </TabsTrigger>
                  <TabsTrigger value="clinico" className="rounded-lg text-xs gap-2">
                    <HeartPulse className="h-3.5 w-3.5" /> Cobros Clínicos
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* VENTA RÁPIDA (Productos / Servicios sueltos) */}
              <TabsContent value="catalogo" className="p-0 m-0">
                <Tabs defaultValue="productos" className="p-4 pt-2">
                  <TabsList className="bg-muted/40 rounded-xl w-full mb-3">
                    <TabsTrigger value="productos" className="rounded-lg flex-1 gap-1.5 text-xs"><Package className="h-3 w-3" /> Productos</TabsTrigger>
                    <TabsTrigger value="servicios" className="rounded-lg flex-1 gap-1.5 text-xs"><Stethoscope className="h-3 w-3" /> Servicios</TabsTrigger>
                  </TabsList>

                  <TabsContent value="productos" className="space-y-3 mt-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar producto..." value={busquedaProd} onChange={(e) => setBusqProd(e.target.value)} className="pl-9 rounded-xl" />
                    </div>
                    {loadProd ? <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                        {prodFiltrados.slice(0, 20).map((p: any) => (
                          <button key={p.id}
                            disabled={modoCaja !== "normal" || !!p.requiereReceta}
                            onClick={() => agregarItem({ id: p.id, nombre: p.nombre, precio: Number(p.precioVenta), tipo: "producto" })}
                            className="flex items-center justify-between p-3 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{p.nombre}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-muted-foreground">Stock: {p.stockActual}</p>
                                {p.requiereReceta && <span className="text-xs text-amber-500 font-semibold">· Requiere receta</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm text-primary">{Number(p.precioVenta).toFixed(2)} Bs</p>
                              {modoCaja === "normal" && !p.requiereReceta && <Plus className="h-3 w-3 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="servicios" className="space-y-3 mt-0">
                     <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar servicio..." value={busquedaServ} onChange={(e) => setBusqServ(e.target.value)} className="pl-9 rounded-xl" />
                    </div>
                    {/* ... (Renderizado de servicios igual al original, agregando disabled={modoCaja !== 'normal'}) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                        {servFiltrados.slice(0, 20).map((s: any) => (
                          <button key={s.id} disabled={modoCaja !== "normal"}
                            onClick={() => agregarItem({ id: String(s.id), nombre: s.nombre, precio: Number(s.precio), tipo: "servicio" })}
                            className="flex items-center justify-between p-3 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{s.nombre}</p>
                              <p className="text-xs text-muted-foreground">{s.duracion_minutos} min</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm text-primary">{Number(s.precio).toFixed(2)} Bs</p>
                              {modoCaja === "normal" && <Plus className="h-3 w-3 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                          </button>
                        ))}
                      </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* COBROS CLÍNICOS (El núcleo de tu solicitud - 3 columnas con WebSocket en Vivo) */}
              <TabsContent value="clinico" className="p-4 mt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Consultas Listas (Tiempo Real por WebSockets) */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 animate-pulse">
                    <Activity className="w-3.5 h-3.5 text-primary"/> En Vivo: Listas para Cobrar
                  </Label>
                  {loadTodosPendientes ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  ) : todosPendientes.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
                      Esperando que el doctor cierre consultas...
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {todosPendientes.map((h: any) => (
                        <div key={h.id_historial} className="flex flex-col p-3.5 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-all text-sm gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-extrabold text-foreground text-sm">{h.mascota?.nombre || "Paciente"}</p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">Dueño: {h.dueno ? `${h.dueno.nombres}` : "Sin registrar"}</p>
                            </div>
                            <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{Number(h.total ?? 0).toFixed(2)} Bs</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/90 truncate">Conceptos: {h.conceptos?.map((c: any) => c.nombre).join(", ")}</p>
                          <Button size="sm" className="w-full h-8 text-xs font-bold rounded-xl mt-1 shadow-sm shadow-primary/20"
                            onClick={() => cargarHistorialAlCarrito(h)}>
                            Cargar a Caja
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Buscar en Historial (Manual Fallback) */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><FileText className="w-3 h-3"/> Buscar en Historial</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar mascota..." value={busquedaMascota}
                      onChange={(e) => { setBusqMascota(e.target.value); setMascotaSelHist(null); setHistorialSel(null); }}
                      className="pl-9 rounded-xl bg-background" />
                  </div>
                  
                  {busquedaMascota && !mascotaSelHist && (
                    <div className="rounded-2xl border border-border/50 bg-card shadow-sm max-h-32 overflow-y-auto">
                      {mascotasFilt.slice(0, 6).map((m) => (
                        <button key={m.id} onClick={() => { setMascotaSelHist(m); setBusqMascota(m.nombre); }} className="w-full text-left px-4 py-2 hover:bg-muted/40 transition-colors text-sm">
                          {m.nombre} {m.dueno && <span className="text-muted-foreground text-xs ml-2">— {m.dueno.nombres}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {mascotaSelHist && (
                    <div className="space-y-2 p-3 bg-muted/20 border border-border/50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{mascotaSelHist.nombre}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-muted-foreground" onClick={() => { setMascotaSelHist(null); setBusqMascota(""); setHistorialSel(null); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {loadExp ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                      ) : pendientesHistorial.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Sin historiales pendientes de cobro.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {pendientesHistorial.map((h: any) => (
                            <div key={h.id_historial} className="flex flex-col p-2 rounded-xl border border-border/50 bg-background text-sm">
                              <p className="font-semibold truncate text-xs">
                                {h.conceptos?.map((c: any) => c.nombre).join(", ") || "Consulta"}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-muted-foreground">
                                  {h.fecha_consulta ? new Date(h.fecha_consulta).toLocaleDateString("es") : "—"}
                                  {" · "}
                                  <span className="font-semibold text-primary">{Number(h.total ?? 0).toFixed(2)} Bs</span>
                                </span>
                                <Button size="sm" variant="secondary" className="h-6 text-[10px] rounded-lg px-2"
                                  onClick={() => cargarHistorialAlCarrito(h)}>
                                  Cargar a caja
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Desde Hospitalización */}
                <div className="space-y-3">
                   <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><HeartPulse className="w-3 h-3"/> Desde Hospitalización</Label>
                   {loadHosp ? <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div> : hospActivas.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">No hay pacientes con Alta pendientes de cobro.</div>
                   ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {hospActivas.map((h) => (
                        <div key={h.id} className="flex flex-col p-3 rounded-2xl border border-border/50 bg-background hover:border-primary/30 transition-all text-sm gap-2">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="font-semibold text-xs">{h.mascota?.nombre ?? "Paciente"}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{h.motivo_ingreso}</p>
                             </div>
                             <Badge variant="outline" className="text-[9px] bg-primary/5">{h.estado_actual}</Badge>
                          </div>
                          <Button size="sm" variant="secondary" className="w-full h-7 text-xs rounded-lg mt-1" onClick={() => cargarHospAlCarrito(h)}>
                             Cargar cuenta a caja
                          </Button>
                        </div>
                      ))}
                    </div>
                   )}
                </div>

              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* ── CARRITO PRINCIPAL (der 2/5) ─────────────────────────────────── */}
        <div className="xl:col-span-2">
          <Card className="rounded-3xl border-border/50 shadow-md sticky top-4">
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Carrito
                {carrito.length > 0 && <Badge className="ml-auto bg-primary text-white">{carrito.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {/* ALERTA DE CONTEXTO CLÍNICO */}
              {modoCaja !== "normal" && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-2xl flex items-start gap-2 text-sm animate-in zoom-in-95">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase tracking-wide">Modo Automatizado</p>
                    <p className="text-[10px] leading-tight mt-0.5 opacity-80">
                      Calculando desde {modoCaja === "historial" ? "Historial" : "Internación"}. El stock y métodos se ajustarán mágicamente por el backend.
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto rounded-md hover:bg-amber-500/20 shrink-0 text-amber-700" onClick={limpiarCaja} title="Cancelar cobro clínico">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <ShoppingCart className="h-10 w-10 opacity-20" />
                  <p className="text-sm">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {carrito.map((item, idx) => (
                    <div key={`${item.tipo}-${item.id}-${idx}`} className={`flex items-center gap-2 p-3 rounded-2xl border ${modoCaja !== 'normal' ? 'bg-background border-border/30 opacity-90' : 'bg-muted/30 border-border/30'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.nombre}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0">{item.tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{item.precio.toFixed(2)} Bs/u</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {modoCaja === "normal" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => cambiarCantidad(item.id, item.tipo, -1)}><Minus className="h-3 w-3" /></Button>
                        )}
                        <span className="font-bold text-sm w-6 text-center">{item.cantidad}</span>
                        {modoCaja === "normal" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => cambiarCantidad(item.id, item.tipo, 1)}><Plus className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => eliminarItem(item.id, item.tipo)}><Trash2 className="h-3 w-3" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Resumen y Configuración Final */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Descuento (%)</Label>
                  <div className="flex items-center gap-2 w-24">
                    <Input type="number" min={0} max={MAX_DESC} value={descuento}
                      onChange={(e) => { setDescuento(Math.min(Number(e.target.value), MAX_DESC)); if (Number(e.target.value) === 0) setMotivoDescuento(""); }}
                      className="h-8 rounded-xl bg-background text-right" />
                  </div>
                </div>
                {descuento > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-amber-600">Motivo del descuento <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: Cliente frecuente, convenio, etc."
                      value={motivoDescuento} onChange={(e) => setMotivoDescuento(e.target.value)}
                      className="h-8 rounded-xl bg-background text-xs" />
                  </div>
                )}

                <div className="space-y-1 bg-muted/30 rounded-2xl p-3 border border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">{subtotal.toFixed(2)} Bs</span>
                  </div>
                  {descuentoAplicado > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuento {descuentoAplicado}%</span>
                      <span className="font-mono text-destructive">-{(subtotal * descuentoAplicado / 100).toFixed(2)} Bs</span>
                    </div>
                  )}
                  <Separator className="my-1 border-border/50" />
                  <div className="flex justify-between font-black text-lg">
                    <span>TOTAL</span>
                    <span className="text-primary">{totalFinal.toFixed(2)} Bs</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {METODO_OPTIONS.map((m) => (
                    <button key={m.value} onClick={() => setMetodoPago(m.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-[10px] font-bold ${metodoPago === m.value ? "border-primary bg-primary/10 text-primary" : "border-border/50 hover:border-primary/40 text-muted-foreground"}`}>
                      <m.icon className="h-4 w-4 mb-0.5" />{m.label}
                    </button>
                  ))}
                </div>

                <Button className={`w-full rounded-2xl h-12 text-base font-bold shadow-md gap-2 ${modoCaja !== 'normal' ? 'shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white' : 'shadow-primary/20'}`}
                  disabled={carrito.length === 0 || isPendingMutations}
                  onClick={handleProcesarVenta}>
                  {isPendingMutations ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {modoCaja !== "normal" ? "Procesar Cobro Clínico" : "Procesar Venta"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── MODAL: TICKET / COMPROBANTE ── */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Cobro Exitoso
            </DialogTitle>
          </DialogHeader>
          {lastTx && (
            <div className="space-y-4 py-1">
              <div className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen del cobro</p>
                </div>
                <div className="divide-y divide-border/40 text-sm">
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-black text-primary">Bs {Number(lastTx.totalCobrado ?? 0).toFixed(2)}</span>
                  </div>
                  {Number(lastTx.descuento) > 0 && (
                    <div className="flex justify-between px-4 py-2">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="text-destructive">-Bs {Number(lastTx.descuento).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-muted-foreground">Método</span>
                    <span className="font-semibold">{lastTx.metodoPago}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setTicketOpen(false)}>Cerrar</Button>
            {lastTx?.id && (
              <Button className="rounded-xl gap-2 bg-primary"
                onClick={() => { transaccionesService.descargarComprobante(lastTx.id); }}>
                <Receipt className="h-4 w-4" /> Descargar Comprobante
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CIERRE DE TURNO ── */}
      {(() => {
        const txHoyCierre = (transacciones as any[]).filter((t) => { try { return isToday(parseISO(t.createdAt)); } catch { return false; } });
        const ef  = txHoyCierre.filter((t) => t.metodoPago === "Efectivo").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0);
        const qr  = txHoyCierre.filter((t) => t.metodoPago === "QR_Transferencia").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0);
        const tj  = txHoyCierre.filter((t) => t.metodoPago === "Tarjeta").reduce((s, t) => s + Number(t.totalCobrado ?? 0), 0);
        const desc = txHoyCierre.reduce((s, t) => s + Number(t.descuento ?? 0), 0);
        const total = ef + qr + tj;
        return (
          <Dialog open={cierreOpen} onOpenChange={(v) => { setCierreOpen(v); if (!v) { setPinCierre(""); setPinError(""); } }}>
            <DialogContent className="rounded-3xl sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Receipt className="h-5 w-5 text-destructive" /> Cierre de Turno
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-1">
                {/* Selector de turno */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Turno *</Label>
                  <Select value={turnoSel} onValueChange={setTurnoSel}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mañana">Mañana</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noche">Noche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resumen */}
                <div className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen del día</p>
                  </div>
                  <div className="divide-y divide-border/40">
                    {[
                      { label: "Transacciones", value: txHoyCierre.length, isCount: true },
                      { label: "Efectivo",       value: ef },
                      { label: "QR",             value: qr },
                      { label: "Tarjeta",        value: tj },
                      { label: "Descuentos",     value: desc, negative: true },
                    ].map(({ label, value, isCount, negative }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={`text-sm font-semibold ${negative ? "text-destructive" : "text-foreground"}`}>
                          {isCount ? value : `Bs ${Number(value).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                      <span className="text-sm font-bold text-foreground">Total General</span>
                      <span className="text-lg font-black text-primary">Bs {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Confirmación con contraseña */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contraseña para confirmar *</Label>
                <Input
                  type="password"
                  className="rounded-xl h-10"
                  placeholder="Tu contraseña"
                  value={pinCierre}
                  onChange={(e) => { setPinCierre(e.target.value); setPinError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && !pinVerificando && pinCierre && document.getElementById("btn-confirmar-cierre")?.click()}
                />
                {pinError && <p className="text-xs text-destructive">{pinError}</p>}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => { setCierreOpen(false); setPinCierre(""); setPinError(""); }}>Cancelar</Button>
                <Button
                  id="btn-confirmar-cierre"
                  variant="destructive"
                  className="rounded-xl"
                  disabled={cierreMut.isPending || pinVerificando || !pinCierre}
                  onClick={async () => {
                    setPinVerif(true);
                    setPinError("");
                    try {
                      await authService.verificarPassword(pinCierre);
                      cierreMut.mutate();
                    } catch {
                      setPinError("Contraseña incorrecta. Inténtalo de nuevo.");
                    } finally {
                      setPinVerif(false);
                    }
                  }}
                >
                  {(cierreMut.isPending || pinVerificando) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirmar Cierre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      <ClientePerfilModal
        cliente={clienteSelected ?? null}
        open={perfilOpen}
        onOpenChange={setPerfilOpen}
      />

      <NuevoPacienteDialog
        open={nuevoPacienteOpen}
        onOpenChange={setNuevoPacienteOpen}
        onSuccess={() => {
          setNuevoPacienteOpen(false);
        }}
      />

    </div>
  );
}