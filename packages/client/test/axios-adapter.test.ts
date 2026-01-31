import { describe, expect, it } from 'vitest'
import { createAxiosRequestInterceptor } from '../src/adapters/axios'

describe('axios adapter', () => {
  it('rewrites base url and path', async () => {
    const interceptor = createAxiosRequestInterceptor({
      resolverOptions: {
        mockBase: 'http://mokup.local',
        realBase: 'https://api.example.com',
        pathMap: [{ from: '/api/*', to: '/*' }],
        markers: { header: true },
      },
    })

    const result = await interceptor({
      baseURL: 'https://api.example.com',
      url: '/api/users',
      mock: true,
      headers: { 'X-Test': '1' },
    })

    expect(result.baseURL).toBe('')
    expect(result.url).toBe('http://mokup.local/users')
    expect(result.headers?.['x-test']).toBe('1')
    expect(result.headers?.['x-mokup']).toBe('1')
  })

  it('keeps absolute urls that are not allowed', async () => {
    const interceptor = createAxiosRequestInterceptor({
      resolverOptions: {
        mockBase: 'http://mokup.local',
        allowHosts: ['api.example.com'],
      },
    })

    const result = await interceptor({
      url: 'https://other.example.com/api/users',
      mock: true,
    })

    expect(result.url).toBe('https://other.example.com/api/users')
  })
})
