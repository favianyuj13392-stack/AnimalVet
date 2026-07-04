import { test, expect } from '@playwright/test';

test.describe('PF-02 | Páginas Públicas', () => {

  test('PF-02-01 | Landing page carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('PF-02-02 | Página de servicios muestra catálogo', async ({ page }) => {
    await page.goto('/servicios');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Debe haber al menos un servicio listado
    await expect(page.locator('text=/Consulta|Vacuna|Baño|Servicio/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-02-03 | Página de mascotas perdidas carga', async ({ page }) => {
    await page.goto('/mascotas-perdidas');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('PF-02-04 | Registro de cliente nuevo', async ({ page }) => {
    await page.goto('/registro');
    await expect(page.locator('form')).toBeVisible();
    // Verifica que los campos existan
    await expect(page.locator('input[placeholder="Juan"], input[placeholder*="nombre" i]').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[placeholder*="ejemplo" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('PF-02-05 | Página nosotros carga', async ({ page }) => {
    await page.goto('/nosotros');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('PF-02-06 | Página contacto carga correctamente', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('text=/Contáctanos|Contacto|Visítanos/i').first()).toBeVisible({ timeout: 10000 });
  });

});
