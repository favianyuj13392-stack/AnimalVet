"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Stethoscope, Loader2 } from "lucide-react";
import { format, getDay } from "date-fns";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Calendar } from "@/shared/components/ui/calendar";
import { SelectorHorario } from "./SelectorHorario";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { servicesService, Servicio } from "@/domains/billing/services/services.service";
import { usuariosService } from "@/domains/users/services/usuarios.service";
import { citasService } from "@/domains/appointments/services/citas.service";
import { Mascota } from "@/domains/pets/pets.types";
import { Usuario } from "@/domains/users/users.types";
import { useAuthStore } from "@/shared/store/useAuthStore";
import api from "@/shared/lib/axios";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-border/40 my-5" />;
}

export function BookingWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // ── ESTADOS ÚNICOS Y CENTRALIZADOS ──
  const [mascotaSel, setMascotaSel]         = useState<Mascota | null>(null);
  const [servicioSel, setServicioSel]       = useState<Servicio | null>(null);
  const [veterinarioSel, setVeterinarioSel] = useState<Usuario | null>(null);
  const [fechaSel, setFechaSel]             = useState<Date | undefined>(undefined);
  const [horaSel, setHoraSel]               = useState<string>("");
  const [motivo, setMotivo]                 = useState<string>("");

  // Convertimos la fecha del calendario a string (YYYY-MM-DD) para mandarla al SelectorHorario
  const fechaFormateada = fechaSel ? format(fechaSel, "yyyy-MM-dd") : "";

  const { data: mascotas = [], isLoading: loadMascotas } = useQuery<Mascota[]>({
    queryKey: ["mis-mascotas", user?.id],
    queryFn: () => mascotasService.getMisMascotas(user!.id),
    enabled: !!user?.id,
  });

  const { data: servicios = [], isLoading: loadServicios } = useQuery<Servicio[]>({
    queryKey: ["servicios"],
    queryFn: () => servicesService.getAll(),
  });

  const { data: personal = [], isLoading: loadPersonal } = useQuery<Usuario[]>({
    queryKey: ["personal"],
    queryFn: () => usuariosService.getPersonal(),
  });

  const veterinarios = personal.filter((u) => Number(u.id_rol_fk) === 2);

  // Días de atención del vet seleccionado (1=Lun ... 7=Dom)
  const { data: horariosVet = [] } = useQuery({
    queryKey: ["horarios-vet", veterinarioSel?.id],
    queryFn: async () => {
      const { data } = await api.get(`/horarios-atencion/veterinario/${veterinarioSel!.id}`);
      return data as { dia_semana: number; activo: boolean }[];
    },
    enabled: !!veterinarioSel,
  });

  // Días de la semana que el vet NO atiende (para deshabilitarlos en el calendario)
  // date-fns: 0=Dom, 1=Lun...6=Sab — back: 1=Lun...7=Dom
  const diasQueAtiende = horariosVet
    .filter((h) => h.activo)
    .map((h) => h.dia_semana); // 1-7 (back)

  const isDiaDeshabilitado = (date: Date): boolean => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (!veterinarioSel || diasQueAtiende.length === 0) return false;
    // Convertir date-fns day (0=Dom) al formato del back (1=Lun, 7=Dom)
    const dow = getDay(date); // 0=Dom, 1=Lun...6=Sab
    const backDow = dow === 0 ? 7 : dow; // 1=Lun...7=Dom
    return !diasQueAtiende.includes(backDow);
  };

  const { mutateAsync: crearCita, isPending: creando } = useMutation({
    mutationFn: (payload: any) => citasService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-citas-cliente"] });
      toast.success("Cita agendada correctamente", {
        description: `${fechaSel?.toLocaleDateString("es", {
          weekday: "long", day: "numeric", month: "long",
        })} a las ${horaSel}h`,
      });
      router.push("/cliente/inicio");
    },
  });

  const handleConfirm = async () => {
    if (!mascotaSel)    { toast.warning("Selecciona una mascota");          return; }
    if (!servicioSel)   { toast.warning("Selecciona un servicio");          return; }
    if (!veterinarioSel){ toast.warning("Selecciona un veterinario");       return; }
    if (!fechaSel)      { toast.warning("Selecciona una fecha");            return; }
    if (!horaSel)       { toast.warning("Selecciona un horario");           return; }
    if (!motivo.trim()) { toast.warning("Describe el motivo de la visita"); return; }

    await crearCita({
      fecha_hora_inicio: `${fechaFormateada}T${horaSel}:00`,
      motivo_cita:       motivo.trim(),
      origen_reserva:    "WEB",
      id_mascota_fk:     String(mascotaSel.id),
      id_veterinario_fk: String(veterinarioSel.id),
      id_servicio_fk:    Number(servicioSel.id),
    });
  };

  if (loadMascotas || loadServicios || loadPersonal) {
    return (
      <div className="h-full flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden flex">

      {/* ── COLUMNA IZQUIERDA ────────────────────────────────────────────────── */}
      <div className="w-1/2 border-r border-border/40 overflow-y-auto p-6">

        {/* Mascota */}
        <SectionLabel>Mascota</SectionLabel>
        {mascotas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin mascotas registradas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {mascotas.map((m) => {
              const sel = mascotaSel?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMascotaSel(m)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all hover:-translate-y-0.5 ${
                    sel
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {(m as any).foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(m as any).foto_url} alt={m.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {m.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{m.nombre}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {m.raza?.especie?.nombre ?? "Mascota"}
                    </p>
                  </div>
                  {sel && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}

        <Divider />

        {/* Servicio */}
        <SectionLabel>Servicio</SectionLabel>
        <div className="space-y-1.5">
          {servicios.filter((s) => s.requiereVeterinario !== false).map((s) => {
            const sel = servicioSel?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setServicioSel(s)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  sel
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30 hover:bg-muted/20"
                }`}
              >
                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-border/40 bg-muted flex items-center justify-center">
                  {(s as any).imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(s as any).imagen_url} alt={s.nombre} className="w-full h-full object-cover" />
                  ) : sel ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Number(s.duracion_minutos)} min
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0">
                  {Number(s.precio)} Bs
                </span>
              </button>
            );
          })}
        </div>

        <Divider />

        {/* Veterinario */}
        <SectionLabel>Veterinario</SectionLabel>
        <div className="space-y-1.5">
          {veterinarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin veterinarios disponibles.</p>
          ) : (
            veterinarios.map((v) => {
              const sel = veterinarioSel?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => { setVeterinarioSel(v); setFechaSel(undefined); setHoraSel(""); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    sel
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {(v as any).avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(v as any).avatar_url} alt={v.nombres} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {v.nombres.charAt(0)}{v.apellidos.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {v.nombres} {v.apellidos}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {v.rol?.nombre ?? "Veterinario"}
                    </p>
                  </div>
                  {sel && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── COLUMNA DERECHA ──────────────────────────────────────────────────── */}
      <div className="w-1/2 overflow-y-auto p-6 flex flex-col gap-0">

        {/* Fecha */}
        <SectionLabel>Fecha</SectionLabel>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={fechaSel}
            onSelect={(d) => { setFechaSel(d); setHoraSel(""); }}
            disabled={isDiaDeshabilitado}
            className="rounded-md p-0"
          />
          {veterinarioSel && diasQueAtiende.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Solo se muestran los días en que atiende el veterinario seleccionado
            </p>
          )}
        </div>

        <Divider />

        {/* ── AQUÍ PASA LA MAGIA: EL SELECTOR CONECTADO A TUS ESTADOS ── */}
        <SelectorHorario 
          veterinarioId={veterinarioSel ? String(veterinarioSel.id) : ""} 
          fecha={fechaFormateada} 
          horaSeleccionada={horaSel}
          onSelectHora={(h) => setHoraSel(h)} 
        />

        <Divider />

        {/* Motivo */}
        <SectionLabel>
          Motivo de la visita <span className="text-destructive normal-case">*</span>
        </SectionLabel>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Describe brevemente los sintomas o el motivo de la consulta..."
          className="resize-none rounded-lg text-sm border-border/50 min-h-24"
          rows={4}
        />

        <Divider />

        {/* Confirmar */}
        <Button
          onClick={handleConfirm}
          disabled={creando}
          size="lg"
          className="w-full rounded-lg h-11 text-sm font-semibold"
        >
          {creando
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Agendando...</>
            : "Confirmar cita"
          }
        </Button>
      </div>
    </div>
  );
}