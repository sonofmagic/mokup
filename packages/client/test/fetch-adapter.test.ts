import { describe, expect, it, vi } from 'vitest'
import { createFetchAdapter } from '../src/adapters/fetch'

describe('fetch adapter', () => {
  it('rewrites url and injects headers', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }))
    const adapter = createFetchAdapter({
      fetch: fetchMock as unknown as typeof fetch,
      resolverOptions: {
        mockBase: 'http://mokup.local',
        realBase: 'https://api.example.com',
        pathMap: [{ from: '/api/*', to: '/*' }],
        markers: { header: true },
      },
    })

    await adapter('/api/users', {
      mock: true,
      headers: { 'X-Test': '1' },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://mokup.local/users')
    const headers = init?.headers as Record<string, string>
    expect(headers['x-test']).toBe('1')
    expect(headers['x-mokup']).toBe('1')
  })
})
