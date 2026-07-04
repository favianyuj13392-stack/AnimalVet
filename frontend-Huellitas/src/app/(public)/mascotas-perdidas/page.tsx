"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Phone, Search, ArrowRight, AlertTriangle, Heart, Gift, Loader2, QrCode, Share2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import api from "@/shared/lib/axios";

const BASE_URL = "https://huellitas-digitales.net";

function buildShareText(m: { nombre: string; raza: string; especie: string; zona: string; telefono_contacto: string | null; hash_qr_identidad: string }) {
  const url = `${BASE_URL}/emergencia/${m.hash_qr_identidad}`;
  return `🐾 ¡Ayuda a encontrar a ${m.nombre}!\n${m.especie} ${m.raza} | Zona: ${m.zona}${m.telefono_contacto ? `\nContacto: ${m.telefono_contacto}` : ""}\n\nVer ficha completa: ${url}`;
}

function ShareButtons({ mascota }: { mascota: { nombre: string; raza: string; especie: string; zona: string; telefono_contacto: string | null; hash_qr_identidad: string } }) {
  const url   = `${BASE_URL}/emergencia/${mascota.hash_qr_identidad}`;
  const texto = buildShareText(mascota);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(texto)}`,
      color: "bg-[#25D366] hover:bg-[#1ebe5c]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.548 4.108 1.51 5.843L.057 23.625a.75.75 0 0 0 .918.918l5.782-1.453A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22.5c-1.98 0-3.84-.54-5.435-1.48l-.39-.23-4.04 1.015 1.015-4.04-.23-.39A10.434 10.434 0 0 1 1.5 12C1.5 6.21 6.21 1.5 12 1.5S22.5 6.21 22.5 12 17.79 22.5 12 22.5z"/>
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(texto)}`,
      color: "bg-[#1877F2] hover:bg-[#0d6de0]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}`,
      color: "bg-black hover:bg-zinc-800",
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
        <Share2 className="h-3 w-3" /> Compartir:
      </span>
      {links.map(l => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
          title={`Compartir en ${l.label}`}
          className={`h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${l.color}`}>
          {l.icon}
        </a>
      ))}
    </div>
  );
}

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

interface MascotaPerdida {
  id: string;
  hash_qr_identidad: string;
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  foto_url: string | null;
  caracteristicas_fisicas: string | null;
  zona: string;
  fecha_extravío: string;
  telefono_contacto: string | null;
  mensaje_encontrador: string | null;
  recompensa: boolean;
}

