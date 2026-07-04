import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-04 | Admin — Gestión de Personal', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('PF-04-01 | Lista de usuarios/personal carga', async ({ page }) => {
    await page.goto('/admin/personal/usuarios');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table, [role="table"], [class*="table"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-04-02 | Crear nuevo usuario abre formulario', async ({ page }) => {
    await page.goto('/admin/personal/usuarios');
    const createBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")');
    await expect(createBtn.first()).toBeVisible({ timeout: 8000 });
    await createBtn.first().click();
    await expect(page.locator('form, dialog, [role="dialog"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('PF-04-03 | Lista de clientes carga', async ({ page }) => {
    await page.goto('/admin/personal/clientes');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-04-04 | Gestión de roles carga', async ({ page }) => {
    await page.goto('/admin/personal/roles');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-04-05 | Horarios de veterinarios carga', async ({ page }) => {
    await page.goto('/admin/horarios');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

});
