import { defineConfig } from '@playwright/test'

const port = Number(process.env.KAWSAPACHA_E2E_PORT ?? 5174)

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results/application',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: { mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true },
  },
  globalSetup: './tests/app-server.ts',
})
