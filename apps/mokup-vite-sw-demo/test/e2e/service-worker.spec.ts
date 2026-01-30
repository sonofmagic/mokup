import { expect, test } from '@playwright/test'

test('service worker demo handles mock requests', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mokup Service Worker Demo' })).toBeVisible()
  await expect(page.getByTestId('sw-status')).not.toHaveText(/not supported/i)

  await page.getByTestId('sw-run-ping').click()
  await expect(page.getByTestId('sw-output')).toContainText('"ok": true')

  await page.getByTestId('sw-run-echo').click()
  await expect(page.getByTestId('sw-output')).toContainText('"ok": true')

  await page.getByTestId('sw-run-upload').click()
  await expect(page.getByTestId('sw-output')).toContainText('"files"')
})
