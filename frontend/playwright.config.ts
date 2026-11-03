import { defineConfig } from '@playwright/test'

const port = Number(process.env.KAWSAPACHA_E2E_PORT ?? 5174)

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
})
