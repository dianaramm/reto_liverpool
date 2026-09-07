const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'https://www.liverpool.com.mx',
    headless: process.env.HEADED !== 'true',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    viewport: { width: 1366, height: 768 },

    extraHTTPHeaders: {
      'Accept-Language': 'es-MX,es;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },
  ],
});