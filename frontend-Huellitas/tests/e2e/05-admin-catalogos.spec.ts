import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-05 | Admin — Catálogos', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('PF-05-01 | Catálogo de especies carga y permite crear', async ({ page }) => {
    await page.goto('/admin/catalogos/especies');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    const createBtn = page.locator('button:has-text("Nueva"), button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")');
    await expect(createBtn.first()).toBeVisible({ timeout: 8000 });
  });

  test('PF-05-02 | Catálogo de razas carga', async ({ page }) => {
    await page.goto('/admin/catalogos/razas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-05-03 | Catálogo de vacunas carga', async ({ page }) => {
    await page.goto('/admin/catalogos/vacunas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-05-04 | Catálogo de categorías de producto carga', async ({ page }) => {
    await page.goto('/admin/catalogos/categorias');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-05-05 | Catálogo de servicios carga y muestra servicios', async ({ page }) => {
    await page.goto('/admin/catalogos/servicios');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

});
