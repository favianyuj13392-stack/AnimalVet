"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  // --- QUERIES ---
  const { data: appointment, isLoading: loadingCita } = useQuery<Cita>({
    queryKey: ["cita", id_cita],
    queryFn: () => citasService.getOne(id_cita as string),
    enabled: !!id_cita,
  });

  const { data: dbProducts } = useQuery({
    queryKey: ["productos-catalogo"],
    queryFn: () => productosService.getAll().catch(() => []),
  });

  const { data: dbPathologies = [] } = useQuery({
    queryKey: ["plantillas-patologia"],
    queryFn: () => historialClinicoService.getPlantillasPatologia().catch(() => []),
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
  if (loadingCita) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando detalles del paciente...</p>
      </div>
    );
  }

  const m = appointment?.mascota;
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

 const handleFinalizarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. VALIDACIONES PREVIAS (UI)
    if (!diagnostico || !sintomas || !peso) {
      return toast.error("Por favor completa los campos clínicos obligatorios (Peso, Síntomas, Diagnóstico)");
    }

    if (receta.length === 0) {
      return toast.error("La receta médica es obligatoria. Por favor, añade al menos un medicamento.");
    }

    try {
      // 2. ARMAMOS EL PAQUETE DE DATOS PARA LA TRANSACCIÓN
      const payloadTransaccional = {
        // A. Cabecera: Datos del Historial
        historial: {
          motivo_consulta: cita.motivo,
          sintomas: sintomas,
          peso_actual_kg: parseFloat(peso),
          diagnostico: diagnostico,
          notas_internas: indicaciones || "",
          temperatura_c: temperatura ? parseFloat(temperatura) : undefined,
          frecuencia_cardiaca: fc ? parseInt(fc, 10) : undefined,
          frecuencia_respiratoria: fr ? parseInt(fr, 10) : undefined,
          tipo_atencion: "Consulta",
          triaje_completado: true,
          id_cita_fk: id_cita as string,
        },
        
        // B. Arreglo de Medicamentos (Receta)
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
          motivo_ingreso: diagnostico,
          estado_actual: "Observacion",
          costo_por_dia: parseFloat(costoPorDia) || 150.00,
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
      toast.success("Consulta Finalizada con éxito", {
        description: "El expediente, receta y estado de la cita se guardaron correctamente."
      });
      
      setShowSuccessDialog(true);

    } catch (err: any) {
      console.error("Error detallado:", err);
      const mensajeError = err.response?.data?.message || err.response?.data?.error || "Ocurrió un error inesperado al finalizar la consulta.";
      
      toast.error("Error al finalizar la consulta", {
        description: Array.isArray(mensajeError) ? mensajeError[0] : mensajeError
      });
    }
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
              </div>

            </CardContent>
          </Card>

          {/* FINALIZAR */}
          <Button type="submit" disabled={isAdmin} className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform disabled:opacity-50">
            <Save className="h-5 w-5 mr-2" /> {isAdmin ? "Consulta de Solo Lectura" : "Guardar y Cerrar Consulta"}
          </Button>
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
