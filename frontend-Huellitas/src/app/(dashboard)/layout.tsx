"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { useAuthStore } from "@/shared/store/useAuthStore";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { toast } from "sonner";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/shared/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Separator } from "@/shared/components/ui/separator";

import {
  LayoutDashboard,
  Dog,
  Settings,
  LogOut,
  User,
  Syringe,
  ShieldCheck,
  ClipboardList,
  Users,
  Stethoscope,
  Package,
  PawPrint,
  Bone,
  ShoppingCart,
  Wallet,
  CalendarPlus,
  Calendar,
  History,
  HeartPulse,
  BarChart2,
  Receipt,
  Bell,
  QrCode,
  Clock,
  FileText,
  UserCog,
  Home,
  Monitor,
  TrendingUp,
} from "lucide-react";

// ─── NAVEGACIÓN POR ROLES (1=Admin | 2=Veterinario | 3=Cajero | 4=Cliente) ───
const SIDEBAR_GROUPS = [
  // ── ADMIN ──────────────────────────────────────────────────
  {
    label: "Panel",
    roles: [1],
    items: [
      { title: "Dashboard",           href: "/admin/dashboard",           icon: LayoutDashboard, roles: [1] },
      { title: "Dashboard Ejecutivo", href: "/admin/dashboard/ejecutivo", icon: BarChart2,       roles: [1] },
    ],
  },
  {
    label: "Personal y RRHH",
    roles: [1],
    items: [
      { title: "Usuarios y Clientes", href: "/admin/personal/usuarios",  icon: UserCog,    roles: [1] },
      { title: "Roles",               href: "/admin/personal/roles",     icon: ShieldCheck, roles: [1] },
      { title: "Horarios",            href: "/admin/horarios",           icon: Clock,      roles: [1] },
    ],
  },
  {
    label: "Pacientes y Citas",
    roles: [1],
    items: [
      { title: "Mascotas",           href: "/admin/mascotas",           icon: Dog,         roles: [1] },
      { title: "Citas",              href: "/admin/citas",              icon: ClipboardList, roles: [1] },
    ],
  },
  {
    label: "Clínica",
    roles: [1],
    items: [
      { title: "Supervisión Clínica", href: "/admin/clinica", icon: HeartPulse, roles: [1] },
    ],
  },
  {
    label: "Inventario",
    roles: [1],
    items: [
      { title: "Inventario",         href: "/admin/inventario",         icon: Package,     roles: [1] },
      { title: "Categorías",         href: "/admin/catalogos/categorias", icon: Package,   roles: [1] },
      { title: "Especies",           href: "/admin/catalogos/especies", icon: PawPrint,    roles: [1] },
      { title: "Razas",              href: "/admin/catalogos/razas",    icon: Bone,        roles: [1] },
      { title: "Servicios",          href: "/admin/catalogos/servicios", icon: Stethoscope, roles: [1] },
      { title: "Vacunas",            href: "/admin/catalogos/vacunas",  icon: Syringe,     roles: [1] },
    ],
  },
  {
    label: "Finanzas y Reportes",
    roles: [1],
    items: [
      { title: "Cierres de Caja",    href: "/admin/cierres-caja",       icon: Receipt,     roles: [1] },
    ],
  },
  {
    label: "Sistema",
    roles: [1],
    items: [
      { title: "Notificaciones",     href: "/admin/notificaciones",     icon: Bell,        roles: [1] },
      { title: "Escaneos QR",        href: "/admin/escaneos-qr",        icon: QrCode,      roles: [1] },
      { title: "Configuración",      href: "/admin/configuracion",      icon: Settings,    roles: [1] },
      { title: "logs del sistema",      href: "/admin/logs",      icon: Settings,    roles: [1] },

    ],
  },

  // ── VETERINARIO ────────────────────────────────────────────
  {
    label: "Operaciones",
    roles: [2],
    items: [
      { title: "Dashboard Unificado", href: "/vet/dashboard",           icon: LayoutDashboard, roles: [2] },
      { title: "Agenda del Día",     href: "/vet/agenda",               icon: ClipboardList, roles: [2] },
      { title: "Mis Citas",          href: "/vet/citas",                icon: Calendar,    roles: [2] },
    ],
  },
  {
    label: "Gestión Clínica",
    roles: [2],
    items: [
      { title: "Expedientes",        href: "/vet/expediente",           icon: Stethoscope, roles: [2] },
      { title: "Historial Clínico",  href: "/vet/historial",            icon: FileText,    roles: [2] },
      { title: "Internados",         href: "/vet/hospitalizacion",      icon: HeartPulse,  roles: [2] },
      { title: "Mis Reportes",       href: "/vet/reportes",             icon: BarChart2,   roles: [2] },
    ],
  },

  // ── CAJERO ─────────────────────────────────────────────────
  {
    label: "Recepción",
    roles: [3],
    items: [
      { title: "Agenda / Citas",     href: "/caja/agenda",              icon: Calendar,     roles: [3] },
      { title: "Sala de Espera",     href: "/caja/sala-espera",         icon: Monitor,      roles: [3] },
      { title: "Recordatorios WA",   href: "/caja/recordatorios",       icon: Bell,         roles: [3] },
    ],
  },
  {
    label: "Caja",
    roles: [3],
    items: [
      { title: "Punto de Venta",     href: "/caja/pos",                 icon: ShoppingCart, roles: [3] },
      { title: "Mi Reporte",         href: "/caja/reporte",             icon: TrendingUp,   roles: [3] },
    ],
  },
  {
    label: "Inventario",
    roles: [3],
    items: [
      { title: "Inventario",         href: "/caja/inventario",          icon: Package,      roles: [3] },
    ],
  },

  // ── CLIENTE ────────────────────────────────────────────────
  {
    label: "Inicio",
    roles: [4],
    items: [
      { title: "Inicio",             href: "/cliente/inicio",           icon: Home,        roles: [4] },
    ],
  },
  {
    label: "Mi Cuenta",
    roles: [4],
    items: [
      { title: "Mi Perfil",          href: "/cliente/perfil",           icon: User,        roles: [4] },
      { title: "Mis Mascotas",       href: "/cliente/mascotas",         icon: Dog,         roles: [4] },
      { title: "Agendar Cita",       href: "/cliente/agendar",          icon: CalendarPlus, roles: [4] },
      { title: "Mi Historial",       href: "/cliente/historial",        icon: History,     roles: [4] },
      { title: "Mis Pagos",          href: "/cliente/pagos",            icon: Receipt,     roles: [4] },
    ],
  },
  {
    label: "Clinica",
    roles: [4],
    items: [
      { title: "Nuestros Servicios", href: "/cliente/servicios",        icon: Stethoscope, roles: [4] },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada correctamente");
    router.push("/login");
  };

  if (!user) return null;

  // ─── OBTENER ID DEL ROL (asumimos que user.rol.id es un número) ───
  const userRoleId: number = user?.rol?.id;

  return (
    <TooltipProvider>
      <SidebarProvider>
        {/* ─── SIDEBAR ─── */}
        <Sidebar variant="inset" className="border-r">
          <SidebarHeader className="h-14 border-b px-6">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold tracking-tight">Animal</span>
              <span className="text-xs text-muted-foreground">Vet</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4 space-y-4">
            {SIDEBAR_GROUPS.map((group) => {
              const filteredItems = group.items.filter((item) => item.roles.includes(userRoleId));
              if (filteredItems.length === 0) return null;

              return (
                <SidebarGroup key={group.label} className="p-0">
                  <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5">
                      {filteredItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={item.title}
                            className="h-8.5 rounded-lg hover:bg-sidebar-accent/50 active:bg-sidebar-accent"
                          >
                            <Link href={item.href} className="flex items-center gap-3 px-3">
                              <item.icon className="h-4 w-4 shrink-0 text-muted-foreground group-data-[active=true]:text-primary" />
                              <span className="text-sm font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>

          {/* Footer con perfil del cliente */}
          {userRoleId === 4 && (
            <SidebarFooter className="border-t p-3">
              <Link href="/cliente/perfil">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent/50 transition-colors cursor-pointer group">
                  <Avatar className="h-9 w-9 shrink-0 border border-border/50">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.nombres} />}
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {user?.nombres?.[0]}{user?.apellidos?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-none">
                      {user?.nombres} {user?.apellidos}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Ver mi perfil</p>
                  </div>
                  <User className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </SidebarFooter>
          )}
          {userRoleId !== 4 && <SidebarFooter />}
        </Sidebar>

        {/* ─── HEADER + CONTENIDO ─── */}
        <div className="flex flex-col flex-1 w-full min-h-screen">
          <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <Separator orientation="vertical" className="h-5" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{user?.nombres || "Usuario"}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {user?.rol?.nombre?.toLowerCase() || ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />

                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <Avatar className="h-8 w-8 cursor-pointer ring-offset-background transition-shadow hover:ring-2 hover:ring-ring hover:ring-offset-2">
                      {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.nombres} />}
                      <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                        {user?.nombres?.[0]}{user?.apellidos?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.nombres}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.rol?.nombre?.toLowerCase() || ""}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link href={userRoleId === 4 ? "/cliente/perfil" : "#"}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    {userRoleId === 1 && (
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Ajustes</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}