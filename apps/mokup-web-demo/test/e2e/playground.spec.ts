import { expect, test } from '@playwright/test'

test('playground cards run mock requests', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Playground', exact: true }).click()
  await expect(page).toHaveURL(/\/playground/)

  await page.getByTestId('api-run-profile-json').click()
  await expect(page.getByTestId('api-response-profile-json')).toContainText('Orion Vale')

  await page.getByTestId('api-run-login-fn').click()
  await expect(page.getByTestId('api-response-login-fn')).toContainText('"ok": true')
})
