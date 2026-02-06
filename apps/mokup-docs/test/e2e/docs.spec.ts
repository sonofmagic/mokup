import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

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

test('reloads ts mock response after file change', async ({ page }) => {
  const routeFile = join(process.cwd(), 'mock/example-auth/profile.get.ts')
  const original = await fs.readFile(routeFile, 'utf8')
  const marker = `e2e_${Date.now()}`
  const expected = {
    ok: true,
    user: {
      id: `user_${marker}`,
      name: `Demo ${marker}`,
      role: `member_${marker}`,
    },
  }

  const updated = [
    'import { defineHandler } from \'mokup\'',
    '',
    'export default defineHandler(() => {',
    '  return {',
    '    ok: true,',
    '    user: {',
    `      id: '${expected.user.id}',`,
    `      name: '${expected.user.name}',`,
    `      role: '${expected.user.role}',`,
    '    },',
    '  }',
    '})',
    '',
  ].join('\n')

  try {
    await page.goto('/__mokup/')

    await expect
      .poll(async () => {
        return page.evaluate(async () => {
          try {
            const response = await fetch(`/api/example-auth/profile?warm=${Date.now()}`, {
              cache: 'no-store',
            })
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
      .toMatchObject({ ok: true })

    await fs.writeFile(routeFile, updated, 'utf8')

    await expect
      .poll(async () => {
        return page.evaluate(async () => {
          try {
            const response = await fetch(`/api/example-auth/profile?tick=${Date.now()}`, {
              cache: 'no-store',
            })
            if (!response.ok) {
              return null
            }
            return response.json()
          }
          catch {
            return null
          }
        })
      }, { timeout: 20_000 })
      .toMatchObject(expected)
  }
  finally {
    await fs.writeFile(routeFile, original, 'utf8')
  }
})
