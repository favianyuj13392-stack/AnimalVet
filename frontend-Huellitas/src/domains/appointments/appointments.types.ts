import { Mascota } from "@/domains/pets/pets.types";
import { Usuario } from "@/domains/users/users.types";
import { Servicio } from "@/domains/billing/services/services.service";

export interface Cita {
  id: string;
  fecha_hora_inicio: string | Date;
  motivo_cita: string;
  origen_reserva: string; // 'WEB' | 'BOT_WA' | 'RECEPCION'
  estado?: string;        // lo asigna el backend al crear
  duracion_minutos?: number;
  tipo_prioridad?: string;
  requiere_confirmacion?: boolean;
  id_mascota_fk: string;
  id_veterinario_fk: string;
  id_servicio_fk: number;
  mascota?: Mascota;
  veterinario?: Usuario;
  servicio?: Servicio;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  motivo_cancelacion?: string;
}
