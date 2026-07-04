"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import {
  ArrowRight, HeartPulse, ShieldCheck, Clock, Stethoscope,
  PawPrint, Star, Users, Award, ArrowUpRight, Phone,
  Syringe, Microscope, Scissors, ShoppingBag,
} from "lucide-react";
import { useCounter } from "@/shared/hooks/useCounter";
import { useQuery } from "@tanstack/react-query";
import { servicesService } from "@/domains/billing/services/services.service";

/* ── Número animado ── */
function AnimatedNumber({ value, suffix = "", decimals = 0, duration = 1800, className = "" }: {
  value: number; suffix?: string; decimals?: number; duration?: number; className?: string;
}) {
  const { ref, value: count } = useCounter(value, duration, decimals);
  return (
    <span ref={ref} className={className}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  );
}

/* ── Reveal al hacer scroll ── */
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

// Iconos de fallback según nombre del servicio
function getServiceIcon(nombre: string) {
  const n = nombre.toLowerCase();
  if (n.includes("consulta") || n.includes("chequeo"))   return Stethoscope;
  if (n.includes("vacuna"))                               return Syringe;
  if (n.includes("laboratorio"))                         return Microscope;
  if (n.includes("grooming") || n.includes("estética"))  return Scissors;
  if (n.includes("urgencia") || n.includes("emergencia"))return Clock;
  if (n.includes("plan") || n.includes("preventivo"))    return ShieldCheck;
  return HeartPulse;
}

// Imágenes de fallback por índice
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=75",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=75",
  "https://images.unsplash.com/photo-1559000357-f6b52ddfbe37?w=400&q=75",
  "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=75",
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=75",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=75",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=75",
];

const stats = [
  { num: 500, suffix: "+", label: "Mascotas atendidas",   decimals: 0 },
  { num: 15,  suffix: "",  label: "Años de experiencia",  decimals: 0 },
  { num: 12,  suffix: "",  label: "Especialistas",         decimals: 0 },
  { num: 4.9, suffix: "",  label: "Calificación promedio", decimals: 1 },
];

