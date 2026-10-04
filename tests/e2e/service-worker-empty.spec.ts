import type { CDPSession } from '@playwright/test'
import { unlink } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { startEmptySwServer } from './utils/empty-sw-server'
import { writeJson } from './utils/fs'

for (const runtime of ['node', 'worker'] as const) {
  test(`${runtime} activates first SW routes and recovers after deleting every route`, async ({ page, context }) => {
    const fixture = await startEmptySwServer(runtime)
    let cdp: CDPSession | undefined
    const activated = new Set<string>()
    try {
      cdp = await context.newCDPSession(page)
      cdp.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
        for (const version of versions) {
          if (version.status === 'activated' && version.scriptURL === `${fixture.url}mokup-sw.js`) {
            activated.add(version.versionId)
          }
        }
      })
      await cdp.send('ServiceWorker.enable')
      await expect.poll(() => Object.keys(fixture.server.watcher.getWatched())).toContain(fixture.mockDir)
      const connected = page.waitForEvent('websocket').then(socket => socket.waitForEvent('framereceived', {
        predicate: frame => frame.payload.toString().includes('"type":"connected"'),
      }))
      await Promise.all([page.goto(fixture.url), connected])
      const read = () => page.evaluate(async () => {
        const response = await fetch('/workspace/api/value', { cache: 'no-store' })
        return { status: response.status, body: await response.json() }
      })
      await expect.poll(read).toEqual({ status: 207, body: { source: 'network' } })
      expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(list => list.length))).toBe(0)

      for (const revision of [1, 2]) {
        const beforeAdd = activated.size
        await writeJson(fixture.routeFile, { source: 'mock', revision })
        // No test-driven page reload or manual registration: Vite must bootstrap it.
        await expect.poll(() => activated.size).toBeGreaterThan(beforeAdd)
        await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
        expect(await read()).toEqual({ status: 200, body: { source: 'mock', revision } })
        // The Node fallback is disabled, so a successful browser response proves SW interception.
        const network = await fetch(`${fixture.url}api/value`)
        expect(network.status).toBe(207)
        expect(await network.json()).toEqual({ source: 'network' })

        const beforeDelete = activated.size
        await unlink(fixture.routeFile)
        // Observe activation without keeping the old worker busy with repeated fetches.
        await expect.poll(() => activated.size).toBeGreaterThan(beforeDelete)
        await expect.poll(read).toEqual({ status: 207, body: { source: 'network' } })
      }
    }
    finally {
      try {
        if (!page.isClosed()) {
          await page.evaluate(async () => {
            await Promise.all((await navigator.serviceWorker.getRegistrations()).map(registration => registration.unregister()))
          })
        }
      }
      finally {
        try {
          await cdp?.detach()
        }
        finally {
          await fixture.close()
        }
      }
    }
  })
}

test('manual SW registration stays disabled when the first route is added', async ({ page }) => {
  const fixture = await startEmptySwServer('node', false)
  try {
    await expect.poll(() => Object.keys(fixture.server.watcher.getWatched())).toContain(fixture.mockDir)
    const socketReady = page.waitForEvent('websocket')
    await page.goto(fixture.url)
    const socket = await socketReady
    const updated = socket.waitForEvent('framereceived', {
      predicate: frame => frame.payload.toString().includes('mokup:routes-changed'),
    })
    await writeJson(fixture.routeFile, { source: 'mock', revision: 1 })
    await updated
    // Loading the updated HTML must also respect manual registration.
    await page.reload()
    expect(await page.locator('script[src*="mokup-sw-lifecycle"]').count()).toBe(0)
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(list => list.length))).toBe(0)
    const response = await page.evaluate(async () => {
      const result = await fetch('/workspace/api/value')
      return { status: result.status, body: await result.json() }
    })
    expect(response).toEqual({ status: 207, body: { source: 'network' } })
  }
  finally {
    await fixture.close()
  }
})
