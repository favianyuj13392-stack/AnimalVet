'use client'

import Link from "next/link"
import { ArrowLeft, PawPrint, Loader2, Plus, ChevronRight } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { useQuery } from "@tanstack/react-query"

import { mascotasService } from "@/domains/pets/services/mascotas.service"
import { Mascota, Raza, Especie } from "@/domains/pets/pets.types"
import { speciesService } from "@/domains/pets/services/especies.service"
import { breedsService } from "@/domains/pets/services/breeds.service"
import { useCrud } from "@/shared/hooks/useCrud"
import { useAuthStore } from "@/shared/store/useAuthStore"

export default function MisMascotasPage() {
  const user = useAuthStore((state) => state.user)

  const { data: misMascotas = [], isLoading: loadingMascotas } = useQuery<Mascota[]>({
    queryKey: ["mis-mascotas", user?.id],
    queryFn: () => mascotasService.getMisMascotas(user!.id),
    enabled: !!user?.id,
  })
  const { data: especies } = useCrud<Especie>(speciesService, "especies")
  const { data: razas } = useCrud<Raza>(breedsService, "razas")

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-8">

      {/* ─── PAGE HEADER ─── */}
      <div>
        <Link href="/cliente/inicio">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-3 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inicio
          </Button>
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis mascotas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loadingMascotas
                ? "Cargando..."
                : `${misMascotas.length} mascota${misMascotas.length !== 1 ? "s" : ""} registrada${misMascotas.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/cliente/mascotas/registro">
            <Button size="sm" className="rounded-lg gap-1.5 h-9 text-sm shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Registrar
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      {loadingMascotas ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Cargando tus mascotas...</span>
        </div>
      ) : misMascotas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-border rounded-2xl text-center px-8">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center">
            <PawPrint className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Todavia no tienes mascotas</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Registra a tu mascota para acceder a su perfil clinico, historial de vacunas y carnet QR.
            </p>
          </div>
          <Link href="/cliente/mascotas/registro">
            <Button size="sm" className="rounded-lg gap-1.5 mt-1">
              <Plus className="h-3.5 w-3.5" />
              Registrar primera mascota
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {misMascotas.map((mascota) => {
            const raza = (razas ?? []).find(r => Number(r.id) === Number(mascota.id_raza_fk))
            const especie = (especies ?? []).find(e => Number(e.id) === Number(raza?.id_especie_fk))

            return (
              <Card
                key={mascota.id}
                className="rounded-xl border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col overflow-hidden"
              >
                <CardContent className="p-5 flex-1 space-y-4">

                  {/* Avatar + nombre */}
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {(mascota as any).foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(mascota as any).foto_url} alt={mascota.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-bold text-primary">
                          {mascota.nombre.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{mascota.nombre}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {especie?.nombre ?? "Mascota"}
                        {raza?.nombre ? ` · ${raza.nombre}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Datos */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sexo</span>
                      <span className="font-medium text-foreground">
                        {mascota.sexo === "M" ? "Macho" : "Hembra"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Nacimiento</span>
                      <span className="font-medium text-foreground">
                        {mascota.fecha_nacimiento
                          ? new Date(mascota.fecha_nacimiento).toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "No registrada"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Esterilizado</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 font-medium ${
                          mascota.esterilizado
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "border-border bg-transparent text-muted-foreground"
                        }`}
                      >
                        {mascota.esterilizado ? "Si" : "No"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="px-5 py-3 border-t border-border/50 bg-muted/20">
                  <Link href={`/cliente/mascotas/${mascota.id}`} className="w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-lg h-8 text-xs font-medium gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Ver perfil clinico
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
