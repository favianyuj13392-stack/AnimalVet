# 🐾 Huellitas Digitales — Backend

API REST construida con **NestJS** y **TypeORM** para la gestión integral de una clínica veterinaria. Incluye módulos de identidad, clínica, inventario, caja, comunicación y un bot conversacional con IA.

---

## Tecnologías

- **NestJS** — Framework backend en TypeScript
- **TypeORM** — ORM para PostgreSQL
- **PostgreSQL / Supabase** — Base de datos
- **JWT** — Autenticación con roles
- **Twilio** — Notificaciones por WhatsApp
- **Nodemailer** — Envío de correos electrónicos
- **Google Gemini** — Motor del bot conversacional con IA
- **WebSockets** — Actualizaciones en tiempo real (citas)

---

## Módulos

| Módulo | Descripción |
|---|---|
| `identidad` | Usuarios, mascotas, autenticación y roles |
| `core` | Catálogos: especies, razas, vacunas, servicios, configuración |
| `clinica` | Citas, historial, expediente, recetas, hospitalizaciones, vacunas aplicadas |
| `inventario` | Productos, lotes de caducidad, kardex |
| `caja` | Transacciones, detalles y cierres de caja |
| `comunicacion` | Notificaciones, escaneos QR, mensajero WhatsApp, scheduler |
| `reportes` | Reportes clínicos y financieros |
| `bot-api` | Endpoint para el bot conversacional (integrado con n8n y Gemini) |

---

## Requisitos

- Node.js >= 18
- PostgreSQL (local) o cuenta en [Supabase](https://supabase.com)
- Cuenta en [Twilio](https://twilio.com) para WhatsApp
- Cuenta de Gmail con App Password para emails
- API Key de [Google Gemini](https://aistudio.google.com/app/apikey) para el bot

---

## Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/huellitas-digitales/Backend-huellitas.git
cd Backend-huellitas

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env
# Edita el archivo .env con tus credenciales

# 4. Corre el servidor
npm run start:dev
```

El servidor estará disponible en `http://localhost:3001`.

---

## Variables de entorno

Copia el archivo `.env.example` a `.env` y completa cada variable:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DB_HOST` | Host de la base de datos (localhost o Supabase) |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `TWILIO_ACCOUNT_SID` | SID de tu cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticación de Twilio |
| `EMAIL_USER` | Tu correo Gmail |
| `EMAIL_PASS` | App Password de Gmail (no tu contraseña normal) |
| `GEMINI_API_KEY` | API Key de Google Gemini para el bot |
| `BOT_API_KEY` | Clave compartida entre el backend y n8n |

> Nunca subas tu archivo `.env` al repositorio. Ya está incluido en `.gitignore`.

---

## Bot conversacional

El bot está disponible en `POST /bot-api/mensaje` y permite a los clientes:

- Consultar el estado de sus citas
- Agendar y cancelar citas
- Recibir información sobre servicios y precios
- Hacer preguntas generales sobre la clínica

Usa **Google Gemini** como motor de IA y se integra con **n8n** como orquestador de flujos. La comunicación entre n8n y el backend se autentica mediante `BOT_API_KEY`.

Para activarlo necesitas:
1. Una API Key de Gemini en el `.env`
2. Configurar el flujo de n8n apuntando a tu backend
3. Conectar Twilio para recibir y enviar mensajes por WhatsApp

---

## Supabase (producción)

Si usas Supabase como base de datos, actualiza estas variables en `.env`:

```env
DB_HOST=db.<project-ref>.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_NAME=postgres
DB_PASSWORD=tu_password_supabase
```

---

## Scripts disponibles

```bash
npm run start:dev     # Servidor en modo desarrollo con hot-reload
npm run start:prod    # Servidor en modo producción
npm run build         # Compilar el proyecto
npm run test          # Tests unitarios
npm run test:e2e      # Tests end-to-end
```

---

## Roles del sistema

| Rol | Acceso |
|---|---|
| `Admin` | Acceso total al sistema |
| `Veterinario` | Módulo clínico completo |
| `Cajero` | Módulo de caja e inventario |
| `Cliente` | Portal de mascotas y citas |

---

## Licencia

Proyecto académico — Huellitas Digitales © 2026
