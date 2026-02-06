import { expect, test } from '@playwright/test'

test('host service worker demo responds to mock routes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Mokup Host Service Worker Demo' })).toBeVisible()
  await expect(page.getByTestId('host-status')).not.toHaveText(/not supported/i)

  await page.getByTestId('host-run-ping').click()
  await expect(page.getByTestId('host-output')).toContainText('"ok": true')

  await page.getByTestId('host-run-echo').click()
  await expect(page.getByTestId('host-output')).toContainText('"ok": true')
})
