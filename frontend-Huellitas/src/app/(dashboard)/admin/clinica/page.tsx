'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2, HeartPulse, FileText, Trash2, EyeOff,
  Search, Calendar, AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';

import { hospitalizacionesService } from '@/domains/clinical/services/hospitalizaciones.service';
import { historialClinicoService } from '@/domains/clinical/services/historial-clinico.service';
import { Hospitalizacion, HistorialClinico } from '@/domains/clinical/clinical.types';

const estadoBadge: Record<string, string> = {
  Observacion: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  Estable:     'bg-green-100  text-green-800  border-green-200  dark:bg-green-900/30  dark:text-green-300',
  Grave:       'bg-red-100    text-red-800    border-red-200    dark:bg-red-900/30    dark:text-red-300',
  Alta:        'bg-slate-100  text-slate-600  border-slate-200  dark:bg-slate-800     dark:text-slate-400',
};

type ConfirmState = { open: boolean; type: 'hosp' | 'hist'; id: string };

export default function SupervisionClinicaPage() {
  const queryClient = useQueryClient();
  const [busquedaHosp, setBusquedaHosp] = useState('');
  const [busquedaHist, setBusquedaHist] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, type: 'hosp', id: '' });

  const { data: hospitalizaciones = [], isLoading: loadHosp } = useQuery<Hospitalizacion[]>({
    queryKey: ['admin-hospitalizaciones'],
    queryFn: () => hospitalizacionesService.getAll(),
  });

  const { data: historiales = [], isLoading: loadHist } = useQuery<HistorialClinico[]>({
    queryKey: ['admin-historial'],
    queryFn: () => historialClinicoService.getAll(),
  });

  const { mutateAsync: eliminarHosp, isPending: eliminandoHosp } = useMutation({
    mutationFn: (id: string) => hospitalizacionesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitalizaciones'] });
      toast.success('Hospitalización eliminada');
      setConfirm((c) => ({ ...c, open: false }));
    },
  });

  const { mutateAsync: desactivarHist, isPending: desactivandoHist } = useMutation({
    mutationFn: (id: string) => historialClinicoService.desactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-historial'] });
      toast.success('Historial desactivado');
      setConfirm((c) => ({ ...c, open: false }));
    },
  });

  const handleConfirm = () => {
    if (confirm.type === 'hosp') eliminarHosp(confirm.id);
    else desactivarHist(confirm.id);
  };

  const activos   = hospitalizaciones.filter((h) => h.estado_actual !== 'Alta');
  const enGrave   = hospitalizaciones.filter((h) => h.estado_actual === 'Grave');
  const histActivos = historiales.filter((h) => !h.deletedAt);

  const hospFiltradas = hospitalizaciones.filter((h) => {
    const t = busquedaHosp.toLowerCase();
    return (
      !t ||
      h.mascota?.nombre?.toLowerCase().includes(t) ||
      h.veterinario?.nombres?.toLowerCase().includes(t) ||
      h.motivo_ingreso?.toLowerCase().includes(t)
    );
  });

  const histFiltrados = historiales.filter((h) => {
    const t = busquedaHist.toLowerCase();
    return (
      !t ||
      h.mascota?.nombre?.toLowerCase().includes(t) ||
      h.veterinario?.nombres?.toLowerCase().includes(t) ||
      h.motivo_consulta?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supervisión Clínica</h1>
        <p className="text-muted-foreground mt-1">Auditoría y control de registros clínicos</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internados activos</p>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{activos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-700">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado grave</p>
            <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">{enGrave.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-400">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados de alta</p>
            <p className="text-2xl font-bold mt-1">{hospitalizaciones.length - activos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Historiales activos</p>
            <p className="text-2xl font-bold mt-1">{histActivos.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="hospitalizaciones">
        <TabsList>
          <TabsTrigger value="hospitalizaciones" className="gap-2">
            <HeartPulse className="h-4 w-4" /> Hospitalizaciones
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <FileText className="h-4 w-4" /> Historial Clínico
          </TabsTrigger>
        </TabsList>

        {/* ── HOSPITALIZACIONES ── */}
        <TabsContent value="hospitalizaciones" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mascota, veterinario o motivo..."
                  className="pl-9"
                  value={busquedaHosp}
                  onChange={(e) => setBusquedaHosp(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadHosp ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Cargando hospitalizaciones...</span>
                </div>
              ) : hospFiltradas.length === 0 ? (
                <p className="text-center py-12 text-sm text-muted-foreground">Sin registros encontrados.</p>
              ) : (
                <div className="space-y-2">
                  {hospFiltradas.map((h) => {
                    const dias = Math.floor(
                      (Date.now() - new Date(h.fecha_ingreso).getTime()) / 86_400_000
                    );
                    return (
                      <div
                        key={h.id}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{h.mascota?.nombre ?? '—'}</p>
                            <Badge className={`text-[10px] border ${estadoBadge[h.estado_actual] ?? ''}`}>
                              {h.estado_actual}
                            </Badge>
                            {h.estado_actual === 'Grave' && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {h.motivo_ingreso}
                            {h.veterinario && (
                              <> · Dr(a). {h.veterinario.nombres} {h.veterinario.apellidos}</>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            Ingresó: {new Date(h.fecha_ingreso).toLocaleDateString('es')}
                            {h.estado_actual !== 'Alta' && (
                              <span className="ml-1 font-medium text-foreground">{dias} días internado</span>
                            )}
                            {h.fecha_alta && (
                              <span className="ml-2">
                                · Alta: {new Date(h.fecha_alta).toLocaleDateString('es')}
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 shrink-0"
                          title="Eliminar hospitalización"
                          onClick={() => setConfirm({ open: true, type: 'hosp', id: h.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTORIAL CLÍNICO ── */}
        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mascota, veterinario o motivo..."
                  className="pl-9"
                  value={busquedaHist}
                  onChange={(e) => setBusquedaHist(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadHist ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Cargando historial clínico...</span>
                </div>
              ) : histFiltrados.length === 0 ? (
                <p className="text-center py-12 text-sm text-muted-foreground">Sin registros encontrados.</p>
              ) : (
                <div className="space-y-2">
                  {histFiltrados.map((h) => (
                    <div
                      key={h.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        h.deletedAt
                          ? 'opacity-50 bg-muted/30'
                          : 'hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{h.mascota?.nombre ?? '—'}</p>
                          {h.deletedAt && (
                            <Badge variant="destructive" className="text-[10px]">Desactivado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {h.motivo_consulta}
                          {h.veterinario && (
                            <> · Dr(a). {h.veterinario.nombres} {h.veterinario.apellidos}</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(h.fecha_consulta).toLocaleDateString('es', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                          {h.tipo_atencion && <> · {h.tipo_atencion}</>}
                          {h.diagnostico && (
                            <span className="ml-2 text-foreground/70 truncate max-w-[240px]">
                              — {h.diagnostico}
                            </span>
                          )}
                        </p>
                      </div>
                      {!h.deletedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 shrink-0"
                          title="Desactivar historial"
                          onClick={() => setConfirm({ open: true, type: 'hist', id: h.id })}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Diálogo de confirmación ── */}
      <Dialog open={confirm.open} onOpenChange={(v) => setConfirm((c) => ({ ...c, open: v }))}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {confirm.type === 'hosp' ? 'Eliminar hospitalización' : 'Desactivar historial'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirm.type === 'hosp'
              ? 'Esta acción elimina el registro de hospitalización de forma permanente. ¿Confirmas?'
              : 'El historial quedará desactivado y no será visible para el veterinario ni el cliente. ¿Confirmas?'}
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirm((c) => ({ ...c, open: false }))}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={eliminandoHosp || desactivandoHist}
            >
              {(eliminandoHosp || desactivandoHist) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
