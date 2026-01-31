import { describe, expect, it, vi } from 'vitest'
import { createAxiosExecutor } from '../src/index'

describe('axios executor', () => {
  it('rewrites url with resolver and returns data', async () => {
    const request = vi.fn(async (config: Record<string, unknown>) => ({
      data: { ok: true },
      config,
    }))

    const executor = createAxiosExecutor({
      axios: { request },
      resolverOptions: {
        mockBase: 'http://mokup.local',
        realBase: 'https://api.example.com',
        pathMap: [{ from: '/api/*', to: '/*' }],
        markers: { header: true },
      },
    })

    const result = await executor({
      url: '/api/users',
      method: 'GET',
      mock: true,
      headers: { 'x-test': '1' },
    })

    expect(result).toEqual({ ok: true })
    expect(request).toHaveBeenCalledTimes(1)
    const config = request.mock.calls[0][0]
    expect(config.url).toBe('http://mokup.local/users')
    expect((config.headers as Record<string, string>)['x-test']).toBe('1')
    expect((config.headers as Record<string, string>)['x-mokup']).toBe('1')
  })
})
