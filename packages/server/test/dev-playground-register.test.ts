import { Hono } from '@mokup/shared/hono'
import { describe, expect, it, vi } from 'vitest'
import { readPlaygroundAsset, readPlaygroundIndex } from '../src/dev/playground/assets'
import { registerPlaygroundRoutes } from '../src/dev/playground/register'

vi.mock('../src/dev/playground/assets', () => ({
  resolvePlaygroundDist: vi.fn().mockReturnValue('/dist'),
  readPlaygroundIndex: vi.fn().mockResolvedValue(new Response('index')),
  readPlaygroundAsset: vi.fn().mockResolvedValue(new Response('asset')),
}))

describe('registerPlaygroundRoutes', () => {
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

  it('registers playground routes and assets', async () => {
    const app = new Hono()
    registerPlaygroundRoutes({
      app,
      routes: [],
      disabledRoutes: [],
      ignoredRoutes: [],
      configFiles: [],
      disabledConfigFiles: [],
      dirs: ['/root/mock'],
      logger,
      config: { enabled: true, path: '/__mokup' },
      root: '/root',
    })

    const redirect = await app.fetch(new Request('http://localhost/__mokup'))
    expect(redirect.status).toBe(302)

    const index = await app.fetch(new Request('http://localhost/__mokup/'))
    expect(await index.text()).toBe('index')

    const indexHtml = await app.fetch(new Request('http://localhost/__mokup/index.html'))
    expect(indexHtml.status).toBe(200)

    const routes = await app.fetch(new Request('http://localhost/__mokup/routes'))
    const payload = await routes.json() as { basePath: string }
    expect(payload.basePath).toBe('/__mokup')

    const asset = await app.fetch(new Request('http://localhost/__mokup/app.js'))
    expect(await asset.text()).toBe('asset')
  })

  it('returns 500 when index fails to load', async () => {
    const app = new Hono()
    ;(readPlaygroundIndex as unknown as { mockRejectedValueOnce: (value: unknown) => void })
      .mockRejectedValueOnce(new Error('boom'))

    registerPlaygroundRoutes({
      app,
      routes: [],
      dirs: ['/root/mock'],
      logger,
      config: { enabled: true, path: '/__mokup' },
    })

    const response = await app.fetch(new Request('http://localhost/__mokup/'))
    expect(response.status).toBe(500)
    expect(logger.error).toHaveBeenCalled()
  })

  it('skips registration when disabled', async () => {
    const app = new Hono()
    registerPlaygroundRoutes({
      app,
      routes: [],
      dirs: ['/root/mock'],
      logger,
      config: { enabled: false, path: '/__mokup' },
    })

    const response = await app.fetch(new Request('http://localhost/__mokup/'))
    expect(response.status).toBe(404)
  })

  it('returns not found when asset read fails', async () => {
    const app = new Hono()
    ;(readPlaygroundAsset as unknown as { mockRejectedValueOnce: (value: unknown) => void })
      .mockRejectedValueOnce(new Error('boom'))

    registerPlaygroundRoutes({
      app,
      routes: [],
      dirs: ['/root/mock'],
      logger,
      config: { enabled: true, path: '/__mokup' },
    })

    const response = await app.fetch(new Request('http://localhost/__mokup/app.js'))
    expect(response.status).toBe(404)
  })

  it('defaults route lists when optional inputs are missing', async () => {
    const app = new Hono()
    registerPlaygroundRoutes({
      app,
      routes: [],
      dirs: ['/root/mock'],
      logger,
      config: { enabled: true, path: '/__mokup' },
    })

    const response = await app.fetch(new Request('http://localhost/__mokup/routes'))
    const payload = await response.json() as {
      disabled: unknown[]
      ignored: unknown[]
      configs: unknown[]
      disabledConfigs: unknown[]
    }
    expect(payload.disabled).toEqual([])
    expect(payload.ignored).toEqual([])
    expect(payload.configs).toEqual([])
    expect(payload.disabledConfigs).toEqual([])
  })
})
