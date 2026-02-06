import { expect, test } from '@playwright/test'

test('middleware demo runs express and mokup routes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Middleware Demo' })).toBeVisible()

  await page.locator('#run-all').click()

  await expect(page.locator('#health-output')).toContainText('"ok": true')
  await expect(page.locator('#users-output')).toContainText('"users"')
  await expect(page.locator('#time-output')).toContainText('"source": "mokup-middleware-demo"')
})
