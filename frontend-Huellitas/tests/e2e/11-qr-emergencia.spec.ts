import { test, expect } from '@playwright/test';

test.describe('PF-11 | QR y Emergencia (Público)', () => {

  test('PF-11-01 | Página de mascotas perdidas carga sin login', async ({ page }) => {
    await page.goto('/mascotas-perdidas');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    // No debe pedir login
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('PF-11-02 | URL de emergencia con hash inválido muestra error o página vacía', async ({ page }) => {
    await page.goto('/emergencia/hash-invalido-12345');
    // No debe dar error 500, puede mostrar "no encontrado" o similar
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/500|Internal Server Error/i')).not.toBeVisible();
  });

  test('PF-11-03 | Página de emergencia con hash válido muestra tarjeta de mascota', async ({ page }) => {
    // Este test necesita un hash real de mascota — ajusta el hash según tu BD
    const hashReal = process.env.TEST_QR_HASH || 'MASC-CB7DECF562C3';
    await page.goto(`/emergencia/${hashReal}`);
    await page.waitForTimeout(3000);
    // Si el hash existe, debe mostrar la ficha de emergencia
    const hasCard = await page.locator('[class*="card"], [class*="ficha"], h1, h2').first().isVisible();
    expect(hasCard).toBe(true);
  });

});
