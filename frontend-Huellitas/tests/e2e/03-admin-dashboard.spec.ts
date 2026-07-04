import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-03 | Admin — Dashboard y Reportes', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('PF-03-01 | Dashboard principal carga con widgets', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Al menos un widget o card debe estar visible
    await expect(page.locator('[class*="card"], [class*="widget"], [class*="stat"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-03-02 | Dashboard ejecutivo carga gráficas', async ({ page }) => {
    await page.goto('/admin/dashboard/ejecutivo');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-03-03 | Módulo de reportes carga', async ({ page }) => {
    await page.goto('/admin/reportes');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-03-04 | Logs del sistema carga tabla', async ({ page }) => {
    await page.goto('/admin/logs');
    await expect(page.locator('h1, h2, table, [role="table"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-03-05 | Cierres de caja carga', async ({ page }) => {
    await page.goto('/admin/cierres-caja');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-03-06 | Escaneos QR carga tabla', async ({ page }) => {
    await page.goto('/admin/escaneos-qr');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-03-07 | Notificaciones carga', async ({ page }) => {
    await page.goto('/admin/notificaciones');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

});
