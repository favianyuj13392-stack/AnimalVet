'use client';

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Merge, Search, Info, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useCrud } from "@/shared/hooks/useCrud";
import { mascotasService } from "@/domains/pets/services/mascotas.service";
import { Mascota } from "@/domains/pets/pets.types";
import { useAuthStore } from "@/shared/store/useAuthStore";

interface FusionPacientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mascotaTemporal: Mascota | null;
  onSuccess?: () => void;
}

export function FusionPacientesDialog({ open, onOpenChange, mascotaTemporal, onSuccess }: FusionPacientesDialogProps) {
  const { user } = useAuthStore();
  const isCajero = user?.rol?.id === 3;

  const { data: mascotas, loading: loadingMascotas } = useCrud<Mascota>(mascotasService, "mascotas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMascotaReal, setSelectedMascotaReal] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para la doble confirmación (Cajero)
  const [showDoubleConfirm, setShowDoubleConfirm] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!mascotaTemporal) return null;

  // Filtrar mascotas:
  // 1. No incluir la mascota temporal misma.
  // 2. No incluir otras mascotas temporales (que tengan hashQr que empiece con EMERG-).
  // 3. Coincidencia por nombre de mascota o nombre del dueño.
  const filteredMascotas = (mascotas ?? []).filter((m) => {
    if (m.id === mascotaTemporal.id) return false;
    const isEmerg = m.hash_qr_identidad?.startsWith("EMERG-");
    if (isEmerg) return false;

    const query = searchTerm.toLowerCase();
    const matchMascota = m.nombre.toLowerCase().includes(query);
    const matchDueno = m.dueno
      ? `${m.dueno.nombres} ${m.dueno.apellidos}`.toLowerCase().includes(query)
      : false;
    
    return matchMascota || matchDueno;
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowDoubleConfirm(false);
      setRiskAccepted(false);
      setConfirmText("");
      setSelectedMascotaReal(null);
      setSearchTerm("");
    }
    onOpenChange(isOpen);
  };

  const handleMerge = async () => {
    if (!selectedMascotaReal) return;
    
    // Si el usuario es cajero y no se ha mostrado la doble confirmación, la mostramos
    if (isCajero && !showDoubleConfirm) {
      setShowDoubleConfirm(true);
      return;
    }

    // Si es cajero y ya está en doble confirmación, validar
    if (isCajero && showDoubleConfirm) {
      if (!riskAccepted) {
        toast.error("Debes aceptar el riesgo marcando la casilla de verificación.");
        return;
      }
      if (confirmText.trim().toUpperCase() !== "FUSIONAR") {
        toast.error("Debes escribir la palabra 'FUSIONAR' exactamente para confirmar.");
        return;
      }
    }
    
    setLoading(true);
    try {
      const response = await mascotasService.vincularDuplicado(mascotaTemporal.id, selectedMascotaReal.id);
      toast.success(response.mensaje || "Fusión de perfiles completada exitosamente.");
      setSelectedMascotaReal(null);
      setSearchTerm("");
      setShowDoubleConfirm(false);
      setRiskAccepted(false);
      setConfirmText("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Ocurrió un error al fusionar los perfiles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 text-primary mb-1">
            <Merge className="h-6 w-6" />
            <DialogTitle className="text-xl font-black tracking-tight">
              {showDoubleConfirm ? "Confirmación de Seguridad Obligatoria" : "Fusión de Pacientes Duplicados"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {showDoubleConfirm 
              ? "Por favor, verifique cuidadosamente los datos antes de proceder con la fusión."
              : `Vincula la consulta y hospitalización de la urgencia temporal de ${mascotaTemporal.nombre} con su ficha definitiva preexistente.`
            }
          </DialogDescription>
        </DialogHeader>

        {showDoubleConfirm && selectedMascotaReal ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col gap-3 text-xs text-yellow-700 dark:text-yellow-400">
              <div className="flex gap-2 font-bold items-center text-sm">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <span>¿Confirmar Vinculación de Historiales?</span>
              </div>
              <p className="leading-relaxed">
                Esta acción es <strong>irreversible</strong>. Mezclará permanentemente los historiales médicos, recetas, consultas y hospitalizaciones de la ficha temporal en la ficha oficial.
              </p>
              
              <div className="mt-2 space-y-1.5 border-t border-yellow-500/20 pt-2 text-card-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Mascota Temporal:</span>
                  <span className="font-bold">{mascotaTemporal.nombre} (QR: {mascotaTemporal.hash_qr_identidad})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Mascota Oficial (Destino):</span>
                  <span className="font-bold text-primary">{selectedMascotaReal.nombre} (QR: {selectedMascotaReal.hash_qr_identidad})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Propietario Destino:</span>
                  <span className="font-semibold">
                    {selectedMascotaReal.dueno ? `${selectedMascotaReal.dueno.nombres} ${selectedMascotaReal.dueno.apellidos}` : "Sin Propietario"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-card-foreground font-medium bg-muted/30 p-3 rounded-xl border border-border/40">
                <input
                  type="checkbox"
                  checked={riskAccepted}
                  onChange={(e) => setRiskAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer animate-none"
                />
                <span>
                  Confirmo que he verificado la identidad de la mascota y del propietario, y entiendo que los expedientes médicos se consolidarán.
                </span>
              </label>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-text" className="text-xs font-bold text-card-foreground">
                  Escribe la palabra <span className="font-mono bg-muted px-1 py-0.5 rounded text-destructive font-black">FUSIONAR</span> para autorizar:
                </Label>
                <Input
                  id="confirm-text"
                  placeholder="Escribe FUSIONAR aquí..."
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={`rounded-xl h-10 border-border/60 bg-card/40 font-mono text-center font-bold text-sm tracking-widest uppercase ${confirmText && confirmText.trim().toUpperCase() !== "FUSIONAR" ? "border-destructive" : confirmText.trim().toUpperCase() === "FUSIONAR" ? "border-green-500" : ""}`}
                />
                {confirmText && confirmText.trim().toUpperCase() !== "FUSIONAR" && (
                  <p className="text-xs text-destructive">Escribe exactamente: FUSIONAR</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setShowDoubleConfirm(false);
                  setRiskAccepted(false);
                  setConfirmText("");
                }}
                className="rounded-xl border-border/60"
              >
                Volver
              </Button>
              <Button
                type="button"
                disabled={loading || !riskAccepted || confirmText.trim().toUpperCase() !== "FUSIONAR"}
                onClick={handleMerge}
                className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-md shadow-destructive/20 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Fusionando...
                  </>
                ) : (
                  <>
                    <Merge className="h-4 w-4" /> Autorizar y Fusionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Ficha Origen (Temporal) */}
            <div className="p-3 bg-muted/40 rounded-2xl border text-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Ficha Temporal de Urgencia</span>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-card-foreground text-sm">{mascotaTemporal.nombre}</p>
                  <p className="text-muted-foreground mt-0.5">Contacto: {mascotaTemporal.dueno ? `${mascotaTemporal.dueno.nombres} ${mascotaTemporal.dueno.apellidos}` : "Sin dueño"}</p>
                </div>
                <span className="bg-destructive/10 text-destructive font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-destructive/20">
                  {mascotaTemporal.hash_qr_identidad}
                </span>
              </div>
            </div>

            {/* Buscador de Ficha Real */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-card-foreground">Buscar Paciente Oficial Real</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de mascota o del dueño..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl h-10 border-border/60 bg-card/40"
                />
              </div>
            </div>

            {/* Listado Resultados */}
            <div className="max-h-[160px] overflow-y-auto border rounded-xl divide-y bg-card/20">
              {loadingMascotas ? (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando pacientes...
                </div>
              ) : filteredMascotas.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {searchTerm ? "No se encontraron pacientes" : "Escribe en la barra para buscar"}
                </div>
              ) : (
                filteredMascotas.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMascotaReal(m)}
                    className={`p-3 text-xs cursor-pointer hover:bg-muted/10 transition-colors flex justify-between items-center ${
                      selectedMascotaReal?.id === m.id ? "bg-primary/10 font-semibold" : ""
                    }`}
                  >
                    <div>
                      <p className="font-bold text-card-foreground">{m.nombre} ({m.raza?.especie?.nombre || "Especie"})</p>
                      <p className="text-muted-foreground mt-0.5">Dueño: {m.dueno ? `${m.dueno.nombres} ${m.dueno.apellidos}` : "Sin Propietario"}</p>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      QR: {m.hash_qr_identidad ? m.hash_qr_identidad.substring(0, 8) : "N/A"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Ficha Destino Seleccionada */}
            {selectedMascotaReal && (
              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 text-xs animate-in fade-in duration-300">
                <span className="text-[10px] font-bold text-primary uppercase block mb-1">Paciente Oficial Destino</span>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-card-foreground text-sm">{selectedMascotaReal.nombre}</p>
                    <p className="text-muted-foreground mt-0.5">Propietario: {selectedMascotaReal.dueno ? `${selectedMascotaReal.dueno.nombres} ${selectedMascotaReal.dueno.apellidos}` : "Sin Propietario"}</p>
                  </div>
                  <span className="bg-primary/10 text-primary font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                    {selectedMascotaReal.hash_qr_identidad}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Al confirmar, la ficha temporal se eliminará definitivamente. Todas sus recetas, hospitalizaciones e historiales migrarán a la ficha oficial real.</span>
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-border/60"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={loading || !selectedMascotaReal}
                onClick={handleMerge}
                className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/20 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    {isCajero ? "Proceder a Fusión" : "Confirmar Fusión"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
