import { describe, expect, it } from 'vitest'
import { createMockResolver } from '../src/core'

const baseOptions = {
  mockBase: 'http://mokup.local',
  realBase: 'https://api.example.com',
  pathMap: [{ from: '/api/*', to: '/*' }],
}

describe('mock resolver', () => {
  it('prefers explicit mock over markers and globals', () => {
    const resolver = createMockResolver({
      ...baseOptions,
      env: { useMock: false },
    })
    resolver.setUseMock(false)
    const result = resolver.resolve({
      url: '/api/users',
      mock: true,
      headers: { 'x-mokup': '0' },
    })

    expect(result.mode).toBe('mock')
    expect(result.meta?.reason).toBe('explicit')
    expect(result.url).toBe('http://mokup.local/users')
  })

  it('uses marker when explicit flag is absent', () => {
    const resolver = createMockResolver(baseOptions)
    const result = resolver.resolve({
      url: '/api/users',
      headers: { 'x-mokup': '1' },
    })

    expect(result.mode).toBe('mock')
    expect(result.meta?.reason).toBe('marker')
  })

  it('falls back to global flag and environment defaults', () => {
    const resolver = createMockResolver({
      ...baseOptions,
      env: { useMock: 'true' },
    })

    const envResult = resolver.resolve({ url: '/api/ping' })
    expect(envResult.mode).toBe('mock')
    expect(envResult.meta?.reason).toBe('env')

    resolver.setUseMock(false)
    const globalResult = resolver.resolve({ url: '/api/ping' })
    expect(globalResult.mode).toBe('real')
    expect(globalResult.meta?.reason).toBe('global')
  })

  it('respects host allowlist and avoids query markers when blocked', () => {
    const resolver = createMockResolver({
      ...baseOptions,
      allowHosts: ['api.example.com'],
      markers: { query: true },
    })

    const result = resolver.resolve({
      url: 'https://other.example.com/api/users',
      mock: true,
    })

    expect(result.url).toBe('https://other.example.com/api/users')
    expect(result.meta?.warning).toBe('host-not-allowed')
    expect(result.url.includes('__mokup')).toBe(false)
  })
})
