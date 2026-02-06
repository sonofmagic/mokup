import { expect, test } from '@playwright/test'

test('webpack demo executes all mock requests', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Webpack Mock Playground' })).toBeVisible()

  await page.getByTestId('run-all').click()

  await expect(page.getByTestId('status-health')).toHaveAttribute('data-status', 'success')
  await expect(page.getByTestId('status-users')).toHaveAttribute('data-status', 'success')
  await expect(page.getByTestId('status-user')).toHaveAttribute('data-status', 'success')
  await expect(page.getByTestId('status-echo')).toHaveAttribute('data-status', 'success')

  await expect(page.getByTestId('output-health')).toContainText('"ok": true')
  await expect(page.getByTestId('output-users')).toContainText('"users"')
  await expect(page.getByTestId('output-user')).toContainText('"id": "42"')
  await expect(page.getByTestId('output-echo')).toContainText('"ok": true')
})
