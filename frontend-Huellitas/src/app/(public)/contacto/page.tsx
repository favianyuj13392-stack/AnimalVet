"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ArrowRight, Camera, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

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

const info = [
  { icon: MapPin,  label: "Dirección",              value: "Av. Principal #123, Zona Sur\nLa Paz, Bolivia" },
  { icon: Phone,   label: "Teléfono / Emergencias",  value: "+591 71234567\nDisponible 24/7" },
  { icon: Mail,    label: "Correo electrónico",       value: "contacto@huellitas-vet.com" },
  { icon: Clock,   label: "Horarios",                value: "Lunes a Domingo\n24 horas — Urgencias siempre activas" },
];

const redes = [
  { icon: Camera,         label: "Instagram",  href: "#", handle: "@huellitas.vet" },
  { icon: Globe,          label: "Facebook",   href: "#", handle: "Huellitas Veterinaria" },
  { icon: MessageCircle,  label: "WhatsApp",   href: "#", handle: "+591 71234567" },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ── */}
      <section className="relative w-full h-[50vh] min-h-[360px] overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=80"
            alt="Contacto Huellitas"
            fill className="object-cover object-center"
            style={{ filter: "brightness(0.5) saturate(1.1)" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-16 pb-16">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-white/50 mb-3">
            Estamos aquí
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.95]">
            Contáctanos.
          </motion.h1>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-16 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info de contacto */}
          <div>
            <Reveal>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">Información</p>
              <h2 className="text-4xl font-black tracking-tighter mb-10">
                Visítanos o<br />llámanos.
              </h2>
            </Reveal>

            <div className="space-y-3">
              {info.map((item, i) => (
                <Reveal key={item.label} delay={i * 0.08}>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-start gap-5 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-semibold text-foreground whitespace-pre-line leading-relaxed">{item.value}</p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>

            {/* Emergencia */}
            <Reveal delay={0.35}>
              <div className="mt-4 p-6 rounded-2xl bg-red-500/8 border border-red-500/20">
                <p className="text-sm font-bold text-red-500 mb-1">🚨 Emergencia veterinaria</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Si tu mascota sufre un trauma, envenenamiento o dificultad respiratoria, no esperes. Llama de inmediato o dirígete a nuestras instalaciones.
                </p>
                <Button asChild size="sm" className="mt-4 rounded-full bg-red-500 hover:bg-red-600 text-white">
                  <a href="tel:+59171234567">
                    <Phone className="mr-2 h-3.5 w-3.5" /> Llamar ahora
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Mapa + redes */}
          <div className="space-y-4">
            <Reveal>
              {/* Mapa de Google */}
              <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-border/50">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120906.22627358516!2d-68.16834485!3d-16.5000095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915edf0e73e6b25b%3A0x3cb571f07b9a0f28!2sLa%20Paz%2C%20Bolivia!5e0!3m2!1ses!2sbo!4v1700000000000!5m2!1ses!2sbo"
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación Huellitas"
                />
              </div>
            </Reveal>

            {/* Redes sociales */}
            <Reveal delay={0.1}>
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Síguenos</p>
                <div className="grid grid-cols-3 gap-3">
                  {redes.map((r, i) => (
                    <motion.a key={r.label} href={r.href}
                      whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.03] transition-colors cursor-pointer">
                      <r.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                      <p className="text-xs font-semibold">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground text-center">{r.handle}</p>
                    </motion.a>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Horario rápido */}
            <Reveal delay={0.2}>
              <div className="p-6 rounded-2xl border border-border/50 bg-card">
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">Horario rápido</p>
                <div className="space-y-2">
                  {[
                    { dia: "Lunes — Viernes",  hora: "7:00 AM — 10:00 PM" },
                    { dia: "Sábados",           hora: "8:00 AM — 8:00 PM" },
                    { dia: "Domingos",          hora: "9:00 AM — 6:00 PM" },
                    { dia: "Urgencias",         hora: "24 horas / 7 días" },
                  ].map((h) => (
                    <div key={h.dia} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{h.dia}</span>
                      <span className="font-semibold tabular-nums">{h.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/50 py-24">
        <Reveal>
          <div className="max-w-screen-xl mx-auto px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              ¿Preferís agendar<br />una cita?
            </h2>
            <Button asChild size="lg" className="h-14 px-10 rounded-full font-semibold text-base hover:scale-105 transition-transform flex-shrink-0">
              <Link href="/registro">Crear cuenta gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
