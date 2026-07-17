"use client";

import React, { useState } from "react";
import {
  Search,
  FileText,
  User,
  Calendar,
  ChevronRight,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import Link from "next/link";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { AlertTriangle } from "lucide-react";

// Imports for backend data
import { useCrud } from "@/shared/hooks/useCrud";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { speciesService } from "@/domains/pets/services/especies.service";
import { breedsService } from "@/domains/pets/services/breeds.service";
import { Mascota, Especie, Raza } from "@/domains/pets/pets.types";
import { usuariosService } from "@/domains/users/services/usuarios.service";
import { Usuario } from "@/domains/users/users.types";
import { citasService } from "@/domains/appointments/services/citas.service";
import { Cita } from "@/domains/appointments/appointments.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

const safeDateString = (dateVal: any): string => {
  if (!dateVal) return "—";
  try {
    if (typeof dateVal === 'string' && dateVal.length === 10 && dateVal.includes('-')) {
      const [year, month, day] = dateVal.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    const hasTime = typeof dateVal === 'string' ? dateVal.includes('T') || dateVal.includes(':') : true;
    if (hasTime) {
      return d.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    return "—";
  }
};

export default function DirectorioExpedientesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;

  // 1. Cargar datos base
  const { data: mascotas, loading: loadingMascotas } = useCrud<Mascota>(mascotasService, "mascotas");
  const { data: especies } = useCrud<Especie>(speciesService, "especies");
  const { data: razas } = useCrud<Raza>(breedsService, "razas");
  const { data: usuarios } = useCrud<Usuario>(usuariosService, "usuarios");
  
  // 2. Cargar citas para saber quiénes son mis pacientes y cuándo fue su última visita
  const expedientesCitasService = {
    ...citasService,
    getAll: () => citasService.getAll(isAdmin ? undefined : { veterinarioId: user?.id })
  };
  const { data: appointments, loading: loadingCitas } = useCrud<Cita>(
    expedientesCitasService,
    isAdmin ? "citas" : `citas-vet-expediente-${user?.id}`
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("todas");

  // 3. Buscador global libre: Doctor y admin ven todas las mascotas del sistema
  const filteredMascotasList = React.useMemo(() => {
    return mascotas ?? [];
  }, [mascotas]);

  if (loadingMascotas || loadingCitas) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando directorio de pacientes...</p>
      </div>
    );
  }

  // 4. Mapear datos ricos para las tarjetas
  const pacientesList = (filteredMascotasList ?? []).map((m) => {
    const duenoObj = m.dueno || (usuarios ?? []).find(u => String(u.id) === String(m.id_dueno_fk));
    const duenoName = duenoObj ? `${duenoObj.nombres} ${duenoObj.apellidos}` : "Sin Propietario";
    const breedObj = m.raza || (razas ?? []).find(r => Number(r.id) === Number(m.id_raza_fk));
    const speciesObj = breedObj?.especie || (especies ?? []).find(e => Number(e.id) === Number(breedObj?.id_especie_fk));

    // Buscar la última cita de este paciente
    const petAppointments = (appointments ?? []).filter(c => String(c.mascota?.id || c.id_mascota_fk) === String(m.id));
    const lastAppt = petAppointments.sort((a, b) => new Date(b.fecha_hora_inicio).getTime() - new Date(a.fecha_hora_inicio).getTime())[0];

    return {
      id: m.id,
      mascota: m.nombre,
      foto_url: m.foto_url ?? null,
      especie: speciesObj?.nombre || "Desconocida",
      raza: breedObj?.nombre || "Desconocida",
      chip: m.hash_qr_identidad || `QR-${m.id.substring(0, 8).toUpperCase()}`,
      dueno: duenoName,
      ultimaVisita: lastAppt ? safeDateString(lastAppt.fecha_hora_inicio) : "Sin visitas registradas",
    };
  });

  const especiesUnicas = Array.from(new Set(pacientesList.map(p => p.especie).filter(Boolean)));

  const filteredPacientes = pacientesList.filter((p) => {
    const coincideBusqueda =
      p.mascota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dueno.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.chip.toLowerCase().includes(searchQuery.toLowerCase());
    const coincideEspecie = filtroEspecie === "todas" || p.especie === filtroEspecie;
    return coincideBusqueda && coincideEspecie;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* HEADER TIPO GLASSMORPHISM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-md shadow-sm">
        <div className="flex-1 w-full">
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 flex w-fit items-center gap-1 font-bold">
            <FolderOpen className="h-3 w-3 text-primary" /> 
            {isAdmin ? "Directorio Global" : "Mis Pacientes"}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Directorio Clínico
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl">
            {isAdmin 
              ? "Accede a todos los expedientes clínicos de la veterinaria para auditoría operativa y revisión de procesos." 
              : "Busca a tus pacientes activos para revisar su historial médico, añadir notas, recetas o adjuntar nuevos análisis."}
          </p>
        </div>

        {/* BUSCADOR + FILTRO ESPECIE */}
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente, dueño o código QR..."
              className="pl-12 rounded-2xl h-12 bg-background border-border/60 shadow-sm text-base font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
            <SelectTrigger className="w-36 h-12 rounded-2xl shrink-0">
              <SelectValue placeholder="Especie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {especiesUnicas.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl items-center font-semibold text-sm shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Modo Administrador: Puedes auditar historiales y estadísticas, pero no tienes permisos para redactar nuevas consultas ni modificar expedientes.</span>
        </div>
      )}

      {/* GRID DE PACIENTES */}
      {filteredPacientes.length === 0 ? (
        <Card className="rounded-3xl border-border/50 shadow-sm bg-card/25 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-bold text-foreground">No se encontraron pacientes</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Intenta usar otros términos de búsqueda o asegúrate de tener pacientes asignados a tu nombre.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPacientes.map((p) => (
            <Card 
              key={p.id} 
              className="group rounded-3xl border-border/40 shadow-sm bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all hover:shadow-md hover:-translate-y-1 overflow-hidden flex flex-col"
            >
              <CardContent className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm group-hover:border-primary/40 transition-colors">
                    <AvatarImage src={p.foto_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.mascota}`} />
                    <AvatarFallback className="font-bold text-primary bg-primary/10">
                      {p.mascota.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="secondary" className="font-mono text-[10px] bg-muted/50">
                    {p.chip}
                  </Badge>
                </div>
                
                <div className="space-y-1 mb-4">
                  <h3 className="text-xl font-black text-foreground leading-none">{p.mascota}</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {p.especie} • {p.raza}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-card-foreground truncate">{p.dueno}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Última visita: <strong className="text-card-foreground">{p.ultimaVisita}</strong></span>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 bg-muted/10 border-t border-border/30 mt-auto">
                <Button 
                  asChild 
                  className="w-full rounded-xl font-bold shadow-sm"
                  variant={isAdmin ? "secondary" : "default"}
                >
                  {/* AQUÍ ESTÁ EL ENLACE AL NIVEL 2 */}
                  <Link href={`/vet/expediente/${p.id}`}>
                    {isAdmin ? "Auditar Expediente" : "Abrir Expediente Clínico"}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}