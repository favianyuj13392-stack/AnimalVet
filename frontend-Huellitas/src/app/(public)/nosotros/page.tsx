"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Target, Eye, Heart, Award, Users, Clock, ArrowRight, ArrowUpRight, Stethoscope } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import api from "@/shared/lib/axios";

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

const valores = [
  { icon: Target, label: "Misión",  texto: "Brindar atención veterinaria integral e innovadora, garantizando diagnósticos precisos y tratamientos efectivos mediante el uso responsable de la tecnología." },
  { icon: Eye,    label: "Visión",  texto: "Ser el hospital veterinario de referencia nacional, pionero en la implementación de historias clínicas inteligentes y telemedicina preventiva." },
  { icon: Heart,  label: "Valores", texto: "Empatía inquebrantable, ética médica, transparencia en cada diagnóstico y amor incondicional por cada paciente que cruza nuestras puertas." },
];

const cifras = [
  { value: "15+", label: "Años de experiencia", icon: Award },
  { value: "500+", label: "Mascotas atendidas",  icon: Users },
  { value: "24/7", label: "Disponibilidad",       icon: Clock },
];

interface Veterinario {
  id: string;
  nombres: string;
  apellidos: string;
  avatar_url: string | null;
  rol: string;
}

// Avatares por defecto de DiceBear para cuando no hay foto
const defaultAvatar = (nombre: string) =>
  `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;

export default function NosotrosPage() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loadingVets, setLoadingVets]   = useState(true);

  useEffect(() => {
    api.get('/publico/veterinarios')
      .then(res => setVeterinarios(res.data))
      .catch(() => setVeterinarios([]))
      .finally(() => setLoadingVets(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ── */}
      <section className="relative w-full h-[55vh] min-h-[400px] overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1600&q=80"
            alt="Equipo Huellitas"
            fill className="object-cover object-top"
            style={{ filter: "brightness(0.5) saturate(1.1)" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-16 pb-16">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-white/50 mb-3">
            Quiénes somos
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.95]">
            Pasión por<br />la salud animal.
          </motion.h1>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-16 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">Nuestra historia</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight mb-6">
              Nacimos para<br />cambiar la veterinaria.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Desde 2009, Huellitas fusiona medicina veterinaria de excelencia con tecnología de gestión de clase mundial. Creemos que la innovación salva vidas cuando se pone al servicio de la salud animal.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="grid grid-cols-3 gap-4">
              {cifras.map((c) => (
                <div key={c.label} className="p-6 rounded-2xl border border-border/60 bg-card text-center">
                  <c.icon className="h-5 w-5 text-primary mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-3xl font-black tracking-tighter">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MISIÓN / VISIÓN / VALORES ── */}
      <section className="border-t border-border/50 py-20 md:py-28">
        <div className="max-w-screen-xl mx-auto px-6 md:px-16">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">Filosofía</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-12">Lo que nos mueve.</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {valores.map((v, i) => (
              <Reveal key={v.label} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}
                  className="p-8 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors h-full">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <v.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">{v.label}</p>
                  <p className="text-foreground leading-relaxed">{v.texto}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="border-t border-border/50 py-20 md:py-28">
        <div className="max-w-screen-xl mx-auto px-6 md:px-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Equipo</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Las manos<br />que cuidan.</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <Button asChild variant="outline" className="rounded-full h-11 px-7 group self-start">
                <Link href="/registro">
                  Agendar cita
                  <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {loadingVets ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/60 bg-card animate-pulse">
                  <div className="h-56 bg-muted/40" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-muted/60 rounded w-3/4" />
                    <div className="h-3 bg-muted/40 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : veterinarios.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/50 rounded-3xl text-muted-foreground">
              <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-foreground">Equipo en camino</p>
              <p className="text-xs mt-1">Pronto conocerás a nuestros especialistas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {veterinarios.map((v, i) => (
                <Reveal key={v.id} delay={i * 0.08}>
                  <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}
                    className="group rounded-2xl overflow-hidden border border-border/60 bg-card hover:border-primary/30 transition-colors">
                    <div className="relative h-56 overflow-hidden bg-muted/20">
                      <Image
                        src={v.avatar_url ?? defaultAvatar(`${v.nombres} ${v.apellidos}`)}
                        alt={`${v.nombres} ${v.apellidos}`}
                        fill
                        className={`${v.avatar_url ? 'object-cover object-top' : 'object-contain p-4'} group-hover:scale-105 transition-transform duration-500`}
                      />
                      {v.avatar_url && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-base">
                        Dr{v.nombres.endsWith('a') ? 'a' : ''}. {v.nombres} {v.apellidos}
                      </h3>
                      <p className="text-primary text-xs font-medium mt-0.5 flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" /> Veterinario/a
                      </p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/50 py-24">
        <Reveal>
          <div className="max-w-screen-xl mx-auto px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              ¿Listo para conocernos?
            </h2>
            <Button asChild size="lg" className="h-14 px-10 rounded-full font-semibold text-base hover:scale-105 transition-transform flex-shrink-0">
              <Link href="/registro">Agendar Cita <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
