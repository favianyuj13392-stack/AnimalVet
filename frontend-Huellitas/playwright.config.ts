import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  timeout: 30000,

  use: {
    baseURL: process.env.BASE_URL || 'https://frontend-huellitas.vercel.app/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
