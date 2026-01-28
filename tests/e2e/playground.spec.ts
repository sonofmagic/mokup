import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { repoRoot } from './utils/paths'

test.describe.serial('playground', () => {
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

  test('playground recovers after deleting and restoring a jsonc mock', async ({ page }) => {
    const filePath = join(repoRoot, 'apps/web/mock/about.get.jsonc')
    const original = await readFile(filePath, 'utf8')

    try {
      await page.goto('/__mokup')

      await page.getByTestId('playground-search').fill('about')
      const row = page.getByTestId('playground-tree-row').filter({ hasText: 'about' }).first()

      await row.click()
      await page.getByTestId('playground-run').click()
      await expect(page.getByTestId('playground-response')).toContainText('Mock APIs at lightspeed')

      await rm(filePath, { force: true })

      await expect(page.getByTestId('playground-tree-row').filter({ hasText: 'about' })).toHaveCount(0, {
        timeout: 15_000,
      })

      await writeFile(filePath, original, 'utf8')

      const restoredRow = page.getByTestId('playground-tree-row').filter({ hasText: 'about' }).first()
      await expect(restoredRow).toBeVisible({ timeout: 15_000 })
      await restoredRow.click()
      await page.getByTestId('playground-run').click()
      await expect(page.getByTestId('playground-response')).toContainText('Mock APIs at lightspeed')
    }
    finally {
      await writeFile(filePath, original, 'utf8')
    }
  })

  test('playground updates after a single mock edit', async ({ page, request }) => {
    const filePath = join(repoRoot, 'apps/web/mock/about.get.jsonc')
    const original = await readFile(filePath, 'utf8')
    const stamp = `e2e-${Date.now()}`
    const updated = original.replace(/\n\}\s*$/, `,\n  "e2e": "${stamp}"\n}\n`)

    try {
      await page.goto('/__mokup')

      await page.getByTestId('playground-search').fill('about')
      const row = page.getByTestId('playground-tree-row').filter({ hasText: 'about' }).first()
      await row.click()

      await writeFile(filePath, updated, 'utf8')

      await expect.poll(async () => {
        const response = await request.get('/api/about')
        const data = await response.json() as Record<string, unknown>
        return data.e2e
      }, {
        timeout: 15_000,
      }).toBe(stamp)

      await page.getByTestId('playground-run').click()
      await expect(page.getByTestId('playground-response')).toContainText(stamp)
    }
    finally {
      await writeFile(filePath, original, 'utf8')
    }
  })
})
