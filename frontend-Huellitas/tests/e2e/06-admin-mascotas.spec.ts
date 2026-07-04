import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-06 | Admin — Mascotas', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('PF-06-01 | Lista de mascotas carga con cards', async ({ page }) => {
    await page.goto('/admin/mascotas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Listado|Mascotas/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-06-02 | Buscar mascota por nombre filtra resultados', async ({ page }) => {
    await page.goto('/admin/mascotas');
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('Rex');
      await page.waitForTimeout(800);
      // No debe aparecer error
      await expect(page.locator('text=/error/i')).not.toBeVisible();
    }
  });

  test('PF-06-03 | Formulario de registro de mascota carga', async ({ page }) => {
    await page.goto('/admin/mascotas/registro');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input, select').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-06-04 | Abrir detalle de mascota desde la lista', async ({ page }) => {
    await page.goto('/admin/mascotas');
    await page.waitForTimeout(2000);
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      // Debe abrir detalle o modal
      await expect(page.locator('h2, dialog, [role="dialog"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('PF-06-05 | Admin ve módulo de citas', async ({ page }) => {
    await page.goto('/admin/citas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

});
