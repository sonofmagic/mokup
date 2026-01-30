import { expect, test } from '@playwright/test'

test('d1 demo shows validation errors without bindings', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('page-title')).toContainText('D1 auth playground')

  await expect
    .poll(async () => page.getByTestId('status-message').textContent())
    .toContain('User load failed')

  await page.getByTestId('auth-email-signin').click()
  await expect(page.getByTestId('status-message')).toContainText('Email and password are required')

  await page.getByTestId('user-name').fill('Ada Lovelace')
  await page.getByTestId('user-email').fill('invalid')
  await page.getByTestId('user-create').click()
  await expect(page.getByTestId('status-message')).toContainText('Email is invalid')
})
