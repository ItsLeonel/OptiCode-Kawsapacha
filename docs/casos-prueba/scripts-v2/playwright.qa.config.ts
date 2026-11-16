import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 180_000,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: process.env.QA_JSON ?? 'qa-results.json' }]],
  outputDir: 'qa-test-results',
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'off' },
})
