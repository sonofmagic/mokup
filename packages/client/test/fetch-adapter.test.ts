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

  it('preserves repeated case-insensitive tuple headers', async () => {
    const resolver = {
      resolve: vi.fn(request => ({ mode: 'real' as const, url: request.url, headers: {} })),
      setUseMock: vi.fn(),
      getUseMock: () => false,
    }
    const fetchMock = vi.fn(async () => new Response('ok'))
    const adapter = createFetchAdapter({ fetch: fetchMock, resolver })

    await adapter('/source', {
      headers: [
        ['Accept', 'application/json'],
        ['accept', 'application/problem+json'],
      ],
    })

    expect(resolver.resolve).toHaveBeenCalledWith(expect.objectContaining({
      headers: { accept: 'application/json, application/problem+json' },
    }))
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>).accept)
      .toBe('application/json, application/problem+json')
  })
})
