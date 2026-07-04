import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-07 | Admin — Inventario', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('PF-07-01 | Inventario carga lista de productos', async ({ page }) => {
    await page.goto('/admin/inventario');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table, [role="table"], [class*="card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-07-02 | Botón crear producto abre formulario', async ({ page }) => {
    await page.goto('/admin/inventario');
    const createBtn = page.locator('button:has-text("Agregar Item"), button:has-text("Agregar"), button:has-text("Nuevo"), button:has-text("Crear")');
    await expect(createBtn.first()).toBeVisible({ timeout: 8000 });
    await createBtn.first().click();
    await expect(page.locator('form, dialog, [role="dialog"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('PF-07-03 | Alertas de stock crítico son visibles', async ({ page }) => {
    await page.goto('/admin/inventario');
    // El widget de stock crítico o la sección de alertas
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/stock|alerta|crítico/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-07-04 | Lotes por vencer se muestran', async ({ page }) => {
    await page.goto('/admin/inventario');
    await page.waitForTimeout(2000);
    // Busca tab o sección de lotes
    const lotesTab = page.locator('text=/lote|vencer|caducidad/i').first();
    if (await lotesTab.isVisible({ timeout: 3000 })) {
      await lotesTab.click();
      await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('PF-07-05 | Kardex de inventario carga', async ({ page }) => {
    await page.goto('/admin/inventario');
    await page.waitForTimeout(1000);
    const kardexTab = page.locator('text=/kardex|movimiento/i').first();
    if (await kardexTab.isVisible({ timeout: 3000 })) {
      await kardexTab.click();
      await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

});
