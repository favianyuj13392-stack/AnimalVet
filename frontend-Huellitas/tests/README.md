# Tests Funcionales — Huellitas Digitales

## Instalación (solo la primera vez)

```bash
cd frontend-huellitas
npm install -D @playwright/test
npx playwright install chromium
```

## Configuración

1. Edita `.env.test` con tus URLs y credenciales reales:
   - `BASE_URL` → tu URL de Vercel
   - Credenciales de cada rol (admin, vet, cajero, cliente)
   - `TEST_QR_HASH` → hash QR de una mascota real de tu BD

2. Carga las variables antes de correr:
   ```bash
   # Windows PowerShell
   $env:BASE_URL="https://tu-app.vercel.app"
   ```

## Correr los tests

```bash
# Todos los tests (modo silencioso)
npm run test:e2e

# Con interfaz visual (recomendado)
npm run test:e2e:ui

# Ver el navegador mientras corre
npm run test:e2e:headed

# Solo un archivo
npx playwright test tests/e2e/01-auth.spec.ts

# Ver reporte HTML después
npm run test:e2e:report
```

## Estructura de archivos

| Archivo | Qué prueba |
|---------|-----------|
| `01-auth.spec.ts` | Login, logout, protección de rutas por rol |
| `02-publico.spec.ts` | Landing, servicios, registro, mascotas perdidas |
| `03-admin-dashboard.spec.ts` | Dashboard, reportes, logs, notificaciones |
| `04-admin-personal.spec.ts` | Usuarios, clientes, roles, horarios |
| `05-admin-catalogos.spec.ts` | Especies, razas, vacunas, categorías, servicios |
| `06-admin-mascotas.spec.ts` | CRUD mascotas, búsqueda, citas admin |
| `07-admin-inventario.spec.ts` | Productos, lotes, kardex, alertas de stock |
| `08-vet.spec.ts` | Agenda, consultas, expedientes, hospitalizaciones |
| `09-cajero.spec.ts` | POS, sala de espera, agenda, inventario, reportes |
| `10-cliente.spec.ts` | Mascotas, agendar cita, historial, pagos, perfil, QR |
| `11-qr-emergencia.spec.ts` | Mascotas perdidas, ficha de emergencia pública |
| `12-configuracion.spec.ts` | Configuración clínica, módulo clínico admin |

## Notas importantes

- Los tests asumen que hay datos en la BD (usuarios con cada rol, al menos una mascota, etc.)
- Actualiza las credenciales en `helpers/auth.ts` con las reales de tu sistema
- El test `PF-11-03` necesita un `TEST_QR_HASH` real de tu BD para pasar