export default function MascotasPerdidasPage() {
  const [mascotas, setMascotas]     = useState<MascotaPerdida[]>([]);
  const [loading, setLoading]       = useState(true);
  const [busqueda, setBusqueda]     = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("todas");

  useEffect(() => {
    api.get("/publico/mascotas/perdidas")
      .then(res => setMascotas(res.data))
      .catch(() => setMascotas([]))
      .finally(() => setLoading(false));
  }, []);

  const especies = ["todas", ...Array.from(new Set(mascotas.map(m => m.especie)))];

  const visibles = mascotas.filter(m => {
    const matchBusqueda = busqueda === "" ||
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.zona.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.caracteristicas_fisicas?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
    const matchEspecie = filtroEspecie === "todas" || m.especie === filtroEspecie;
    return matchBusqueda && matchEspecie;
  });

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" });
    } catch { return fecha; }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ── */}
      <section className="relative w-full h-[48vh] min-h-[340px] overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1600&q=80"
            alt="Mascotas perdidas" fill className="object-cover object-center"
            style={{ filter: "brightness(0.45) saturate(0.9)" }} priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-16 pb-14">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-white/50 mb-3">
            Comunidad Huellitas
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.95]">
            Mascotas<br />Perdidas.
          </motion.h1>
        </div>
      </section>

      {/* ── BANNER ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-16 pt-10">
        <Reveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-primary/8 border border-primary/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">¿Encontraste una mascota con placa QR?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Escanea el código QR de su collar para ver sus datos y contactar al dueño de inmediato.</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-full flex-shrink-0 gap-2">
              <Link href="/registro">
                <QrCode className="h-3.5 w-3.5" /> Registrar mi mascota
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ── FILTROS ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-16 py-8">
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Búsqueda */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, zona, raza..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 h-10 rounded-full border border-border/60 bg-card text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            {/* Filtro especie */}
            <div className="flex gap-2 flex-wrap">
              {especies.map(e => (
                <button key={e} onClick={() => setFiltroEspecie(e)}
                  className={`h-9 px-4 rounded-full text-xs font-semibold transition-all capitalize ${
                    filtroEspecie === e
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/60 text-muted-foreground hover:border-primary/40"
                  }`}>
                  {e === "todas" ? "Todas" : e}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="text-xs text-muted-foreground mt-4">
            {loading ? "Cargando..." : (
              <>Mostrando <span className="font-semibold text-foreground">{visibles.length}</span> mascota{visibles.length !== 1 ? "s" : ""} extraviada{visibles.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </Reveal>
      </section>

      {/* ── GRID ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-16 pb-24">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Cargando mascotas extraviadas...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibles.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-24 border border-dashed border-border/50 rounded-3xl text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-foreground">
                  {mascotas.length === 0 ? "No hay mascotas extraviadas registradas" : "No hay resultados para tu búsqueda"}
                </p>
                <p className="text-xs mt-1">
                  {mascotas.length === 0
                    ? "¡Buenas noticias! Todas las mascotas están a salvo."
                    : "Intenta con otro término de búsqueda."}
                </p>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {visibles.map((m, i) => (
                  <motion.div key={m.id} layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}>
                    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}
                      className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-destructive/30 hover:shadow-lg transition-all h-full flex flex-col">

                      {/* Imagen */}
                      <div className="relative h-44 overflow-hidden bg-muted/40">
                        {m.foto_url ? (
                          <Image
                            src={m.foto_url} alt={m.nombre} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl font-black text-muted-foreground/20">{m.nombre.charAt(0)}</span>
                          </div>
                        )}
                        {/* Badge perdido */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/90 text-white">
                          <AlertTriangle className="h-3 w-3" /> Extraviado
                        </div>
                        {/* Badge recompensa */}
                        {m.recompensa && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white">
                            <Gift className="h-3 w-3" /> Recompensa
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 flex flex-col flex-1 gap-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-lg tracking-tight">{m.nombre}</h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">{m.especie}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.raza} · {m.sexo}</p>
                        </div>

                        {m.caracteristicas_fisicas && (
                          <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">
                            {m.caracteristicas_fisicas}
                          </p>
                        )}

                        {m.mensaje_encontrador && (
                          <p className="text-xs italic text-muted-foreground/80 line-clamp-2 border-l-2 border-primary/30 pl-2">
                            "{m.mensaje_encontrador}"
                          </p>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="truncate">{m.zona}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                            <span>{formatFecha(m.fecha_extravío)}</span>
                          </div>
                          {m.telefono_contacto && (
                            <a href={`tel:${m.telefono_contacto}`}
                              className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{m.telefono_contacto}</span>
                            </a>
                          )}
                        </div>

                        {/* Compartir en redes */}
                        <div className="pt-1 border-t border-border/40">
                          <ShareButtons mascota={m} />
                        </div>

                        {/* Botón ver ficha QR */}
                        <Link
                          href={`/emergencia/${m.hash_qr_identidad}`}
                          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors border border-destructive/20"
                        >
                          <QrCode className="h-3.5 w-3.5" /> Ver ficha completa
                        </Link>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/50 py-24">
        <Reveal>
          <div className="max-w-screen-xl mx-auto px-6 md:px-16 text-center">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">¿Necesitas ayuda?</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
              Juntos los encontramos.
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Regístrate gratis en Huellitas para que tu mascota tenga placa QR y aparezca aquí si alguna vez se extravía.
            </p>
            <Button asChild size="lg" className="h-14 px-10 rounded-full font-semibold text-base hover:scale-105 transition-transform">
              <Link href="/registro">Crear cuenta gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
