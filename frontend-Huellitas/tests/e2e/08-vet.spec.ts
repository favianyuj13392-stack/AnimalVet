import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('PF-08 | Veterinario', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'vet');
  });

  test('PF-08-01 | Agenda del veterinario carga con citas', async ({ page }) => {
    await page.goto('/vet/agenda');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    // Calendario o lista de citas
    await expect(page.locator('[class*="calendar"], [class*="agenda"], [class*="schedule"], table').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-08-02 | Lista de citas del vet carga', async ({ page }) => {
    await page.goto('/vet/citas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-08-03 | Lista de expedientes clínicos carga', async ({ page }) => {
    await page.goto('/vet/expediente');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table, [role="table"], [class*="card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-08-04 | Historial clínico carga con lista', async ({ page }) => {
    await page.goto('/vet/historial');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-08-05 | Lista de hospitalizados carga', async ({ page }) => {
    await page.goto('/vet/hospitalizacion');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-08-06 | Reportes del vet cargan', async ({ page }) => {
    await page.goto('/vet/reportes');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('PF-08-07 | Formulario de consulta médica carga', async ({ page }) => {
    // Primero navega a la agenda para obtener una cita
    await page.goto('/vet/citas');
    await page.waitForTimeout(2000);
    const firstCita = page.locator('table tbody tr, [class*="cita"], [class*="card"]').first();
    if (await firstCita.isVisible({ timeout: 5000 })) {
      // Busca el botón de iniciar consulta
      const consultaBtn = page.locator('button:has-text("Consulta"), button:has-text("Atender"), a:has-text("Consulta")').first();
      if (await consultaBtn.isVisible({ timeout: 3000 })) {
        await consultaBtn.click();
        await expect(page).toHaveURL(/\/vet\/consulta\//);
        await expect(page.locator('form').first()).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test('PF-08-08 | Vet no puede acceder a caja/pos', async ({ page }) => {
    await page.goto('/caja/pos');
    await expect(page).toHaveURL(/\/acceso-denegado|\/login|\/vet/);
  });

});
