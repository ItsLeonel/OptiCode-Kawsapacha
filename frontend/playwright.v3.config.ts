import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const port = Number(process.env.KAWSAPACHA_CAPTURE_PORT ?? 5175)

export default defineConfig({
  ...base,
  testMatch: 'community-v3.spec.ts',
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
})
