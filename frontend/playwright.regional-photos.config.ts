import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({
  ...base, testMatch: 'regional-photos.spec.ts', timeout: 120_000,
  outputDir: 'test-results/regional-photos',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5190', actionTimeout: 15_000 },
  globalSetup: './tests/regional-photos-server.ts',
})
