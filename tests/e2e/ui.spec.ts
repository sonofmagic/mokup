import { expect, test } from '@playwright/test'

test('overview shows stats and route inventory', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('overview-active-count')).toHaveText(/\d+/)
  await expect(page.getByTestId('overview-capability-count')).toHaveText(/\d+/)
  await expect(page.getByTestId('route-table')).toBeVisible()
})

test('playground cards run mock requests', async ({ page }) => {
  await page.goto('/playground')

  await page.getByTestId('api-run-profile-json').click()
  await expect(page.getByTestId('api-response-profile-json')).toContainText('Orion Vale')

  await page.getByTestId('api-run-login-fn').click()
  await expect(page.getByTestId('api-response-login-fn')).toContainText('mock-token-7d91')
})
