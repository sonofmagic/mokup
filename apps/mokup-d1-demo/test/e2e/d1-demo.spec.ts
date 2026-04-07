import { expect, test } from '@playwright/test'

test('d1 demo shows validation errors without bindings', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('page-title')).toContainText('D1 auth playground')

  await expect
    .poll(async () => page.getByTestId('status-message').textContent())
    .toContain('User load failed')

  // Vite may briefly reload the worker client after startup in CI, which can
  // leave the error overlay intercepting clicks even though the page has rendered.
  await expect(page.locator('vite-error-overlay')).toBeHidden({ timeout: 15_000 })

  await page.getByTestId('auth-email-signin').click()
  await expect(page.getByTestId('status-message')).toContainText('Email and password are required')

  await page.getByTestId('user-name').fill('Ada Lovelace')
  await page.getByTestId('user-email').fill('invalid')
  await page.getByTestId('user-create').click()
  await expect(page.getByTestId('status-message')).toContainText('Email is invalid')
})
