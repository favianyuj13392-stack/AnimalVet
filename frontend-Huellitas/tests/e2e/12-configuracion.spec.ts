import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-12 | Admin — Configuración de Clínica', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('PF-12-01 | Configuración de la clínica carga', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-12-02 | Módulo clínico del admin carga', async ({ page }) => {
    await page.goto('/admin/clinica');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-12-03 | Admin puede ver citas en estado kanban', async ({ page }) => {
    await page.goto('/admin/citas/estado');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

});
