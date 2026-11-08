import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const port = Number(process.env.KAWSAPACHA_POC_PORT ?? 5177)
export default defineConfig({
  ...base,
  testMatch: /garden-poc.*\.spec\.ts/,
  timeout: 120_000,
  outputDir: 'test-results/garden-poc',
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}`, actionTimeout: 15_000 },
  // Own Vite through its API: no Windows process-tree termination permission.
  webServer: undefined,
  globalSetup: './tests/garden-poc-server.ts',
})
