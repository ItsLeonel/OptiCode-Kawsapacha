import { test as base } from '@playwright/test'

// Keep UI tests independent of Google's font service. The application already
// defines system fallbacks; production styles and the actual data flow are unchanged.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.route('https://fonts.gstatic.com/**', route => route.abort())
    // Isolated guest E2E intentionally has no backend; fail catalog calls fast
    // rather than waiting for the Vite proxy. Never fake a successful API.
    if (process.env.KAWSAPACHA_E2E_OFFLINE_CATALOG === '1') {
      await page.route('**/api/catalog**', route => route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Catálogo no disponible en prueba aislada' }),
      }))
    }
    await use(page)
  },
})
export { expect } from '@playwright/test'
export type { Page } from '@playwright/test'
