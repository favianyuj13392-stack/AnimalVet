# 🐾 Huellitas Digitales — Frontend

Aplicación web construida con **Next.js 15** y **TailwindCSS** para la gestión integral de una clínica veterinaria. Incluye portales diferenciados para Admin, Veterinario, Cajero y Cliente, además de páginas públicas.

---

## Tecnologías

- **Next.js 15** — Framework React con App Router
- **TailwindCSS** — Estilos utilitarios
- **shadcn/ui** — Componentes de interfaz
- **Zustand** — Manejo de estado global
- **React Hook Form + Zod** — Formularios y validaciones
- **Cloudinary** — Subida y gestión de imágenes
- **Leaflet** — Mapas interactivos

---

## Portales y pantallas

### Admin
- Dashboard ejecutivo con métricas
- Gestión de personal, clientes y roles
- Catálogos: especies, razas, vacunas, servicios, categorías
- Citas y horarios de atención
- Módulo clínico y expedientes
- Inventario, kardex y lotes de caducidad
- Caja y cierres
- Reportes, logs del sistema, notificaciones y escaneos QR
- Configuración de la clínica

### Veterinario
- Agenda y listado de citas
- Consulta médica con notas clínicas y signos vitales
- Expediente clínico del paciente
- Recetas y vacunas aplicadas
- Gestión de hospitalizaciones con monitoreo diario
- Historial clínico completo

### Cajero
- POS (punto de venta)
- Sala de espera y agenda
- Inventario y reportes de caja

### Cliente
- Inicio personalizado
- Registro y gestión de mascotas
- Detalle de mascota con historial, vacunas y QR de emergencia
- Agendar citas
- Historial de consultas y pagos
- Perfil personal

### Público
- Página de inicio
- Servicios, nosotros y contacto
- Registro de nuevos clientes
- Ficha de emergencia QR (acceso sin login)
- Mascotas perdidas

---

## Requisitos

- Node.js >= 18
- Backend de Huellitas corriendo (ver [Backend README](https://github.com/huellitas-digitales/Backend-huellitas))
- Cuenta en [Cloudinary](https://cloudinary.com) para subida de imágenes

---

## Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/huellitas-digitales/frontend-Huellitas.git
cd frontend-Huellitas

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env.local
# Edita el archivo .env.local con tus datos

# 4. Corre el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## Variables de entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (ej. `http://localhost:3001`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre de tu cloud en Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Preset de subida sin firmar en Cloudinary |

> Las variables con prefijo `NEXT_PUBLIC_` son visibles en el navegador. No pongas secretos en ellas.

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con hot-reload
npm run build     # Compilar para producción
npm run start     # Servidor en modo producción
npm run lint      # Verificar el código con ESLint
```

---

## Estructura del proyecto

```
src/
├── app/                        # Rutas (App Router de Next.js)
│   ├── (public)/               # Páginas públicas sin login
│   └── (dashboard)/            # Páginas privadas por rol
│       ├── admin/
│       ├── vet/
│       ├── caja/
│       └── cliente/
├── domains/                    # Lógica de negocio por dominio
│   ├── pets/
│   ├── users/
│   ├── clinical/
│   ├── billing/
│   ├── inventory/
│   ├── appointments/
│   └── admin/
├── shared/                     # Componentes, hooks y utils compartidos
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── store/
└── lib/
    └── validations/            # Schemas Zod
```

---

## Licencia

Proyecto académico — Huellitas Digitales © 2026
