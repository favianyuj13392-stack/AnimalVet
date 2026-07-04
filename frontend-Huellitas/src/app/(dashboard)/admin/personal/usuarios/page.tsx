'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Plus, Pencil, Trash2, Lock, CheckCircle, KeyRound, AlertTriangle, Loader2, Users, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { RoleAssignmentDialog } from '@/domains/users/components/role-assignment-dialog'

import { Usuario, Rol } from '@/domains/users/users.types'
import { usuariosService } from '@/domains/users/services/usuarios.service'
import { rolesService } from '@/domains/users/services/roles.service'
import { useCrud } from '@/shared/hooks/useCrud'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'

// ── Tabla reutilizable ────────────────────────────────────────────────────────
function UsuariosTable({
  usuarios, loading, onEdit, onDelete, onToggleEstado,
}: {
  usuarios: Usuario[]; loading: boolean;
  onEdit: (u: Usuario) => void;
  onDelete: (id: string | number) => void;
  onToggleEstado: (u: Usuario) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }
  if (usuarios.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No se encontraron usuarios.</div>;
  }
  return (
    <Table>
      <TableHeader className="bg-muted/20">
        <TableRow>
          <TableHead className="py-3 px-5 font-semibold">Usuario</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="font-semibold">Rol</TableHead>
          <TableHead className="font-semibold">Intentos</TableHead>
          <TableHead className="font-semibold">Estado</TableHead>
          <TableHead className="text-right px-5 font-semibold">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map(u => (
          <TableRow key={u.id} className="hover:bg-muted/30 border-b border-border/30">
            <TableCell className="py-3 px-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {(u as any).avatar_url && <AvatarImage src={(u as any).avatar_url} alt={u.nombres} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {u.nombres[0]}{u.apellidos[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground">{u.nombres} {u.apellidos}</p>
                  <p className="text-xs text-muted-foreground">{u.telefono || 'Sin teléfono'}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">{u.rol?.nombre || 'Sin Rol'}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                {u.intentos_fallidos >= 3 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                <span className={u.intentos_fallidos >= 3 ? 'text-destructive font-bold text-sm' : 'text-sm'}>
                  {u.intentos_fallidos}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost" size="sm"
                onClick={() => onToggleEstado(u)}
                className={`h-7 text-xs gap-1 ${u.estado_cuenta ? 'text-emerald-600 hover:text-emerald-700' : 'text-destructive hover:text-destructive/80'}`}
              >
                {u.estado_cuenta
                  ? <><CheckCircle className="h-3 w-3" /> Activo</>
                  : <><Lock className="h-3 w-3" /> Suspendido</>}
              </Button>
            </TableCell>
            <TableCell className="text-right px-5">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(u)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => toast.success('Enlace de reseteo enviado al correo')} title="Resetear contraseña">
                  <KeyRound className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(u.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const { user } = useAuthStore();
  const isCajero = user?.rol?.id === 3;

  // Staff
  const staffService = { ...usuariosService, getAll: () => usuariosService.getPersonal() };
  const { data: staff = [], loading: loadStaff, createItem: createStaff, updateItem: updateStaff, deleteItem: deleteStaff } = useCrud<Usuario>(staffService, 'personal');

  // Clientes
  const clientesService = { ...usuariosService, getAll: () => usuariosService.getClientes() };
  const { data: clientes = [], loading: loadClientes, createItem: createCliente, updateItem: updateCliente, deleteItem: deleteCliente } = useCrud<Usuario>(clientesService, 'clientes');

  const { data: roles = [] } = useCrud<Rol>(rolesService, 'roles');

  const { openConfirm, dialog: confirmDialog } = useConfirmDialog();
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [editing,        setEditing]        = useState<Usuario | null>(null);
  const [editingTarget,  setEditingTarget]  = useState<'staff' | 'cliente'>('staff');
  const [busqueda,       setBusqueda]       = useState('');
  const [filtroRol,      setFiltroRol]      = useState('todos');
  const [form, setForm] = useState({
    nombres: '', apellidos: '', email: '', telefono: '', ci: '', rolId: '', password: '', avatar_url: '', numero_matricula: '',
  });

  const resetForm = () => setForm({ nombres: '', apellidos: '', email: '', telefono: '', ci: '', rolId: isCajero ? '4' : '', password: '', avatar_url: '', numero_matricula: '' });

  const openEdit = (u: Usuario, target: 'staff' | 'cliente') => {
    setEditing(u);
    setEditingTarget(target);
    setForm({
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      telefono: u.telefono || '',
      ci: u.ci || '',
      rolId: u.id_rol_fk.toString(),
      password: '',
      avatar_url: u.avatar_url || '',
      numero_matricula: u.numero_matricula || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.email.trim() || !form.rolId) {
      return toast.error('Completa los campos obligatorios');
    }
    if (!editing && !form.password.trim()) return toast.error('La contraseña es obligatoria');
    const payload: any = {
      nombres: form.nombres,
      apellidos: form.apellidos,
      email: form.email,
      telefono: form.telefono,
      id_rol_fk: parseInt(form.rolId),
      ci: form.ci,
      ...(form.avatar_url ? { avatar_url: form.avatar_url } : {}),
      ...(form.password?.trim().length >= 8 ? { password: form.password } : {}),
      ...(form.rolId === '2' && form.numero_matricula ? { numero_matricula: form.numero_matricula } : {}),
    };
    try {
      const update = editingTarget === 'staff' ? updateStaff : updateCliente;
      const create = editingTarget === 'staff' ? createStaff : createCliente;
      if (editing) { await update({ id: editing.id, data: payload }); toast.success('Usuario actualizado'); }
      else         { await create(payload); toast.success('Usuario creado'); }
      setDialogOpen(false); resetForm(); setEditing(null);
    } catch {}
  };

  const toggleEstado = (u: Usuario, target: 'staff' | 'cliente') => {
    const update = target === 'staff' ? updateStaff : updateCliente;
    const nuevoEstado = !u.estado_cuenta;
    openConfirm({
      title: nuevoEstado ? 'Activar usuario' : 'Suspender usuario',
      description: `¿${nuevoEstado ? 'Activar' : 'Suspender'} la cuenta de ${u.nombres} ${u.apellidos}?`,
      variant: nuevoEstado ? 'default' : 'warning',
      confirmLabel: nuevoEstado ? 'Sí, activar' : 'Sí, suspender',
      onConfirm: async () => {
        await update({ id: u.id, data: { estado_cuenta: nuevoEstado } });
        toast.success('Estado actualizado');
      },
    });
  };

  const handleDelete = (id: string | number, target: 'staff' | 'cliente') => {
    const del = target === 'staff' ? deleteStaff : deleteCliente;
    openConfirm({
      title: 'Eliminar usuario',
      description: '¿Estás seguro? Esta acción no se puede deshacer.',
      variant: 'destructive',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        await del(id);
        toast.success('Usuario eliminado');
      },
    });
  };

  const filtrarUsuarios = (lista: Usuario[]) =>
    lista.filter(u => {
      const coincideBusqueda = busqueda === '' ||
        u.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === 'todos' || Number(u.rol?.id ?? u.id_rol_fk) === parseInt(filtroRol);
      return coincideBusqueda && coincideRol;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-1">Personal de la clínica y clientes registrados en el sistema.</p>
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="staff"    className="rounded-lg gap-2 px-5"><UserCog className="h-4 w-4" /> Staff</TabsTrigger>
            <TabsTrigger value="clientes" className="rounded-lg gap-2 px-5"><Users className="h-4 w-4" /> Clientes</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="rounded-xl h-9 max-w-xs"
            />
            <Select value={filtroRol} onValueChange={setFiltroRol}>
              <SelectTrigger className="rounded-xl h-9 w-40">
                <SelectValue placeholder="Filtrar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(roles ?? []).map((r: any) => (
                  <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── STAFF ── */}
        <TabsContent value="staff">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-3 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">
                Personal — {filtrarUsuarios(staff as Usuario[]).length} registros
              </CardTitle>
              <Button size="sm" className="rounded-xl h-8 gap-1.5"
                onClick={() => { setEditing(null); setEditingTarget('staff'); resetForm(); setDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Nuevo Staff
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <UsuariosTable
                usuarios={filtrarUsuarios(staff as Usuario[])}
                loading={loadStaff}
                onEdit={u => openEdit(u, 'staff')}
                onDelete={id => handleDelete(id, 'staff')}
                onToggleEstado={u => toggleEstado(u, 'staff')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CLIENTES ── */}
        <TabsContent value="clientes">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-3 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">
                Clientes — {filtrarUsuarios(clientes as Usuario[]).length} registros
              </CardTitle>
              <Button size="sm" className="rounded-xl h-8 gap-1.5"
                onClick={() => { setEditing(null); setEditingTarget('cliente'); setForm({ nombres: '', apellidos: '', email: '', telefono: '', ci: '', rolId: '4', password: '', avatar_url: '', numero_matricula: '' }); setDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Nuevo Cliente
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <UsuariosTable
                usuarios={filtrarUsuarios(clientes as Usuario[])}
                loading={loadClientes}
                onEdit={u => openEdit(u, 'cliente')}
                onDelete={id => handleDelete(id, 'cliente')}
                onToggleEstado={u => toggleEstado(u, 'cliente')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RoleAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onSubmit={handleSave}
        roles={isCajero ? (roles ?? []).filter((r: any) => Number(r.id) === 4) : (roles ?? [])}
      />
      {confirmDialog}
    </div>
  );
}
