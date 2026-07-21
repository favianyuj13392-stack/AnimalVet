"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Stethoscope,
  ArrowLeft,
  CheckCircle,
  Save,
  Syringe,
  AlertTriangle,
  Paperclip,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { citasService } from "@/domains/appointments/services/citas.service";
import { Cita } from "@/domains/appointments/appointments.types";
import { historialClinicoService } from "@/domains/clinical/services/historial-clinico.service";
import { vaccinesCatalogService } from "@/domains/clinical/services/vaccines-catalog.service";
import { productosService } from "@/domains/inventory/services/productos.service";
import { lotesService } from "@/domains/billing/services/lotes.service";
import { patologiasService } from "@/domains/clinical/services/patologias.service";
import { mascotasService } from "@/domains/pets/services/mascotas.service";

// Components
import { TriageForm } from "@/domains/clinical/components/triage-form";
import { HistorialDrawer } from "@/domains/clinical/components/historial-drawer";
import { ClinicalNotesForm } from "@/domains/clinical/components/clinical-notes-form";
import { PrescriptionBuilder } from "@/domains/clinical/components/prescription-builder";
import { FileDropzone } from "@/domains/clinical/components/file-dropzone";


export default function ConsultaActivaPage() {
  const { id_cita } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.id === 1;

  // --- ESTADOS (deben ir ANTES de los useQuery que los usan) ---
  const [peso, setPeso] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [receta, setReceta] = useState<any[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [aplicarVacuna, setAplicarVacuna] = useState("ninguna");
  const [ordenarHospitalizar, setOrdenarHospitalizar] = useState(false);
  const [costoPorDia, setCostoPorDia] = useState("");
  const [historialOpen, setHistorialOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Nuevos Estados de Ficha Clínica
  const [turno, setTurno] = useState("Mañana");
  const [mucosas, setMucosas] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [presuntivas, setPresuntivas] = useState<any[]>([]);
  const [definitivas, setDefinitivas] = useState<any[]>([]);
  


  // Artículos de Ingreso para Hospitalización
  const [articulos, setArticulos] = useState<{ descripcion: string; cantidad: number; observacion?: string }[]>([]);
  const [artDesc, setArtDesc] = useState("");
  const [artCant, setArtCant] = useState("1");
  const [artObs, setArtObs] = useState("");

  const [examEcografia, setExamEcografia] = useState(false);
  const [examRayosX, setExamRayosX] = useState(false);
  const [examHemograma, setExamHemograma] = useState(false);
  const [examQuimicaSanguinea, setExamQuimicaSanguinea] = useState(false);
  const [examOtros, setExamOtros] = useState(false);
  const [examResultados, setExamResultados] = useState("");

  // --- QUERIES ---
  const searchParams = useSearchParams();
  const citaQueryId = searchParams.get("cita");
  const mascotaQueryId = searchParams.get("mascota");

  // A. Redirección si se pasa ?cita=...
  React.useEffect(() => {
    if (id_cita === "nueva" && citaQueryId) {
      router.replace(`/vet/consulta/${citaQueryId}`);
    }
  }, [id_cita, citaQueryId, router]);

  // B. Creación de cita express automática si se pasa ?mascota=...
  const [creatingCitaAuto, setCreatingCitaAuto] = useState(false);
  React.useEffect(() => {
    const initCitaAuto = async () => {
      if (id_cita === "nueva" && !citaQueryId && mascotaQueryId && user && !creatingCitaAuto) {
        setCreatingCitaAuto(true);
        try {
          const newCita = await citasService.createExpress(mascotaQueryId as string, 1);
          router.replace(`/vet/consulta/${newCita.id}`);
        } catch (err) {
          console.error("Error al crear cita automática:", err);
          toast.error("Error al iniciar la consulta médica");
        }
      }
    };
    initCitaAuto();
  }, [id_cita, citaQueryId, mascotaQueryId, user, creatingCitaAuto, router]);

  // C. Consulta de Mascota Directa (si no hay cita) para mostrar nombre/dueño mientras se redirige/procesa
  const { data: directMascota, isLoading: loadingMascota } = useQuery({
    queryKey: ["mascota-direct", mascotaQueryId],
    queryFn: () => mascotasService.getOne(mascotaQueryId as string),
    enabled: id_cita === "nueva" && !!mascotaQueryId,
  });

  const { data: appointment, isLoading: loadingCita } = useQuery<Cita>({
    queryKey: ["cita", id_cita],
    queryFn: () => citasService.getOne(id_cita as string),
    enabled: !!id_cita && id_cita !== "nueva",
  });

  const { data: existingHistorial, isLoading: loadingHistorial } = useQuery({
    queryKey: ["historial-cita", id_cita],
    queryFn: () => historialClinicoService.getByCita(id_cita as string),
    enabled: !!id_cita && id_cita !== "nueva",
  });

  React.useEffect(() => {
    if (existingHistorial) {
      if (existingHistorial.peso_actual_kg) setPeso(existingHistorial.peso_actual_kg.toString());
      if (existingHistorial.temperatura_c) setTemperatura(existingHistorial.temperatura_c.toString());
      if (existingHistorial.frecuencia_cardiaca) setFc(existingHistorial.frecuencia_cardiaca.toString());
      if (existingHistorial.frecuencia_respiratoria) setFr(existingHistorial.frecuencia_respiratoria.toString());
      if (existingHistorial.diagnostico) setDiagnostico(existingHistorial.diagnostico);
      if (existingHistorial.sintomas) setSintomas(existingHistorial.sintomas);
      if (existingHistorial.notas_internas) setIndicaciones(existingHistorial.notas_internas);
      if (existingHistorial.turno) setTurno(existingHistorial.turno);
      if (existingHistorial.mucosas) setMucosas(existingHistorial.mucosas);
      if (existingHistorial.anamnesis) setAnamnesis(existingHistorial.anamnesis);
      if (existingHistorial.exam_ecografia !== undefined) setExamEcografia(existingHistorial.exam_ecografia);
      if (existingHistorial.exam_rayos_x !== undefined) setExamRayosX(existingHistorial.exam_rayos_x);
      if (existingHistorial.exam_hemograma !== undefined) setExamHemograma(existingHistorial.exam_hemograma);
      if (existingHistorial.exam_quimica_sanguinea !== undefined) setExamQuimicaSanguinea(existingHistorial.exam_quimica_sanguinea);
      if (existingHistorial.exam_otros !== undefined) setExamOtros(existingHistorial.exam_otros);
      if (existingHistorial.exam_resultados) setExamResultados(existingHistorial.exam_resultados);

      // Receta
      if (existingHistorial.recetas && existingHistorial.recetas.length > 0) {
        const firstReceta = existingHistorial.recetas[0];
        const mappedDetalles = (firstReceta.detalles || []).map((d: any) => ({
          id: d.id,
          id_producto_fk: d.producto?.id || null,
          medicamento_texto: d.medicamento_texto || d.producto?.nombre || "",
          dosis: d.dosis,
          frecuencia: d.frecuencia,
          duracion_dias: d.duracion_dias,
          cantidad: d.cantidad,
          observaciones: d.observacion || "",
          nombre: d.producto?.nombre || d.medicamento_texto || "",
        }));
        setReceta(mappedDetalles);
      }

      // Patologías (presuntivas y definitivas)
      if (existingHistorial.patologias) {
        const pres = existingHistorial.patologias
          .filter((p: any) => p.tipo === "PRESUNTIVA")
          .map((p: any) => p.patologia);
        const def = existingHistorial.patologias
          .filter((p: any) => p.tipo === "DEFINITIVA")
          .map((p: any) => p.patologia);
        setPresuntivas(pres);
        setDefinitivas(def);
      }
    }
  }, [existingHistorial]);

  const { data: dbProducts } = useQuery({
    queryKey: ["productos-catalogo"],
    queryFn: () => productosService.getAll().catch(() => []),
  });

  const { data: dbPathologies = [] } = useQuery({
    queryKey: ["plantillas-patologia"],
    queryFn: () => historialClinicoService.getPlantillasPatologia().catch(() => []),
  });

  const { data: dbPatologiasMaster = [] } = useQuery({
    queryKey: ["patologias-catalogo"],
    queryFn: () => patologiasService.getAll().catch(() => []),
  });

  const { data: dbVaccines = [] } = useQuery({
    queryKey: ["vacunas-catalogo"],
    queryFn: () => vaccinesCatalogService.getAll().catch(() => []),
  });

  const { data: dbServicios = [] } = useQuery({
    queryKey: ["servicios-catalogo"],
    queryFn: () => import("@/domains/billing/services/services.service")
      .then(m => m.servicesService.getAll()).catch(() => []),
  });

  const costoHospDefault = (dbServicios as any[]).find((s: any) =>
    s.nombre?.toLowerCase().includes("hospitaliz")
  )?.precio ?? "150.00";

  const vacunaSeleccionada = (dbVaccines as any[]).find((v: any) => v.id.toString() === aplicarVacuna);

  const { data: lotesVacuna = [] } = useQuery({
    queryKey: ["lotes-vacuna", vacunaSeleccionada?.producto?.id],
    queryFn: () => lotesService.getAll(vacunaSeleccionada!.producto!.id),
    enabled: !!vacunaSeleccionada?.producto?.id,
  });

  // Historial de signos vitales — solo consultas ANTERIORES a esta cita
  const fechaCita = appointment?.fecha_hora_inicio
    ? new Date(appointment.fecha_hora_inicio).toISOString()
    : undefined;

  const { data: historialMascota = [] } = useQuery({
    queryKey: ["historial-mascota", appointment?.mascota?.id, fechaCita],
    queryFn: () => historialClinicoService.getByMascota(appointment!.mascota!.id, fechaCita),
    enabled: !!appointment?.mascota?.id,
    select: (data: any[]) => data
      .filter((h: any) => h.peso_actual_kg && h.temperatura_c)
      .sort((a: any, b: any) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime())
      .map((h: any) => ({
        fecha: h.fecha_consulta,
        peso_kg: Number(h.peso_actual_kg),
        temperatura_c: Number(h.temperatura_c),
        frecuencia_cardiaca: Number(h.frecuencia_cardiaca),
        frecuencia_respiratoria: Number(h.frecuencia_respiratoria),
      })),
  });

  // Receta: todos los productos con stock > 0, excepto los de categoría Vacunas
  const medicamentosStock = (dbProducts as any[] ?? [])
    .filter((p: any) =>
      p.stockActual > 0 &&
      !p.categoria?.nombre?.toLowerCase().includes("vacuna")
    )
    .map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      stock: p.stockActual,
      unidad: p.unidadMedida,
      requiereReceta: p.requiereReceta,
      categoria: p.categoria?.nombre ?? "Otros",
      tipoProducto: p.tipoProducto,
      unidadDosis: p.unidadDosis,
      contenidoDosisPorEnvase: p.contenidoDosisPorEnvase,
      volumenRestanteOpen: p.volumenRestanteOpen,
    }));
  if (id_cita === "nueva" || loadingCita || loadingHistorial) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Iniciando consulta médica y cargando expediente...</p>
      </div>
    );
  }

  const m = id_cita === "nueva" ? directMascota : appointment?.mascota;
  const duenoName = m?.dueno ? `${m.dueno.nombres} ${m.dueno.apellidos}` : "Cliente General";
  const razaName = m?.raza?.nombre || "Mestizo";
  const especieName = m?.raza?.especie?.nombre || "Canino";
  const especieId = (m?.raza?.especie as any)?.id;

  // Filtrar vacunas por especie de la mascota
  const vacunasFiltradas = (dbVaccines as any[]).filter((v) =>
    !especieId || !v.id_especie_fk || Number(v.id_especie_fk) === Number(especieId)
  );

  let edadStr = "Desconocida";
  if (m?.fecha_nacimiento) {
    const birth = new Date(m.fecha_nacimiento);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years > 0) {
      edadStr = `${years} año${years > 1 ? "s" : ""}${months > 0 ? ` y ${months} mes${months > 1 ? "es" : ""}` : ""}`;
    } else {
      edadStr = `${months} mes${months > 1 ? "es" : ""}`;
    }
  }

  const cita = {
    mascota: m?.nombre || "Paciente Desconocido",
    especie: especieName,
    raza: razaName,
    edad: edadStr,
    dueno: duenoName,
    pesoPrevio: historialMascota.length > 0 ? `${historialMascota[0].peso_kg} kg` : "N/A",
    motivo: appointment?.motivo_cita || "Consulta general",
  };

  const handleAddPrescriptionItem = (medItem: any) => {
    setReceta([...receta, medItem]);
  };

  const handleEliminarMedicamento = (id: string) => {
    setReceta(receta.filter(r => r.id !== id));
  };

  const handleSave = async (estado: 'BORRADOR' | 'FINALIZADA') => {
    // 1. VALIDACIONES PREVIAS (UI)
    if (estado === 'FINALIZADA') {
      if (!diagnostico || !sintomas || !peso) {
        return toast.error("Por favor completa los campos clínicos obligatorios (Peso, Síntomas, Diagnóstico) para finalizar.");
      }
      if (receta.length === 0) {
        return toast.error("La receta médica es obligatoria para finalizar. Por favor, añade al menos un medicamento.");
      }
    } else {
      if (!peso) {
        return toast.error("Por favor completa al menos el Peso para guardar como borrador.");
      }
    }

    try {
      // 2. ARMAMOS EL PAQUETE DE DATOS PARA LA TRANSACCIÓN
      const payloadTransaccional = {
        // A. Cabecera: Datos del Historial
        historial: {
          motivo_consulta: cita.motivo,
          sintomas: sintomas || "Triaje inicial / Borrador",
          peso_actual_kg: parseFloat(peso),
          diagnostico: diagnostico || "Evaluación en curso",
          notas_internas: indicaciones || "",
          temperatura_c: temperatura ? parseFloat(temperatura) : undefined,
          frecuencia_cardiaca: fc ? parseInt(fc, 10) : undefined,
          frecuencia_respiratoria: fr ? parseInt(fr, 10) : undefined,
          tipo_atencion: "Consulta",
          triaje_completado: true,
          id_cita_fk: id_cita as string,
          estado: estado,

          turno,
          mucosas,
          anamnesis,
          exam_ecografia: examEcografia,
          exam_rayos_x: examRayosX,
          exam_hemograma: examHemograma,
          exam_quimica_sanguinea: examQuimicaSanguinea,
          exam_otros: examOtros,
          exam_resultados: examResultados,

          // Diagnósticos estructurados
          patologias: [
            ...presuntivas.map(p => ({ id_patologia_fk: p.id, tipo: 'PRESUNTIVO' })),
            ...definitivas.map(d => ({ id_patologia_fk: d.id, tipo: 'DEFINITIVO' })),
          ],
        },
        
        // B. Arreglo de Medicamentos (Receta) - ¡Volvemos al formato Array!
        receta: receta.map(r => ({
          id_producto: r.id_producto || null,
          medicamento_texto: r.id_producto ? null : r.medicamento_texto,
          dosis: r.dosis,
          frecuencia: r.frecuencia,
          duracion_dias: r.duracion_dias ? Number(r.duracion_dias) : null,
        })),

        // C. Objeto Vacuna — lote seleccionado automáticamente por FEFO
        vacuna: aplicarVacuna !== "ninguna" ? (() => {
          const vac = (dbVaccines as any[]).find(v => v.id.toString() === aplicarVacuna);
          const loteFEFO = (lotesVacuna as any[])
            .filter(l => !l.deletedAt && l.cantidadActual > 0)
            .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];
          // Validar stock antes de continuar
          if (vacunaSeleccionada?.producto && !loteFEFO) {
            toast.error(`Sin stock disponible para ${vac?.nombre_vacuna ?? "la vacuna seleccionada"}. Repón el inventario antes de aplicarla.`);
            throw new Error("Sin stock de vacuna");
          }
          return {
            id_vacuna_fk: vac?.id || 1,
            fecha_aplicacion: new Date().toISOString(),
            lote_vacuna: loteFEFO?.numeroLote || "SIN-LOTE",
          };
        })() : undefined,

        // D. Objeto Hospitalización (Solo si activó el switch)
        hospitalizacion: ordenarHospitalizar ? {
          fecha_ingreso: new Date().toISOString(),
          motivo_ingreso: diagnostico || "Ingreso por observación",
          estado_actual: "ACTIVA", // 'ACTIVA' | 'ALTA' | 'FALLECIDO' | 'REFERIDO'
          costo_por_dia: parseFloat(costoPorDia) || 150.00,
          articulos: articulos.map(art => ({
            descripcion: art.descripcion,
            cantidad: Number(art.cantidad) || 1,
            observacion: art.observacion || "",
          })),
        } : undefined,

        archivos: (() => {
          // Solo archivos que subieron exitosamente Y tienen URL real de Cloudinary
          const exitosos = attachedFiles.filter(f => f.status === "success" && f.url);
          console.log("📎 attachedFiles completo:", attachedFiles);
          console.log("📎 archivos exitosos con URL:", exitosos);
          if (exitosos.length === 0) return undefined;
          return exitosos.map(file => ({
            url_archivo: file.url,
            nombre_archivo: file.name,
            tipo_archivo: file.type || "application/octet-stream",
            estado_archivo: file.estado_archivo || "Finalizado",
            tipo_estudio: file.name.toLowerCase().includes("rx") || file.name.toLowerCase().includes("radiografia")
              ? "Radiografia"
              : file.name.toLowerCase().includes("eco")
              ? "Ecografia"
              : file.name.toLowerCase().includes("electro")
              ? "Electrocardiograma"
              : file.name.toLowerCase().includes("lab") || file.name.toLowerCase().includes("sangre")
              ? "Laboratorio"
              : "Otro",
          }));
        })(),
      };

      console.log("Payload Transaccional a enviar al backend:", payloadTransaccional);

      // 3. EJECUTAMOS LA TRANSACCIÓN EN EL BACKEND
      await historialClinicoService.finalizarConsultaTransaccional(payloadTransaccional);

      // Si no saltó al 'catch', significa que TODO se guardó perfectamente
      toast.success(estado === 'FINALIZADA' ? "Consulta Finalizada con éxito" : "Borrador guardado con éxito", {
        description: estado === 'FINALIZADA'
          ? "El expediente, receta y estado de la cita se guardaron correctamente."
          : "Los cambios se guardaron como borrador correctamente."
      });
      
      if (estado === 'FINALIZADA') {
        setShowSuccessDialog(true);
      } else {
        router.push("/vet/agenda");
      }

    } catch (err: any) {
      console.error("Error detallado:", err);
      const mensajeError = err.response?.data?.message || err.response?.data?.error || "Ocurrió un error inesperado al finalizar la consulta.";
      
      toast.error("Error al guardar la consulta", {
        description: Array.isArray(mensajeError) ? mensajeError[0] : mensajeError
      });
    }
  };

  const handleFinalizarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave('FINALIZADA');
  };

  const handlePrintPrescription = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = receta.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${item.nombre || item.medicamento_texto}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.dosis}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.frecuencia}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.duracion_dias ? `${item.duracion_dias} días` : 'N/A'}</td>
      </tr>
    `).join("");

    const html = `
      <html>
        <head>
          <title>Receta Médica - Animal Vet</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a3a5c; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1a3a5c; }
            .logo span { color: #666; font-size: 14px; }
            .clinic-info { text-align: right; font-size: 12px; color: #666; }
            .title { text-align: center; margin: 30px 0; font-size: 20px; font-weight: bold; letter-spacing: 1px; color: #1a3a5c; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .details-section h3 { margin-top: 0; color: #1a3a5c; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .details-section p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { background: #1a3a5c; color: white; padding: 10px; text-align: left; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            .signature-space { margin-top: 60px; display: flex; justify-content: flex-end; }
            .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-size: 14px; }
            .notes { margin-top: 20px; font-size: 13px; background: #fffde7; padding: 15px; border-left: 4px solid #fbc02d; border-radius: 4px; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Animal Vet <br><span>Clínica Veterinaria</span></div>
            <div class="clinic-info">
              <p><strong>Dr. ${user?.nombres || "Médico"} ${user?.apellidos || "Veterinario"}</strong></p>
              <p>Atención Veterinaria Profesional</p>
              <p>Fecha: ${new Date().toLocaleDateString('es-BO')}</p>
            </div>
          </div>
          
          <div class="title">RECETA MÉDICA</div>

          <div class="details-grid">
            <div class="details-section">
              <h3>PACIENTE</h3>
              <p><strong>Nombre:</strong> ${cita.mascota}</p>
              <p><strong>Especie/Raza:</strong> ${cita.especie} / ${cita.raza}</p>
              <p><strong>Edad:</strong> ${cita.edad}</p>
              <p><strong>Propietario:</strong> ${cita.dueno}</p>
            </div>
            <div class="details-section">
              <h3>DIAGNÓSTICO</h3>
              <p>${diagnostico}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${indicaciones ? `
            <div class="notes">
              <strong>Indicaciones adicionales:</strong>
              <p style="margin: 5px 0 0 0;">${indicaciones}</p>
            </div>
          ` : ""}

          <div class="signature-space">
            <div class="signature">
              Dr. ${user?.nombres} ${user?.apellidos}<br>
              Firma y Sello
            </div>
          </div>

          <div class="footer">
            Documento emitido por el sistema de gestión de Animal Vet.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/vet/agenda")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-primary" /> Consulta Activa: {cita.mascota}
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Dueño: {cita.dueno} • Especie: {cita.especie} ({cita.raza})
            </p>
            {appointment?.createdAt && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Agendada: {new Date(appointment.createdAt).toLocaleString("es-BO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 text-xs"
            onClick={() => setHistorialOpen(true)}
          >
            <ClipboardList className="h-4 w-4" />
            Ver historial
            {historialMascota.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {historialMascota.length}
              </span>
            )}
          </Button>
          <Badge className="bg-primary text-primary-foreground font-mono text-sm py-1 px-3">
            Cita #{id_cita}
          </Badge>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl items-center font-semibold text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
          <span>Modo de Vista: Como administrador, no puedes registrar ni editar consultas clínicas. Esta pantalla es únicamente para fines de auditoría operativa.</span>
        </div>
      )}

      <form onSubmit={handleFinalizarConsulta} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO: TRIAJE Y DATOS MEDICOS */}
        <div className="xl:col-span-2 space-y-6">
          <TriageForm
            peso={peso}
            setPeso={setPeso}
            temperatura={temperatura}
            setTemperatura={setTemperatura}
            fc={fc}
            setFc={setFc}
            fr={fr}
            setFr={setFr}
            pesoPrevio={cita.pesoPrevio}
            historialSignos={historialMascota}
            disabled={isAdmin}
          />

          <ClinicalNotesForm
            motivo={cita.motivo}
            sintomas={sintomas}
            setSintomas={setSintomas}
            diagnostico={diagnostico}
            setDiagnostico={setDiagnostico}
            indicaciones={indicaciones}
            setIndicaciones={setIndicaciones}
            disabled={isAdmin}

            turno={turno}
            setTurno={setTurno}
            mucosas={mucosas}
            setMucosas={setMucosas}
            anamnesis={anamnesis}
            setAnamnesis={setAnamnesis}
            presuntivas={presuntivas}
            setPresuntivas={setPresuntivas}
            definitivas={definitivas}
            setDefinitivas={setDefinitivas}
            dbPatologiasMaster={dbPatologiasMaster}


            examEcografia={examEcografia}
            setExamEcografia={setExamEcografia}
            examRayosX={examRayosX}
            setExamRayosX={setExamRayosX}
            examHemograma={examHemograma}
            setExamHemograma={setExamHemograma}
            examQuimicaSanguinea={examQuimicaSanguinea}
            setExamQuimicaSanguinea={setExamQuimicaSanguinea}
            examOtros={examOtros}
            setExamOtros={setExamOtros}
            examResultados={examResultados}
            setExamResultados={setExamResultados}
          />

          <Card className="rounded-3xl border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" /> Archivos Clínicos y Reportes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <FileDropzone onFilesChanged={setAttachedFiles} disabled={isAdmin} />
            </CardContent>
          </Card>
        </div>

        {/* PANEL DERECHO: RECETA GENERATOR, ADICIONALES Y GUARDAR */}
        <div className="space-y-6">
          <PrescriptionBuilder
            receta={receta}
            onAddMedicamento={handleAddPrescriptionItem}
            onEliminarMedicamento={handleEliminarMedicamento}
            medicamentosStock={medicamentosStock}
            disabled={isAdmin}
            pesoMascota={peso}
            especieMascota={cita.especie}
            diagnostico={diagnostico}
            dbPathologies={dbPathologies}
          />

          {/* ACCIONES CLÍNICAS EXTRA */}
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-primary" /> Acciones Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* VACUNA — filtrada por especie */}
              <div className="space-y-2">
                <Label htmlFor="vacuna">
                  Aplicar Vacuna en la Consulta
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (solo vacunas para {especieName})
                  </span>
                </Label>
                <Select value={aplicarVacuna} onValueChange={(v) => { setAplicarVacuna(v); }} disabled={isAdmin}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Seleccionar vacuna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Ninguna vacuna</SelectItem>
                    {vacunasFiltradas.map((v: any) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.nombre_vacuna} — refuerzo c/{v.intervalo_revacunacion} días
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* LOTE FEFO — informativo, selección automática */}
              {aplicarVacuna !== "ninguna" && (() => {
                const loteFEFO = (lotesVacuna as any[])
                  .filter(l => !l.deletedAt && l.cantidadActual > 0)
                  .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];
                return vacunaSeleccionada?.producto ? (
                  <div className={`rounded-xl px-4 py-3 text-xs border ${loteFEFO ? "bg-primary/5 border-primary/20 text-primary" : "bg-destructive/5 border-destructive/20 text-destructive"}`}>
                    {loteFEFO ? (
                      <>
                        <p className="font-semibold mb-0.5">Lote a usar (FEFO automático)</p>
                        <p className="font-mono">{loteFEFO.numeroLote} — Stock: {loteFEFO.cantidadActual} — Vence: {new Date(loteFEFO.fechaVencimiento).toLocaleDateString("es-BO")}</p>
                      </>
                    ) : (
                      <p className="font-semibold">Sin stock disponible para esta vacuna. Repón el inventario antes de aplicarla.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    Esta vacuna no tiene producto enlazado al inventario.
                  </p>
                );
              })()}

              <Separator />

              {/* HOSPITALIZACIÓN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-2xl border border-destructive/10">
                  <div className="flex-1 mr-2">
                    <p className="text-sm font-bold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Hospitalizar Paciente
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Derivar a internación clínica/UCI por gravedad.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={ordenarHospitalizar}
                    onChange={(e) => {
                      setOrdenarHospitalizar(e.target.checked);
                      if (e.target.checked && !costoPorDia) setCostoPorDia(String(costoHospDefault));
                    }}
                    disabled={isAdmin}
                    className="h-5 w-5 rounded border-destructive text-destructive accent-destructive"
                  />
                </div>
                {/* Costo solo visible para Admin — el vet no maneja información financiera */}
                {ordenarHospitalizar && isAdmin && (
                  <div className="space-y-2 pl-1">
                    <Label htmlFor="costo-dia">Costo por día (Bs.)</Label>
                    <input
                      id="costo-dia"
                      type="number"
                      min="0"
                      step="0.50"
                      value={costoPorDia}
                      onChange={(e) => setCostoPorDia(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/50 bg-muted/20 px-3 text-sm font-mono"
                    />
                  </div>
                )}

                {ordenarHospitalizar && (
                  <div className="mt-4 p-3 bg-muted/20 border border-dashed rounded-2xl space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Artículos de Ingreso (Inventario del Propietario)</Label>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Descripción (ej. Cobija, Plato)"
                          value={artDesc}
                          onChange={(e) => setArtDesc(e.target.value)}
                          disabled={isAdmin}
                          className="col-span-2 h-9 rounded-lg border px-2.5 text-xs bg-card"
                        />
                        <input
                          type="number"
                          placeholder="Cant"
                          min="1"
                          value={artCant}
                          onChange={(e) => setArtCant(e.target.value)}
                          disabled={isAdmin}
                          className="h-9 rounded-lg border px-2 text-xs bg-card"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Observación (ej. Color azul, roto)"
                          value={artObs}
                          onChange={(e) => setArtObs(e.target.value)}
                          disabled={isAdmin}
                          className="flex-1 h-9 rounded-lg border px-2.5 text-xs bg-card"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (!artDesc.trim()) return;
                            setArticulos([...articulos, {
                              descripcion: artDesc.trim(),
                              cantidad: parseInt(artCant, 10) || 1,
                              observacion: artObs.trim() || undefined
                            }]);
                            setArtDesc("");
                            setArtCant("1");
                            setArtObs("");
                          }}
                          disabled={!artDesc.trim() || isAdmin}
                          className="h-9 rounded-lg px-3 bg-primary text-primary-foreground text-xs"
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 mt-2">
                      {articulos.map((art, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-card border rounded-lg text-xs">
                          <div>
                            <span className="font-semibold">{art.descripcion}</span>
                            <span className="text-muted-foreground mx-1">x{art.cantidad}</span>
                            {art.observacion && <span className="text-muted-foreground italic text-[10px]">({art.observacion})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setArticulos(articulos.filter((_, idx) => idx !== i))}
                            disabled={isAdmin}
                            className="text-destructive hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {articulos.length === 0 && (
                        <p className="text-[10px] text-muted-foreground text-center py-1">Ningún artículo registrado.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* ACCIONES */}
          <div className="flex gap-4 w-full">
            <Button
              type="button"
              variant="outline"
              disabled={isAdmin}
              onClick={() => handleSave('BORRADOR')}
              className="w-1/2 h-14 rounded-2xl text-base font-bold border-2 hover:bg-muted/10 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" /> Guardar Borrador
            </Button>
            <Button
              type="button"
              disabled={isAdmin}
              onClick={() => handleSave('FINALIZADA')}
              className="w-1/2 h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            >
              <CheckCircle className="h-5 w-5 mr-2" /> Finalizar Consulta
            </Button>
          </div>
        </div>
      </form>

      {/* DRAWER DE HISTORIAL */}
      {historialOpen && appointment?.mascota && (
        <HistorialDrawer
          mascotaId={appointment.mascota.id}
          mascotaNombre={cita.mascota}
          onClose={() => setHistorialOpen(false)}
        />
      )}

      {/* DIALOG DE ÉXITO Y RECETA DIGITAL */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => { if (!open) router.push("/vet/agenda"); }}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center text-primary">Consulta Finalizada con Éxito</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">El expediente clínico y la receta de <strong>{cita.mascota}</strong> se guardaron correctamente.</p>
            <p className="text-xs text-muted-foreground/80">¿Deseas imprimir la Receta Digital para el dueño ahora?</p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
            <Button variant="outline" className="rounded-xl w-full sm:w-1/2 font-semibold" onClick={() => router.push("/vet/agenda")}>
              Ir a la Agenda
            </Button>
            <Button className="rounded-xl w-full sm:w-1/2 font-bold" onClick={handlePrintPrescription}>
              Imprimir Receta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
