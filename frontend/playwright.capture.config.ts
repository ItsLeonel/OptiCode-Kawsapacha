import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Capture the actual production bundle, independently of Vite's development/HMR cache.
const port = Number(process.env.KAWSAPACHA_CAPTURE_PORT ?? 5175)
export default defineConfig({
  ...base,
  testMatch: 'community-experience-v2.spec.ts',
  grep: /capturas de los cuatro pasos/,
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
})
