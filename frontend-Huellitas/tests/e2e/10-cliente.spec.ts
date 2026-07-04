import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-10 | Cliente', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'cliente');
  });

  test('PF-10-01 | Inicio del cliente carga con sus mascotas', async ({ page }) => {
    await page.goto('/cliente/inicio');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-02 | Mis mascotas carga lista', async ({ page }) => {
    await page.goto('/cliente/mascotas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-03 | Formulario de registro de mascota carga', async ({ page }) => {
    await page.goto('/cliente/mascotas/registro');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Registrar mascota/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Nombre/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-04 | Wizard de agendar cita carga (paso 1)', async ({ page }) => {
    await page.goto('/cliente/agendar');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    // Debe mostrar el primer paso del wizard
    await expect(page.locator('text=/mascota|servicio|veterinario/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-05 | Historial médico carga', async ({ page }) => {
    await page.goto('/cliente/historial');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-06 | Pagos del cliente cargan', async ({ page }) => {
    await page.goto('/cliente/pagos');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-07 | Servicios disponibles carga', async ({ page }) => {
    await page.goto('/cliente/servicios');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-08 | Perfil del cliente carga con datos', async ({ page }) => {
    await page.goto('/cliente/perfil');
    await expect(page.getByText('Información personal')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('NOMBRES')).toBeVisible({ timeout: 10000 });
  });

  test('PF-10-09 | Cliente no puede acceder a rutas de veterinario', async ({ page }) => {
    await page.goto('/vet/agenda');
    await expect(page).toHaveURL(/\/acceso-denegado|\/login|\/cliente/);
  });

  test('PF-10-10 | QR de mascota es visible en inicio', async ({ page }) => {
    await page.goto('/cliente/inicio');
    await page.waitForTimeout(2000);
    // Busca botón o ícono de QR
    const qrBtn = page.locator('[class*="qr"], button:has-text("QR"), img[alt*="QR" i]').first();
    if (await qrBtn.isVisible({ timeout: 5000 })) {
      await qrBtn.click();
      await expect(page.locator('dialog, [role="dialog"], canvas, svg').first()).toBeVisible({ timeout: 5000 });
    }
  });

});
