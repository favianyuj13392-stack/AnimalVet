"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/shared/components/ui/sheet";
import { Menu } from "lucide-react";

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Inicio",            href: "/" },
    { name: "Servicios",         href: "/servicios" },
    { name: "Mascotas Perdidas", href: "/mascotas-perdidas" },
    { name: "Nosotros",          href: "/nosotros" },
    { name: "Contacto",          href: "/contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center transition-transform hover:scale-105">
          <Image
            src="/assets/Diseño sin título-Photoroom.png"
            alt="Huellitas"
            width={120}
            height={52}
            className="object-contain h-12 w-auto"
          />
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* BOTONES DESKTOP & THEME TOGGLE */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/registro">Agendar Cita</Link>
            </Button>
          </div>
        </div>

        {/* MENÚ MÓVIL (Usa el Sheet de Shadcn) */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Image src="/assets/Diseño sin título-Photoroom.png" alt="Huellitas" width={100} height={44} className="object-contain h-10 w-auto" />
                  Huellitas
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login" onClick={() => setIsOpen(false)}>Iniciar Sesión</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/registro" onClick={() => setIsOpen(false)}>Agendar cita</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}