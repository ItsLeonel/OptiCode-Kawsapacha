import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const port = Number(process.env.KAWSAPACHA_PREVIEW_PORT ?? 5179)
export default defineConfig({
  ...base,
  testMatch: 'garden-poc-production.spec.ts',
  timeout: 120_000,
  outputDir: 'test-results/production',
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}`, actionTimeout: 15_000 },
  globalSetup: './tests/production-server.ts',
})
