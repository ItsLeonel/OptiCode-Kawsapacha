import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.unit.spec.ts',
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results/unit',
})
