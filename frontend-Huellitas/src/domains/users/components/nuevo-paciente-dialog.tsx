'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, UserPlus, PawPrint, ChevronRight, Search, UserCheck } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';

import { usuariosService } from '@/domains/users/services/usuarios.service';
import { mascotasService } from '@/domains/pets/services/mascotas.service';
import { speciesService } from '@/domains/pets/services/especies.service';
import { breedsService } from '@/domains/pets/services/breeds.service';
import { Especie, Raza } from '@/domains/pets/pets.types';
import { nuevoClienteSchema } from '@/lib/validations/auth.schemas';
import { mascotaSchema } from '@/lib/validations/mascotas.schemas';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (clienteId: string, clienteNombre: string) => void;
}

const EMPTY_CLIENTE = { nombres: '', apellidos: '', email: '', password: '', telefono: '' };
const EMPTY_MASCOTA = { nombre: '', sexo: 'M', fecha_nacimiento: '', esterilizado: false, especieId: '', id_raza_fk: '', foto_url: '', caracteristicas_fisicas: '', contacto_emergencia_telefono: '' };

// Errores locales de formulario
type ClienteErrors = Partial<Record<keyof typeof EMPTY_CLIENTE, string>>;
type MascotaErrors = Partial<{ nombre: string; sexo: string; especieId: string; fecha_nacimiento: string; contacto_emergencia_telefono: string; caracteristicas_fisicas: string }>;