const testimonials = [
  { name: "María García",   role: "Dueña de Max, Labrador",    quote: "Salvaron la vida de mi perro a las 3 AM. Su dedicación no tiene comparación.", stars: 5 },
  { name: "Carlos Mendoza", role: "Dueño de Luna, Rottweiler",  quote: "Los especialistas conocen la raza a la perfección. Luna siempre sale feliz.",   stars: 5 },
  { name: "Ana Rodríguez",  role: "Dueña de Michi, Gato persa", quote: "Paciencia y ternura que no encontré en ningún otro lugar de la ciudad.",         stars: 5 },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const textY   = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Servicios reales desde el backend
  const { data: serviciosData = [] } = useQuery({
    queryKey: ["servicios-landing"],
    queryFn: () => servicesService.getAll().catch(() => []),
  });
  const services = (serviciosData as any[])
    .filter((s) => !s.deletedAt)
    .slice(0, 7)
    .map((s, i) => ({
      title: s.nombre,
      desc:  s.descripcion || "Servicio profesional garantizado por nuestro equipo.",
      icon:  getServiceIcon(s.nombre),
      img:   s.imagen_url || FALLBACK_IMGS[i % FALLBACK_IMGS.length],
      precio: Number(s.precio).toFixed(2),
    }));

  return (
    <div className="flex flex-col w-full bg-background text-foreground">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative w-full h-screen overflow-hidden">

        {/* Video */}
        <div className="absolute inset-0">
          <video
            src="/assets/14863901_3840_2160_30fps.mp4"
            autoPlay muted loop playsInline
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.72) saturate(1.1)" }}
          />
          {/* overlay sutil en la parte inferior para transición */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Contenido */}
        <motion.div style={{ y: textY, opacity }}
          className="relative h-full flex flex-col justify-center px-6 md:px-16 max-w-screen-xl mx-auto w-full">

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-medium tracking-[0.2em] uppercase text-white/60 mb-5">
            Clínica Veterinaria — Desde 2009
          </motion.p>

          {/* Título + stats lado a lado */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-6xl md:text-[90px] lg:text-[100px] font-black leading-[0.92] tracking-tighter text-white">
              El mejor<br />
              cuidado para<br />
              tu mascota.
            </motion.h1>

            {/* Stats a la derecha del título */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="hidden lg:flex flex-col gap-6 border-l border-white/15 pl-10 pb-2">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-black text-white leading-none">
                    <AnimatedNumber value={s.num} suffix={s.suffix} decimals={s.decimals} duration={1600} />
                  </p>
                  <p className="text-xs text-white/45 tracking-widest uppercase mt-1.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex items-center gap-4">
            <Button asChild size="lg"
              className="h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-sm transition-all hover:scale-105">
              <Link href="/registro">Agendar Cita <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost" size="lg"
              className="h-12 px-8 rounded-full text-white border border-white/25 hover:bg-white/10 font-semibold text-sm">
              <Link href="/servicios">Ver Servicios</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Línea scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div
            animate={{ height: ["16px", "32px", "16px"] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-px bg-white/30" />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          INTRO — frase de impacto
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 px-6 md:px-16 max-w-screen-xl mx-auto">
        <Reveal>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6">
            Nuestra filosofía
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] max-w-4xl">
            Cada mascota merece atención médica de primer nivel.{" "}
            <span className="text-primary">Sin compromisos.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-col md:flex-row gap-8 mt-12 md:mt-16 border-t border-border/50 pt-12">
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              En Huellitas combinamos tecnología de punta con un trato humano y cercano.
              Nuestro equipo de especialistas está disponible todos los días del año,
              porque la salud de tu compañero no puede esperar.
            </p>
            <div className="md:ml-auto flex-shrink-0">
              <Button asChild variant="outline" className="rounded-full h-12 px-8 group">
                <Link href="/nosotros">
                  Conocer el equipo
                  <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════
          STATS — banda
      ══════════════════════════════════════════ */}
      <section className="w-full border-y border-border/50 py-12 px-6 md:px-16">
        <div className="max-w-screen-xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div>
                <p className="text-5xl font-black tracking-tighter text-foreground">
                  <AnimatedNumber value={s.num} suffix={s.suffix} decimals={s.decimals} duration={2000} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICIOS — cards con imagen de fondo
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 border-t border-border/50">
        <div className="px-6 md:px-16 max-w-screen-xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Servicios</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                Todo lo que<br />necesitan.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <Button asChild variant="outline" className="rounded-full h-11 px-7 group self-start md:self-auto">
                <Link href="/servicios">
                  Ver todos
                  <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {/* Grid: 1 card grande + 6 pequeñas */}
          {services.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-[180px] rounded-2xl bg-muted animate-pulse ${i === 0 ? "col-span-2 row-span-2 h-[380px]" : ""}`} />
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-auto gap-3">

            {/* Card grande — primer servicio */}
            {(() => {
              const FeaturedIcon = services[0]?.icon ?? HeartPulse;
              return (
                <Reveal className="col-span-2 row-span-2">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="group relative h-[380px] md:h-full min-h-[320px] rounded-3xl overflow-hidden cursor-default"
                  >
                    <Image src={services[0]?.img ?? FALLBACK_IMGS[0]} alt={services[0]?.title ?? ""} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 p-7 flex flex-col justify-between">
                      <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
                        <FeaturedIcon className="h-5 w-5 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-white/50 tracking-widest uppercase mb-2">Disponible ahora</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">{services[0]?.title}</h3>
                        <p className="text-sm text-white/70 mt-1">{services[0]?.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              );
            })()}

            {/* Cards pequeñas */}
            {services.slice(1, 7).map((svc, i) => (
              <Reveal key={svc.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="group relative h-[180px] rounded-2xl overflow-hidden cursor-default"
                >
                  <Image src={svc.img} alt={svc.title} fill className="object-cover group-hover:scale-110 transition-transform duration-600" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
                      <svc.icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{svc.title}</h3>
                      <p className="text-xs text-white/60 mt-0.5 hidden md:block">{svc.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GALERÍA — fotos de la clínica
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 border-t border-border/50 px-6 md:px-16 max-w-screen-xl mx-auto">
        <Reveal>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Nuestras instalaciones
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-12">
            Un espacio pensado<br />para ellos.
          </h2>
        </Reveal>

        <div className="grid grid-cols-12 grid-rows-2 gap-3 h-[520px]">
          {/* Imagen grande izquierda */}
          <Reveal className="col-span-7 row-span-2">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=900&q=80"
                alt="Veterinaria atendiendo perro"
                fill className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </Reveal>

          {/* Imagen arriba derecha */}
          <Reveal delay={0.1} className="col-span-5 row-span-1">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=700&q=80"
                alt="Perro en consulta"
                fill className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </Reveal>

          {/* Imagen abajo derecha */}
          <Reveal delay={0.2} className="col-span-5 row-span-1">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=700&q=80"
                alt="Perro feliz"
                fill className="object-cover object-top hover:scale-105 transition-transform duration-700"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURE — imagen + texto
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 border-t border-border/50">
        <div className="px-6 md:px-16 max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          <Reveal>
            <div className="space-y-6">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                ¿Por qué Huellitas?
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                Tecnología.<br />Experiencia.<br />
                <span className="text-primary">Dedicación.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
                Contamos con equipos de diagnóstico de última generación y un equipo médico
                que se actualiza constantemente para brindarte lo mejor.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  { icon: Clock,      text: "Urgencias disponibles 24 horas, 7 días a la semana" },
                  { icon: Award,      text: "Veterinarios certificados con posgrado especializado" },
                  { icon: HeartPulse, text: "Ecógrafo, laboratorio y radiología propios" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={1.5} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Foto + métricas */}
          <Reveal delay={0.15}>
            <div className="space-y-3">
              <div className="relative w-full h-56 rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1559000357-f6b52ddfbe37?w=800&q=80"
                  alt="Equipo veterinario"
                  fill className="object-cover"
                />
              </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Satisfacción",   num: 98,  suffix: "%", decimals: 0, sub: "de nuestros clientes" },
                { label: "Casos resueltos",num: 95,  suffix: "%", decimals: 0, sub: "en primera visita" },
                { label: "Disponibilidad", num: 24,  suffix: "/7",decimals: 0, sub: "urgencias y emergencias" },
                { label: "Especialidades", num: 8,   suffix: "",  decimals: 0, sub: "áreas médicas cubiertas" },
              ].map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-6 rounded-2xl border border-border/60 bg-card">
                  <p className="text-4xl font-black tracking-tighter text-primary">
                    <AnimatedNumber value={item.num} suffix={item.suffix} decimals={item.decimals} duration={1600} />
                  </p>
                  <p className="font-semibold text-sm mt-1">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                </motion.div>
              ))}
            </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIOS
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 border-t border-border/50 px-6 md:px-16 max-w-screen-xl mx-auto">
        <Reveal>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Testimonios
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-12">
            Lo que dicen las familias.
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-8 rounded-2xl border border-border/60 bg-card h-full flex flex-col justify-between gap-6">
                <div>
                  <div className="flex gap-1 mb-4">
                    {Array(t.stars).fill(0).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                    <Image
                      src={`https://images.unsplash.com/photo-${["1438761681033-6461ffad8d80","1507003211169-0a1dd7228f2d","1494790108377-be9c29b29330"][testimonials.indexOf(t)]}?w=80&q=80`}
                      alt={t.name} fill className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PETSHOP
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 border-t border-border/50">
        <div className="max-w-screen-xl mx-auto px-6 md:px-16">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Petshop</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                Todo para<br />tu mascota.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-sm">
                Croquetas premium, juguetes, accesorios y mucho más. Encuentra todo lo que necesita tu compañero en un solo lugar.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <Button asChild variant="outline" className="rounded-full h-11 px-7 group self-start md:self-auto">
                <Link href="/registro">
                  Ver tienda <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {/* Grid de categorías */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Alimento Premium",  sub: "Croquetas y latas",         img: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=75", badge: "Más vendido" },
              { label: "Juguetes",          sub: "Diversión garantizada",      img: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=500&q=75", badge: null },
              { label: "Accesorios",        sub: "Collares, correas y más",    img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&q=75", badge: "Nuevo" },
              { label: "Higiene y Salud",   sub: "Shampoos y vitaminas",       img: "https://images.unsplash.com/photo-1512237798647-84b57b22b517?w=500&q=75", badge: null },
            ].map((cat, i) => (
              <Reveal key={cat.label} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer h-52">
                  <Image src={cat.img} alt={cat.label} fill className="object-cover group-hover:scale-110 transition-transform duration-600" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  {cat.badge && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {cat.badge}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm">{cat.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{cat.sub}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Banner promo */}
          <Reveal delay={0.3}>
            <motion.div whileHover={{ scale: 1.005 }} transition={{ type: "spring", stiffness: 300 }}
              className="group relative mt-3 rounded-2xl overflow-hidden h-36 cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&q=75"
                alt="Petshop Huellitas"
                fill className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.55)" }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-8">
                <div>
                  <p className="text-white font-black text-2xl tracking-tight">10% OFF en tu primera compra</p>
                  <p className="text-white/60 text-sm mt-1">Regístrate y recibe tu descuento de bienvenida</p>
                </div>
                <Button asChild size="sm" className="rounded-full bg-white text-black hover:bg-white/90 flex-shrink-0 hidden sm:flex">
                  <Link href="/registro">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Aprovechar
                  </Link>
                </Button>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="w-full py-24 md:py-32 border-t border-border/50 px-6 md:px-16">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <Reveal>
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                Empieza hoy
              </p>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight max-w-xl">
                Tu mascota<br />nos necesita.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg"
                className="h-14 px-10 rounded-full font-semibold text-base hover:scale-105 transition-transform">
                <Link href="/registro">
                  Crear cuenta gratis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline"
                className="h-14 px-10 rounded-full font-semibold text-base hover:scale-105 transition-transform">
                <Link href="/contacto">
                  <Phone className="mr-2 h-5 w-5" /> Llamar ahora
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Banda de servicios al pie */}
        <div className="max-w-screen-xl mx-auto mt-20 pt-12 border-t border-border/40 overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 whitespace-nowrap">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12 items-center">
                {["Urgencias 24/7","Laboratorio propio","Vacunación","Grooming","Hospitalización","Cardiología","Cirugía","Odontología veterinaria"].map((item) => (
                  <span key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <PawPrint className="h-3 w-3 text-primary flex-shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
