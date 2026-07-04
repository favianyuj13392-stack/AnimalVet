import React from "react";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck, Clock, CalendarHeart } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function InicioPage() {
  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-500">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-24 pb-32">
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
          <BadgeHero />
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight text-foreground">
            Amor, cuidado y ciencia <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              para tu mejor amigo
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            El sistema de salud veterinaria más avanzado. Desde consultas generales hasta cirugías de alta complejidad, todo respaldado por tecnología de punta y un equipo médico de excelencia.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="rounded-full text-base h-14 px-8 shadow-lg shadow-primary/25 gap-2" asChild>
              <Link href="/registro">
                Portal de Clientes <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8 border-primary/20 hover:bg-primary/5" asChild>
              <Link href="/servicios">Ver Servicios</Link>
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* QUICK FEATURES */}
      <section className="py-20 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Clock} 
              title="Atención 24/7" 
              desc="Emergencias y hospitalización monitoreada a toda hora. Tu tranquilidad no tiene horario." 
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Historial Digital" 
              desc="Acceso instantáneo a vacunas, recetas y estudios de tu mascota escaneando su QR de identidad." 
            />
            <FeatureCard 
              icon={HeartPulse} 
              title="Cirugía Especializada" 
              desc="Quirófanos equipados con tecnología de monitoreo avanzado y anestesia inhalatoria segura." 
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIAL PREVIEW */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-3xl font-black tracking-tight mb-12">Familias Felices</h2>
          <div className="max-w-3xl mx-auto bg-card p-8 rounded-3xl border border-border/50 shadow-sm relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary bg-primary/10 p-3 rounded-2xl">
              <CalendarHeart className="h-8 w-8" />
            </div>
            <p className="text-xl italic text-muted-foreground mt-4 mb-6">
              "El nivel de organización es increíble. Traje a mi Beagle, Pardo, para un chequeo de rutina y me sorprendió cómo el sistema ya tenía todo su historial y próximas vacunas listas en mi celular. ¡Excelente servicio!"
            </p>
            <p className="font-bold">— Familia Mendoza</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function BadgeHero() {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
      <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
      Clínica Veterinaria Digital
    </span>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-3xl border border-border/50 bg-card hover:shadow-md transition-all hover:border-primary/30 group">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}