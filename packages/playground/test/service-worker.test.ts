import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMokupController, resolveMokupRegistration } from '../src/hooks/playground-request/service-worker'

describe('service worker helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects mokup controllers', () => {
    expect(isMokupController(null)).toBe(false)
    expect(isMokupController({ scriptURL: 'https://example.com/mokup-sw.js' } as ServiceWorker)).toBe(true)
    expect(isMokupController({ scriptURL: 'https://example.com/other.js' } as ServiceWorker)).toBe(false)
    expect(isMokupController({ scriptURL: 'mokup-sw.js' } as ServiceWorker)).toBe(true)
  })

  it('resolves mokup registrations from navigator', async () => {
    const registration = { active: { scriptURL: 'https://example.com/mokup-sw.js' } }
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockResolvedValue(registration),
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    })

    const resolved = await resolveMokupRegistration()
    expect(resolved).toBe(registration)
  })

  it('falls back to registrations list and handles errors', async () => {
    const registration = { waiting: { scriptURL: 'https://example.com/mokup-sw.js' } }
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockRejectedValue(new Error('boom')),
        getRegistrations: vi.fn().mockResolvedValue([registration]),
      },
    })

    const resolved = await resolveMokupRegistration()
    expect(resolved).toBe(registration)

    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockRejectedValue(new Error('boom')),
        getRegistrations: vi.fn().mockRejectedValue(new Error('boom')),
      },
    })

    const failed = await resolveMokupRegistration()
    expect(failed).toBeNull()
  })

  it('returns null without service worker support', async () => {
    const resolved = await resolveMokupRegistration()
    expect(resolved).toBeNull()

    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', {})
    const missing = await resolveMokupRegistration()
    expect(missing).toBeNull()
  })
})
