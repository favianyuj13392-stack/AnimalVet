"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import {
  Stethoscope, Syringe, Scissors, Activity,
  Pill, Bone, Loader2, Clock, ArrowRight, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { servicesService } from "@/domains/billing/services/services.service";

/* ── helpers ── */
function getIcon(nombre: string) {
  const n = nombre.toLowerCase();
  if (n.includes("consulta") || n.includes("chequeo"))              return Stethoscope;
  if (n.includes("vacuna") || n.includes("inyección"))              return Syringe;
  if (n.includes("peluquería") || n.includes("baño") || n.includes("estética") || n.includes("corte")) return Scissors;
  if (n.includes("farmacia") || n.includes("medicamento"))          return Pill;
  if (n.includes("trauma") || n.includes("cirugía") || n.includes("hueso")) return Bone;
  return Activity;
}

// Fallbacks de Unsplash si el servicio no tiene imagen
const FALLBACKS = [
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=75",
  "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&q=75",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=75",
  "https://images.unsplash.com/photo-1559000357-f6b52ddfbe37?w=600&q=75",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=75",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=75",
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=75",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=75",
];

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

/* ── page ── */
export default function ServiciosPage() {
  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ["servicios-publicos"],
    queryFn: () => servicesService.getAll().catch(() => []),
  });

  const activos = (servicios as any[]).filter((s) => !s.deletedAt);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ── */}
      <section className="relative w-full h-[50vh] min-h-[380px] overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1600&q=80"
            alt="Servicios veterinarios"
            fill className="object-cover object-center"
            style={{ filter: "brightness(0.55) saturate(1.1)" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-16 pb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-white/50 mb-3">
            Catálogo completo
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.95]">
            Nuestros<br />Servicios.
          </motion.h1>
        </div>
      </section>

      {/* ── CONTENIDO ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-16 py-20">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Cargando servicios...</p>
          </div>
        ) : activos.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border/50 rounded-3xl text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No hay servicios disponibles en este momento.</p>
          </div>
        ) : (
          <>
            {/* Card destacada — primer servicio */}
            {activos.length > 0 && (() => {
              const s = activos[0];
              const Icon = getIcon(s.nombre);
              const img = s.imagen_url || FALLBACKS[0];
              return (
                <Reveal className="mb-4">
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="group relative w-full h-[320px] md:h-[400px] rounded-3xl overflow-hidden cursor-default">
                    <Image src={img} alt={s.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="max-w-lg">
                        <p className="text-xs text-white/50 tracking-widest uppercase mb-2">Servicio destacado</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{s.nombre}</h2>
                        <p className="text-white/70 text-sm leading-relaxed mb-4 hidden md:block">
                          {s.descripcion || "Servicio profesional garantizado por nuestro equipo médico."}
                        </p>
                        <div className="flex items-center gap-6">
                          <span className="text-2xl font-black text-white">{Number(s.precio).toFixed(2)} <span className="text-sm font-medium text-white/60">Bs</span></span>
                          <span className="flex items-center gap-1.5 text-xs text-white/50">
                            <Clock className="h-3.5 w-3.5" />{s.duracion_minutos || 30} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              );
            })()}

            {/* Grid del resto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activos.slice(1).map((s: any, i: number) => {
                const Icon = getIcon(s.nombre);
                const img = s.imagen_url || FALLBACKS[(i + 1) % FALLBACKS.length];
                return (
                  <Reveal key={s.id} delay={i * 0.06}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-colors cursor-default">

                      {/* Imagen */}
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={img}
                          alt={s.nombre}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-600"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* Icono encima */}
                        <div className="absolute top-4 left-4 h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                        </div>
                        {/* Precio encima de la imagen */}
                        <div className="absolute bottom-4 right-4">
                          <span className="text-lg font-black text-white">{Number(s.precio).toFixed(2)} <span className="text-xs font-medium text-white/70">Bs</span></span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-base mb-1">{s.nombre}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {s.descripcion || "Servicio profesional garantizado por nuestro equipo médico."}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />{s.duracion_minutos || 30} min
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  </Reveal>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/50 py-24">
        <Reveal>
          <div className="max-w-screen-xl mx-auto px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">¿Listo?</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                Agenda una cita hoy.
              </h2>
            </div>
            <Button asChild size="lg" className="h-14 px-10 rounded-full font-semibold text-base hover:scale-105 transition-transform flex-shrink-0">
              <Link href="/registro">
                Crear cuenta gratis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