export function NuevoPacienteDialog({ open, onOpenChange, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [modo, setModo] = useState<'elegir' | 'nuevo' | 'existente'>('elegir');
  const [step, setStep] = useState<'cliente' | 'mascota'>('cliente');
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [busquedaExistente, setBusquedaExistente] = useState('');
  const [clienteForm, setClienteForm] = useState(EMPTY_CLIENTE);
  const [mascotaForm, setMascotaForm] = useState(EMPTY_MASCOTA);
  const [clienteErrors, setClienteErrors] = useState<ClienteErrors>({});
  const [mascotaErrors, setMascotaErrors] = useState<MascotaErrors>({});
  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();

  const { data: todosClientes = [] } = useQuery({
    queryKey: ['clientes-dialog'],
    queryFn: () => usuariosService.getClientes(),
    enabled: open && modo === 'existente',
  });

  const clientesFiltrados = busquedaExistente.trim().length >= 2
    ? (todosClientes as any[]).filter((c: any) =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busquedaExistente.toLowerCase()) ||
        c.telefono?.includes(busquedaExistente)
      )
    : [];

  const { data: especies = [] } = useQuery<Especie[]>({
    queryKey: ['especies'],
    queryFn: () => speciesService.getAll(),
    enabled: open && step === 'mascota',
  });
  const { data: razas = [] } = useQuery<Raza[]>({
    queryKey: ['razas'],
    queryFn: () => breedsService.getAll(),
    enabled: open && step === 'mascota',
  });

  const razasFiltradas = razas.filter(
    (r) => !mascotaForm.especieId || r.id_especie_fk.toString() === mascotaForm.especieId,
  );

  const handleClose = () => {
    setModo('elegir');
    setStep('cliente');
    setClienteId('');
    setClienteNombre('');
    setBusquedaExistente('');
    setClienteForm(EMPTY_CLIENTE);
    setMascotaForm(EMPTY_MASCOTA);
    setClienteErrors({});
    setMascotaErrors({});
    onOpenChange(false);
  };

  const { mutateAsync: crearCliente, isPending: creandoCliente } = useMutation({
    mutationFn: () =>
      usuariosService.create({
        nombres: clienteForm.nombres.trim(),
        apellidos: clienteForm.apellidos.trim(),
        email: clienteForm.email.trim(),
        password: clienteForm.password,
        telefono: clienteForm.telefono.trim() || undefined,
        id_rol_fk: 4,
      } as any),
    onSuccess: (usuario: any) => {
      const id = String(usuario.id);
      setClienteId(id);
      setClienteNombre(`${clienteForm.nombres} ${clienteForm.apellidos}`);
      queryClient.invalidateQueries({ queryKey: ['clientes-pos'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(`Cliente ${clienteForm.nombres} ${clienteForm.apellidos} creado`);
      setStep('mascota');
    },
  });

  const { mutateAsync: crearMascota, isPending: creandoMascota } = useMutation({
    mutationFn: () =>
      mascotasService.create({
        nombre: mascotaForm.nombre.trim(),
        sexo: mascotaForm.sexo,
        fecha_nacimiento: mascotaForm.fecha_nacimiento || undefined,
        esterilizado: mascotaForm.esterilizado,
        id_raza_fk: mascotaForm.id_raza_fk ? parseInt(mascotaForm.id_raza_fk) : undefined,
        id_dueno_fk: clienteId,
        ...(mascotaForm.foto_url.trim() && { foto_url: mascotaForm.foto_url.trim() }),
        ...(mascotaForm.caracteristicas_fisicas.trim() && { caracteristicas_fisicas: mascotaForm.caracteristicas_fisicas.trim() }),
        ...(mascotaForm.contacto_emergencia_telefono.trim() && { contacto_emergencia_telefono: mascotaForm.contacto_emergencia_telefono.trim() }),
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mascotas'] });
      toast.success(`Mascota ${mascotaForm.nombre} registrada`);
      onSuccess?.(clienteId, clienteNombre || `${clienteForm.nombres} ${clienteForm.apellidos}`);
      handleClose();
    },
  });

  const submitCliente = () => {
    const result = nuevoClienteSchema.safeParse({
      nombres: clienteForm.nombres,
      apellidos: clienteForm.apellidos,
      email: clienteForm.email,
      password: clienteForm.password,
      telefono: clienteForm.telefono || undefined,
    });
    if (!result.success) {
      const errs: ClienteErrors = {};
      result.error.issues.forEach((e: any) => {
        const field = e.path[0] as keyof ClienteErrors;
        if (!errs[field]) errs[field] = e.message;
      });
      setClienteErrors(errs);
      return;
    }
    setClienteErrors({});
    openConfirm({
      title: "Crear cliente",
      description: `¿Confirmar la creación de la cuenta para ${clienteForm.nombres} ${clienteForm.apellidos}?`,
      variant: "default",
      confirmLabel: "Sí, crear",
      onConfirm: () => crearCliente(),
    });
  };

  const submitMascota = () => {
    const result = mascotaSchema.safeParse({
      nombre: mascotaForm.nombre,
      sexo: mascotaForm.sexo,
      especieId: mascotaForm.especieId,
      id_raza_fk: mascotaForm.id_raza_fk || undefined,
      fecha_nacimiento: mascotaForm.fecha_nacimiento || undefined,
      esterilizado: mascotaForm.esterilizado,
      foto_url: mascotaForm.foto_url || undefined,
      caracteristicas_fisicas: mascotaForm.caracteristicas_fisicas || undefined,
      contacto_emergencia_telefono: mascotaForm.contacto_emergencia_telefono || undefined,
    });
    if (!result.success) {
      const errs: MascotaErrors = {};
      result.error.issues.forEach((e: any) => {
        const field = e.path[0] as keyof MascotaErrors;
        if (!errs[field]) errs[field] = e.message;
      });
      setMascotaErrors(errs);
      return;
    }
    setMascotaErrors({});
    openConfirm({
      title: "Registrar mascota",
      description: `¿Confirmar el registro de ${mascotaForm.nombre}?`,
      variant: "default",
      confirmLabel: "Sí, registrar",
      onConfirm: async () => { await crearMascota(); },
    });
  };

  // ── Formulario de mascota (reutilizable) ──────────────────────────────────
  const formMascota = (
    <div className="grid gap-3 py-1">
      {clienteNombre && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <UserCheck className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary truncate">{clienteNombre}</p>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Nombre de la mascota *</Label>
        <Input
          className={`rounded-xl h-10 ${mascotaErrors.nombre ? "border-destructive" : ""}`}
          placeholder="Luna"
          value={mascotaForm.nombre}
          onChange={(e) => setMascotaForm({ ...mascotaForm, nombre: e.target.value })}
        />
        {mascotaErrors.nombre && <p className="text-xs text-destructive">{mascotaErrors.nombre}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Sexo</Label>
          <Select
            value={mascotaForm.sexo}
            onValueChange={(v) => setMascotaForm({ ...mascotaForm, sexo: v })}
          >
            <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Macho</SelectItem>
              <SelectItem value="H">Hembra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Fecha de nacimiento</Label>
          <Input
            className={`rounded-xl h-10 ${mascotaErrors.fecha_nacimiento ? "border-destructive" : ""}`}
            type="date"
            value={mascotaForm.fecha_nacimiento}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setMascotaForm({ ...mascotaForm, fecha_nacimiento: e.target.value })}
          />
          {mascotaErrors.fecha_nacimiento && <p className="text-xs text-destructive">{mascotaErrors.fecha_nacimiento}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Especie *</Label>
          <Select
            value={mascotaForm.especieId}
            onValueChange={(v) => setMascotaForm({ ...mascotaForm, especieId: v, id_raza_fk: '' })}
          >
            <SelectTrigger className={`rounded-xl h-10 ${mascotaErrors.especieId ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {especies.map((e) => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          {mascotaErrors.especieId && <p className="text-xs text-destructive">{mascotaErrors.especieId}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Raza</Label>
          <Select
            value={mascotaForm.id_raza_fk}
            onValueChange={(v) => setMascotaForm({ ...mascotaForm, id_raza_fk: v })}
            disabled={!mascotaForm.especieId}
          >
            <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {razasFiltradas.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between border rounded-xl px-4 py-2.5">
        <Label className="text-sm cursor-pointer">Esterilizado</Label>
        <Switch checked={mascotaForm.esterilizado} onCheckedChange={(v) => setMascotaForm({ ...mascotaForm, esterilizado: v })} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Características físicas</Label>
        <Input
          className={`rounded-xl h-10 ${mascotaErrors.caracteristicas_fisicas ? "border-destructive" : ""}`}
          placeholder="Pelaje dorado, collar rojo..."
          value={mascotaForm.caracteristicas_fisicas}
          onChange={(e) => setMascotaForm({ ...mascotaForm, caracteristicas_fisicas: e.target.value })}
        />
        {mascotaErrors.caracteristicas_fisicas && <p className="text-xs text-destructive">{mascotaErrors.caracteristicas_fisicas}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Tel. emergencia</Label>
          <Input
            className={`rounded-xl h-10 ${mascotaErrors.contacto_emergencia_telefono ? "border-destructive" : ""}`}
            placeholder="70012345"
            value={mascotaForm.contacto_emergencia_telefono}
            onChange={(e) => setMascotaForm({ ...mascotaForm, contacto_emergencia_telefono: e.target.value })}
          />
          {mascotaErrors.contacto_emergencia_telefono && <p className="text-xs text-destructive">{mascotaErrors.contacto_emergencia_telefono}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">URL de foto</Label>
          <Input className="rounded-xl h-10" placeholder="https://..." value={mascotaForm.foto_url}
            onChange={(e) => setMascotaForm({ ...mascotaForm, foto_url: e.target.value })} />
        </div>
      </div>
      <DialogFooter className="mt-2 gap-2">
        <Button variant="outline" className="rounded-xl" onClick={() => { setModo('elegir'); setClienteId(''); setClienteNombre(''); setBusquedaExistente(''); setStep('cliente'); }}>Atrás</Button>
        <Button className="rounded-xl" onClick={submitMascota} disabled={creandoMascota}>
          {creandoMascota && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Registrar Mascota
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            {modo === 'elegir'
              ? <><UserPlus className="h-5 w-5 text-primary" /> Nuevo Paciente</>
              : modo === 'nuevo'
              ? step === 'cliente'
                ? <><UserPlus className="h-5 w-5 text-primary" /> Nuevo Cliente</>
                : <><PawPrint className="h-5 w-5 text-primary" /> Registrar Mascota</>
              : step === 'mascota'
              ? <><PawPrint className="h-5 w-5 text-primary" /> Agregar Mascota</>
              : <><Search className="h-5 w-5 text-primary" /> Buscar Cliente</>
            }
          </DialogTitle>
        </DialogHeader>

        {/* ── MODO ELEGIR ── */}
        {modo === 'elegir' && (
          <div className="grid gap-3 py-2">
            <p className="text-sm text-muted-foreground">¿El cliente ya tiene una cuenta?</p>
            <button
              onClick={() => setModo('existente')}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Sí, ya tiene cuenta</p>
                <p className="text-xs text-muted-foreground mt-0.5">Buscar cliente y agregar nueva mascota</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
            <button
              onClick={() => setModo('nuevo')}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">No, es cliente nuevo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Crear cuenta y registrar mascota</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl w-full" onClick={handleClose}>Cancelar</Button>
            </DialogFooter>
          </div>
        )}

        {/* ── MODO EXISTENTE: buscar cliente ── */}
        {modo === 'existente' && step === 'cliente' && (
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Buscar cliente *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="rounded-xl h-10 pl-9" placeholder="Nombre o teléfono..."
                  value={busquedaExistente}
                  onChange={(e) => { setBusquedaExistente(e.target.value); setClienteId(''); setClienteNombre(''); }} />
              </div>
              {busquedaExistente.trim().length >= 2 && clientesFiltrados.length > 0 && !clienteId && (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                  {clientesFiltrados.slice(0, 5).map((c: any) => (
                    <button key={c.id} type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 text-sm"
                      onClick={() => { setClienteId(c.id.toString()); setClienteNombre(`${c.nombres} ${c.apellidos}`); setBusquedaExistente(`${c.nombres} ${c.apellidos}`); }}>
                      <span className="font-medium">{c.nombres} {c.apellidos}</span>
                      {c.telefono && <span className="text-xs text-muted-foreground ml-2">· {c.telefono}</span>}
                    </button>
                  ))}
                </div>
              )}
              {busquedaExistente.trim().length >= 2 && clientesFiltrados.length === 0 && !clienteId && (
                <p className="text-xs text-muted-foreground px-1">No se encontró ningún cliente.</p>
              )}
              {clienteId && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <UserCheck className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-medium text-primary">{clienteNombre} — seleccionado</p>
                </div>
              )}
            </div>
            <DialogFooter className="mt-2 gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setModo('elegir')}>Atrás</Button>
              <Button className="rounded-xl" disabled={!clienteId} onClick={() => setStep('mascota')}>
                Continuar
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── MODO EXISTENTE: form mascota ── */}
        {modo === 'existente' && step === 'mascota' && formMascota}

        {/* ── MODO NUEVO: form cliente ── */}
        {modo === 'nuevo' && step === 'cliente' && (
          <div className="grid gap-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nombres *</Label>
                <Input
                  className={`rounded-xl h-10 ${clienteErrors.nombres ? "border-destructive" : ""}`}
                  placeholder="Ana"
                  value={clienteForm.nombres}
                  onChange={(e) => setClienteForm({ ...clienteForm, nombres: e.target.value })}
                />
                {clienteErrors.nombres && <p className="text-xs text-destructive">{clienteErrors.nombres}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Apellidos *</Label>
                <Input
                  className={`rounded-xl h-10 ${clienteErrors.apellidos ? "border-destructive" : ""}`}
                  placeholder="García"
                  value={clienteForm.apellidos}
                  onChange={(e) => setClienteForm({ ...clienteForm, apellidos: e.target.value })}
                />
                {clienteErrors.apellidos && <p className="text-xs text-destructive">{clienteErrors.apellidos}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email *</Label>
              <Input
                className={`rounded-xl h-10 ${clienteErrors.email ? "border-destructive" : ""}`}
                type="email"
                placeholder="cliente@email.com"
                value={clienteForm.email}
                onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              />
              {clienteErrors.email && <p className="text-xs text-destructive">{clienteErrors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contraseña *</Label>
                <Input
                  className={`rounded-xl h-10 ${clienteErrors.password ? "border-destructive" : ""}`}
                  type="password"
                  placeholder="Min. 8 caracteres"
                  value={clienteForm.password}
                  onChange={(e) => setClienteForm({ ...clienteForm, password: e.target.value })}
                />
                {clienteErrors.password && <p className="text-xs text-destructive">{clienteErrors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teléfono</Label>
                <Input
                  className={`rounded-xl h-10 ${clienteErrors.telefono ? "border-destructive" : ""}`}
                  placeholder="6xxxxxxxx"
                  value={clienteForm.telefono}
                  onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                />
                {clienteErrors.telefono && <p className="text-xs text-destructive">{clienteErrors.telefono}</p>}
              </div>
            </div>
            <DialogFooter className="mt-2 gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setModo('elegir')}>Atrás</Button>
              <Button className="rounded-xl" onClick={submitCliente} disabled={creandoCliente}>
                {creandoCliente && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear y continuar
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── MODO NUEVO: form mascota ── */}
        {modo === 'nuevo' && step === 'mascota' && formMascota}

      </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}
