import { expect, test } from '@playwright/test'

test('playground lists routes and runs request', async ({ page }) => {
  await page.goto('/__mokup')

  await page.getByTestId('playground-search').fill('profile')
  const row = page
    .getByTestId('playground-tree-row')
    .filter({ hasText: 'profile' })
    .first()

  await row.click()
  await page.getByTestId('playground-run').click()

  await expect(page.getByTestId('playground-response')).toContainText('Orion Vale')
})
