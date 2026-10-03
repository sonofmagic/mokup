import type { Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

async function duringPageReload<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation()
  }
  catch (error) {
    // Vite full reloads replace the context outside the browser callback's try/catch.
    if (error instanceof Error && error.message.includes('Execution context was destroyed')) {
      return null
    }
    throw error
  }
}

async function fetchMock(page: Page, pathname: string, headers?: Record<string, string>) {
  return duringPageReload(() => page.evaluate(async ({ pathname, headers }) => {
    try {
      const response = await fetch(`${pathname}?tick=${Date.now()}`, {
        cache: 'no-store',
        ...(headers ? { headers } : {}),
      })
      return response.ok ? await response.json() : null
    }
    catch {
      return null
    }
  }, { pathname, headers }))
}

test('docs home and quick start render', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Mokup' })).toBeVisible()
  await page.getByRole('link', { name: 'Quick Start' }).click()
  await expect(page).toHaveURL(/getting-started\/quick-start/)

  await expect
    .poll(() => fetchMock(page, '/api/example-basic/ping'), { timeout: 15_000 })
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
    await page.goto('/__mokup/', { waitUntil: 'domcontentloaded' })

    await expect
      .poll(() => fetchMock(page, '/api/example-auth/profile'), { timeout: 15_000 })
      .toMatchObject({ ok: true })

    await fs.writeFile(routeFile, updated, 'utf8')

    await expect
      .poll(() => fetchMock(page, '/api/example-auth/profile'), { timeout: 20_000 })
      .toMatchObject(expected)
  }
  finally {
    await fs.writeFile(routeFile, original, 'utf8')
  }
})

test('reloads json mock response after file change in playground sw mode', async ({ page }) => {
  const routeFile = join(process.cwd(), 'mock/example-auth/session.get.json')
  const original = await fs.readFile(routeFile, 'utf8')
  const marker = Date.now()
  const nextExpiresIn = 333362200 + (marker % 1000)

  const updated = JSON.stringify({
    ok: true,
    session: {
      id: 'sess_demo',
      expiresIn: nextExpiresIn,
    },
  }, null, 2)

  try {
    await page.goto('/__mokup/', { waitUntil: 'domcontentloaded' })

    await expect
      .poll(async () => {
        return duringPageReload(() => page.evaluate(async () => {
          const controlled = !!navigator.serviceWorker?.controller
            && navigator.serviceWorker.controller.scriptURL.includes('mokup-sw')
          if (!controlled) {
            return false
          }
          try {
            const registrations = await navigator.serviceWorker.getRegistrations()
            return registrations.some((registration) => {
              const urls = [
                registration.active?.scriptURL,
                registration.waiting?.scriptURL,
                registration.installing?.scriptURL,
              ].filter((entry): entry is string => typeof entry === 'string')
              return urls.some(url => url.includes('mokup-sw'))
            })
          }
          catch {
            return false
          }
        }))
      }, { timeout: 20_000 })
      .toBe(true)

    await expect
      .poll(() => fetchMock(page, '/api/example-auth/session', { authorization: 'Bearer e2e-token' }), { timeout: 15_000 })
      .toMatchObject({ ok: true, session: { id: 'sess_demo' } })

    await fs.writeFile(routeFile, `${updated}\n`, 'utf8')

    await expect
      .poll(() => fetchMock(page, '/api/example-auth/session', { authorization: 'Bearer e2e-token' }), { timeout: 20_000 })
      .toMatchObject({
        ok: true,
        session: {
          id: 'sess_demo',
          expiresIn: nextExpiresIn,
        },
      })
  }
  finally {
    await fs.writeFile(routeFile, original, 'utf8')
  }
})
