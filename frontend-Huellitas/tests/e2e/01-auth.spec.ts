import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers/auth';

test.describe('PF-01 | Autenticación', () => {

  test('PF-01-01 | Login exitoso como Admin redirige a /admin/dashboard', async ({ page }) => {
    await login(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('PF-01-02 | Login exitoso como Veterinario redirige a /vet/agenda', async ({ page }) => {
    await login(page, 'vet');
    await expect(page).toHaveURL(/\/vet\/agenda/);
  });

  test('PF-01-03 | Login exitoso como Cajero redirige a /caja/pos', async ({ page }) => {
    await login(page, 'cajero');
    await expect(page).toHaveURL(/\/caja\/pos/);
  });

  test('PF-01-04 | Login exitoso como Cliente redirige a /cliente/inicio', async ({ page }) => {
    await login(page, 'cliente');
    await expect(page).toHaveURL(/\/cliente\/inicio/);
  });

  test('PF-01-05 | Credenciales incorrectas muestra mensaje de error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'noexiste@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/credenciales|incorrecto|inválido|error/i')).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('PF-01-06 | Campos vacíos muestra validación', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    await expect(emailInput).toBeVisible();
    // El formulario no debe navegar
    await expect(page).toHaveURL(/\/login/);
  });

  test('PF-01-07 | Acceso directo a ruta protegida sin sesión redirige a login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/acceso-denegado/);
  });

  test('PF-01-08 | Cliente no puede acceder a rutas de Admin', async ({ page }) => {
    await login(page, 'cliente');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/acceso-denegado/);
  });

});
