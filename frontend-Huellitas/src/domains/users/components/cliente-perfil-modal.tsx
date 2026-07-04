"use client";

import { User, PawPrint, Phone, Mail, CreditCard, Receipt, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { transaccionesService } from "@/domains/billing/services/transacciones.service";

interface Props {
  cliente: {
    id: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    ci?: string;
  } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ClientePerfilModal({ cliente, open, onOpenChange }: Props) {
  const { data: mascotas = [], isLoading: loadMascotas } = useQuery({
    queryKey: ["perfil-mascotas", cliente?.id],
    queryFn: () => mascotasService.getMisMascotas(cliente!.id),
    enabled: !!cliente?.id && open,
  });

  const { data: transacciones = [], isLoading: loadTx } = useQuery({
    queryKey: ["perfil-tx", cliente?.id],
    queryFn: () => transaccionesService.getAll(),
    enabled: !!cliente?.id && open,
    select: (data) =>
      data
        .filter((t: any) => t.id_cliente_fk === cliente?.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
  });

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{cliente.nombres} {cliente.apellidos}</p>
              <p className="text-xs text-muted-foreground font-normal">Perfil del cliente</p>
            </div>
          </DialogTitle>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Datos de contacto */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contacto</p>
            <div className="rounded-2xl border border-border/50 bg-muted/20 divide-y divide-border/40">
              {cliente.telefono && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <a href={`tel:${cliente.telefono}`} className="font-semibold text-sm hover:text-primary transition-colors">
                      {cliente.telefono}
                    </a>
                  </div>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold text-sm">{cliente.email}</p>
                  </div>
                </div>
              )}
              {cliente.ci && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <CreditCard className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">CI</p>
                    <p className="font-semibold text-sm">{cliente.ci}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mascotas */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <PawPrint className="h-3.5 w-3.5" /> Mascotas
              <Badge variant="outline" className="text-[10px] ml-auto">{(mascotas as any[]).length}</Badge>
            </p>
            {loadMascotas ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            ) : (mascotas as any[]).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Sin mascotas registradas</p>
            ) : (
              <div className="space-y-1.5">
                {(mascotas as any[]).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/50 bg-background">
                    <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <PawPrint className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{m.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.especie?.nombre ?? ""}{m.raza ? ` · ${m.raza.nombre}` : ""}
                      </p>
                    </div>
                    {m.deletedAt && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Inactiva</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimas transacciones */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" /> Últimas transacciones
            </p>
            {loadTx ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            ) : (transacciones as any[]).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Sin transacciones registradas</p>
            ) : (
              <div className="space-y-1.5">
                {(transacciones as any[]).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-border/50 bg-background">
                    <div>
                      <p className="text-xs font-semibold">{tx.metodoPago}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.createdAt ? format(parseISO(tx.createdAt), "dd MMM yyyy · HH:mm", { locale: es }) : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">Bs {Number(tx.totalCobrado).toFixed(2)}</p>
                      <Badge variant="outline"
                        className={`text-[9px] ${tx.estadoTransaccion === "Anulada" ? "text-destructive border-destructive/30" : "text-emerald-600 border-emerald-200"}`}>
                        {tx.estadoTransaccion}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
