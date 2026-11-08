import { test as base } from '@playwright/test'

// Keep UI tests independent of Google's font service. The application already
// defines system fallbacks; production styles and the actual data flow are unchanged.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.route('https://fonts.gstatic.com/**', route => route.abort())
    await use(page)
  },
})
export { expect } from '@playwright/test'
export type { Page } from '@playwright/test'
