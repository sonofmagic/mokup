import { expect, test } from '@playwright/test'

test('docs home and quick start render', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mokup' })).toBeVisible()
  await page.getByRole('link', { name: 'Quick Start' }).click()
  await expect(page).toHaveURL(/getting-started\/quick-start/)

  await expect
    .poll(async () => {
      return page.evaluate(async () => {
        try {
          const response = await fetch('/api/example-basic/ping')
          if (!response.ok) {
            return null
          }
          return response.json()
        }
        catch {
          return null
        }
      })
    }, { timeout: 15_000 })
    .toMatchObject({ ok: true, example: 'basic' })
})
