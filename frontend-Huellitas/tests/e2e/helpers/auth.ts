import { Page } from '@playwright/test';

export const USERS = {
  admin: {
    email: 'admin@gmail.com',
    password: 'pepe1234',
    rol: 'Administrador',
    redirectTo: '/admin/dashboard',
  },
  vet: {
    email: 'angeles@gmail.com',
    password: 'pepe1234',
    rol: 'Veterinario',
    redirectTo: '/vet/agenda',
  },
  cajero: {
    email: 'roberto@gmail.com',
    password: 'pepe1234',
    rol: 'Cajero',
    redirectTo: '/caja/pos',
  },
  cliente: {
    email: 'camilo@gmail.com',
    password: 'pepe1234',
    rol: 'Cliente',
    redirectTo: '/cliente/inicio',
  },
};

export async function login(page: Page, rol: keyof typeof USERS) {
  const user = USERS[rol];
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${user.redirectTo}`, { timeout: 10000 });
}

export async function logout(page: Page) {
  // Busca botón de cerrar sesión en el sidebar
  const logoutBtn = page.locator('button:has-text("Cerrar"), button:has-text("Salir"), [data-testid="logout"]');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('**/login');
  } else {
    await page.goto('/login');
  }
}
