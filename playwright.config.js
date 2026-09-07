const { defineConfig, devices } = require('@playwright/test');

/**
 * Headless por defecto (requisito del reto). Se activa el modo con interfaz
 * gráfica exportando la variable de entorno HEADED=true (ver scripts en package.json).
 */
const isHeaded = process.env.HEADED === 'true';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'https://www.liverpool.com.mx',
    headless: !isHeaded,
    // Capturas y trazas automáticas gestionadas por el framework, no manualmente en el código de prueba.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    locale: 'es-MX',
    viewport: { width: 1440, height: 900 }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
