'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useCrud } from "@/shared/hooks/useCrud";
import { usuariosService } from "@/domains/users/services/usuarios.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { Usuario } from "@/domains/users/users.types";

interface UrgenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UrgenciaModal({ open, onOpenChange }: UrgenciaModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Cargar veterinarios reales de la base de datos
  const { data: usuarios, loading: loadingVets } = useCrud<Usuario>(usuariosService, "usuarios");
  const veterinarios = (usuarios ?? []).filter(u => u.id_rol_fk === 2);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    sexo: "M",
    especie_nombre: "",
    contacto_nombre: "",
    contacto_telefono: "",
    id_veterinario: "",
  });

  // Pre-seleccionar el veterinario logueado si corresponde
  useEffect(() => {
    if (user && user.rol?.id === 2 && !form.id_veterinario) {
      setForm((prev) => ({ ...prev, id_veterinario: user.id.toString() }));
    } else if (veterinarios.length > 0 && !form.id_veterinario) {
      const primero = veterinarios[0];
      if (primero?.id != null) {
        setForm((prev) => ({ ...prev, id_veterinario: primero.id.toString() }));
      }
    }
  }, [user, veterinarios, form.id_veterinario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.especie_nombre) {
      return toast.error("La especie es obligatoria (Canino o Felino)");
    }
    if (!form.contacto_nombre.trim()) {
      return toast.error("El nombre del contacto es obligatorio");
    }
    if (!form.contacto_telefono.trim()) {
      return toast.error("El teléfono del contacto es obligatorio");
    }
    if (!form.id_veterinario) {
      return toast.error("Debe asignar un veterinario para la urgencia");
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim() || "Desconocido Urgente",
        sexo: form.sexo,
        especie_nombre: form.especie_nombre,
        contacto_nombre: form.contacto_nombre.trim(),
        contacto_telefono: form.contacto_telefono.trim(),
        id_veterinario: form.id_veterinario,
      };

      const response = await mascotasService.preRegistroUrgencia(payload);
      toast.success(response.mensaje || "Pre-registro de urgencia creado con éxito.");
      onOpenChange(false);
      
      // Limpiar formulario
      setForm({
        nombre: "",
        sexo: "M",
        especie_nombre: "",
        contacto_nombre: "",
        contacto_telefono: "",
        id_veterinario: user?.rol?.id === 2 ? user.id.toString() : "",
      });

      // Redirigir directamente a la consulta médica activa
      router.push(response.redirectUrl);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Ocurrió un error al registrar la urgencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive mb-1">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            <DialogTitle className="text-xl font-black tracking-tight">Atención Inmediata de Urgencia</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra una mascota temporal y genera una cita express en un solo paso. Los datos oficiales del dueño se podrán regularizar después.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          {/* Fila: Nombre mascota y Sexo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="urg-nombre" className="text-xs font-bold text-card-foreground">Nombre Mascota</Label>
              <Input
                id="urg-nombre"
                placeholder="Ej. Bobby (Opcional)"
                className="rounded-xl h-10 border-border/60 bg-card/40 focus:ring-destructive/30"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="urg-sexo" className="text-xs font-bold text-card-foreground">Sexo</Label>
              <Select value={form.sexo} onValueChange={(val) => setForm({ ...form, sexo: val })}>
                <SelectTrigger id="urg-sexo" className="rounded-xl h-10 border-border/60 bg-card/40">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="F">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Especie (Mandatorio) */}
          <div className="space-y-1.5">
            <Label htmlFor="urg-especie" className="text-xs font-bold text-card-foreground">Especie *</Label>
            <Select value={form.especie_nombre} onValueChange={(val) => setForm({ ...form, especie_nombre: val })}>
              <SelectTrigger id="urg-especie" className="rounded-xl h-10 border-border/60 bg-card/40">
                <SelectValue placeholder="Selecciona especie para cálculo de dosis" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Canino">Canino / Perro</SelectItem>
                <SelectItem value="Felino">Felino / Gato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-2 text-xs font-medium text-destructive/80 mb-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>La especie define las alertas de dosificación médica en recetas y anestésicos.</span>
          </div>

          {/* Contacto Temporal / Persona que lo trae */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="urg-contacto" className="text-xs font-bold text-card-foreground">Nombre Acompañante *</Label>
              <Input
                id="urg-contacto"
                placeholder="Nombre del tutor/rescatista"
                required
                className="rounded-xl h-10 border-border/60 bg-card/40"
                value={form.contacto_nombre}
                onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="urg-telefono" className="text-xs font-bold text-card-foreground">Teléfono Acompañante *</Label>
              <Input
                id="urg-telefono"
                placeholder="Ej. 987654321"
                required
                className="rounded-xl h-10 border-border/60 bg-card/40"
                value={form.contacto_telefono}
                onChange={(e) => setForm({ ...form, contacto_telefono: e.target.value })}
              />
            </div>
          </div>

          {/* Veterinario Asignado */}
          <div className="space-y-1.5">
            <Label htmlFor="urg-vet" className="text-xs font-bold text-card-foreground">Médico Asignado *</Label>
            {loadingVets ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando médicos...
              </div>
            ) : (
              <Select value={form.id_veterinario} onValueChange={(val) => setForm({ ...form, id_veterinario: val })}>
                <SelectTrigger id="urg-vet" className="rounded-xl h-10 border-border/60 bg-card/40">
                  <SelectValue placeholder="Asigna un médico de guardia" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {veterinarios.map((vet) => (
                    <SelectItem key={vet.id} value={vet.id.toString()}>
                      Dr(a). {vet.nombres} {vet.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-border/60 hover:bg-muted"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-md shadow-destructive/20 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creando Ficha...
                </>
              ) : (
                "Ingresar a Box Clínico"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
