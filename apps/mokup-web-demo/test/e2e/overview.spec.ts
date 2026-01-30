import { expect, test } from '@playwright/test'

test('overview shows stats and route inventory', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('overview-active-count')).toHaveText(/\d+/)
  await expect(page.getByTestId('overview-capability-count')).toHaveText(/\d+/)
  await expect(page.getByTestId('route-table')).toBeVisible()
})

test('navigation switches between overview and playground', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Playground', exact: true }).click()
  await expect(page).toHaveURL(/\/playground/)
  await expect(page.getByRole('heading', { name: /Trigger every mock endpoint/i })).toBeVisible()

  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: /Everything mokup can do/i })).toBeVisible()
})
