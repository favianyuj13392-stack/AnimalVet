import React from "react";
import Link from "next/link";
import { PawPrint, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/40 border-t border-border mt-auto">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* COLUMNA 1: Marca y Bio */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">Huellitas</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cuidamos a los miembros más peludos de tu familia con tecnología de punta y el amor que merecen.
            </p>
            <div className="flex gap-4 mt-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              </Button>
            </div>
          </div>

          {/* COLUMNA 2: Enlaces Rápidos */}
          <div className="flex flex-col gap-4 lg:pl-8">
            <h3 className="font-semibold text-foreground">Explorar</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/servicios" className="text-sm text-muted-foreground hover:text-primary transition-colors">Servicios Veterinarios</Link></li>
              <li><Link href="/emergencias" className="text-sm text-muted-foreground hover:text-primary transition-colors">Emergencias 24/7</Link></li>
              <li><Link href="/nosotros" className="text-sm text-muted-foreground hover:text-primary transition-colors">Nuestro Equipo</Link></li>
              <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog y Consejos</Link></li>
            </ul>
          </div>

          {/* COLUMNA 3: Contacto */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-foreground">Contacto</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Av. Principal 123, Zona Sur<br />La Paz, Bolivia</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+591 2 2123456</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>hola@huellitas.com</span>
              </li>
            </ul>
          </div>

          {/* COLUMNA 4: Boletín (Newsletter) */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-foreground">Boletín Peludo</h3>
            <p className="text-sm text-muted-foreground">
              Suscríbete para recibir consejos de salud y promociones exclusivas.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <Input 
                type="email" 
                placeholder="tu@email.com" 
                className="bg-background"
              />
              <Button className="w-full">Suscribirme</Button>
            </div>
          </div>

        </div>

        <Separator className="my-8" />

        {/* COPYRIGHT */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Clínica Veterinaria Huellitas. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</Link>
            <Link href="/terminos" className="hover:text-primary transition-colors">Términos de Servicio</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}