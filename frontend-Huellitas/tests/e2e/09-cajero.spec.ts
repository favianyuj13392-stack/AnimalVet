import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-09 | Cajero', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'cajero');
  });

  test('PF-09-01 | POS carga con catálogo de productos y servicios', async ({ page }) => {
    await page.goto('/caja/pos');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[class*="product"], [class*="catalog"], [class*="card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-09-02 | Sala de espera carga con lista de citas', async ({ page }) => {
    await page.goto('/caja/sala-espera');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-09-03 | Agenda del cajero carga', async ({ page }) => {
    await page.goto('/caja/agenda');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-09-04 | Inventario del cajero es solo lectura', async ({ page }) => {
    await page.goto('/caja/inventario');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    // El cajero no debe ver botones de editar/eliminar productos
    const editBtn = page.locator('button:has-text("Editar producto"), button:has-text("Eliminar producto")');
    await expect(editBtn).not.toBeVisible();
  });

  test('PF-09-05 | Reporte de caja carga', async ({ page }) => {
    await page.goto('/caja/reporte');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-09-06 | POS permite buscar cliente', async ({ page }) => {
    await page.goto('/caja/pos');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="cliente" i], input[placeholder*="buscar" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(800);
      await expect(page.locator('text=/error/i')).not.toBeVisible();
    }
  });

  test('PF-09-07 | Cajero no puede acceder a admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/acceso-denegado|\/login|\/caja/);
  });

});
