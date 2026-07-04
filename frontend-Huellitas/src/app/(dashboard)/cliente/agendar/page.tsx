import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { BookingWizard } from "@/domains/appointments/components/booking-wizard"

export default function AgendarCitaPage() {
  return (
    // Contrarrestamos el p-4 lg:p-6 del layout global para usar toda la pantalla
    <div
      className="-mx-4 lg:-mx-6 -my-4 lg:-my-6 flex flex-col gap-3 p-4 lg:p-5 overflow-hidden"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Header compacto */}
      <div className="shrink-0 flex items-center gap-2.5">
        <Link href="/cliente/inicio">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg text-muted-foreground hover:text-foreground h-8 w-8 p-0 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
            Agendar cita
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona mascota, servicio, veterinario y horario.
          </p>
        </div>
      </div>

      {/* Wizard ocupa todo el espacio restante */}
      <div className="flex-1 min-h-0">
        <BookingWizard />
      </div>
    </div>
  )
}
