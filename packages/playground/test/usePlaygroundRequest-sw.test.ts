import type { PlaygroundRoute } from '../src/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { usePlaygroundRequest } from '../src/hooks/usePlaygroundRequest'

const hooks = vi.hoisted(() => ({
  beforeUnmount: null as null | (() => void),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    getCurrentInstance: () => ({}),
    onBeforeUnmount: (cb: () => void) => {
      hooks.beforeUnmount = cb
    },
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const swMocks = vi.hoisted(() => ({
  isMokupController: vi.fn(),
  resolveMokupRegistration: vi.fn(),
}))

vi.mock('../src/hooks/playground-request/service-worker', () => swMocks)

describe('usePlaygroundRequest service worker', () => {
  const route: PlaygroundRoute = {
    method: 'GET',
    url: '/api/hello',
    file: 'mock.ts',
    type: 'handler',
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    swMocks.isMokupController.mockReset()
    swMocks.resolveMokupRegistration.mockReset()
    hooks.beforeUnmount = null
  })

  it('uses existing service worker controller', async () => {
    swMocks.isMokupController.mockReturnValue(true)
    swMocks.resolveMokupRegistration.mockResolvedValue(null)
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    vi.stubGlobal('navigator', {
      serviceWorker: {
        controller: { scriptURL: 'http://localhost/mokup-sw.js' },
        ready: Promise.resolve(),
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'text/plain' },
      text: vi.fn().mockResolvedValue('ok'),
    }))

    const selected = ref<PlaygroundRoute | null>(route)
    const request = usePlaygroundRequest(selected)
    await request.runRequest()

    expect(swMocks.resolveMokupRegistration).not.toHaveBeenCalled()
    expect(request.isSwRegistering.value).toBe(false)
  })

  it('handles missing service worker registrations', async () => {
    swMocks.isMokupController.mockReturnValue(false)
    swMocks.resolveMokupRegistration.mockResolvedValue(null)
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(), controller: null } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'text/plain' },
      text: vi.fn().mockResolvedValue('ok'),
    }))

    const selected = ref<PlaygroundRoute | null>(route)
    const request = usePlaygroundRequest(selected)
    await request.runRequest()

    expect(swMocks.resolveMokupRegistration).toHaveBeenCalled()
    expect(request.isSwRegistering.value).toBe(false)
  })

  it('waits for service worker readiness when registration exists', async () => {
    swMocks.isMokupController.mockReturnValue(false)
    swMocks.resolveMokupRegistration.mockResolvedValue({ scope: '/' })
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(), controller: null } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'text/plain' },
      text: vi.fn().mockResolvedValue('ok'),
    }))

    const selected = ref<PlaygroundRoute | null>(route)
    const request = usePlaygroundRequest(selected)
    await request.runRequest()

    expect(swMocks.resolveMokupRegistration).toHaveBeenCalled()
    expect(request.isSwRegistering.value).toBe(false)
  })

  it('handles service worker readiness failures', async () => {
    swMocks.isMokupController.mockReturnValue(false)
    swMocks.resolveMokupRegistration.mockResolvedValue({ scope: '/' })
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    const readyPromise = Promise.reject(new Error('fail'))
    readyPromise.catch(() => undefined)
    vi.stubGlobal('navigator', { serviceWorker: { ready: readyPromise, controller: null } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'text/plain' },
      text: vi.fn().mockResolvedValue('ok'),
    }))

    const selected = ref<PlaygroundRoute | null>(route)
    const request = usePlaygroundRequest(selected)
    await request.runRequest()

    expect(swMocks.resolveMokupRegistration).toHaveBeenCalled()

    await request.runRequest()
    expect(swMocks.resolveMokupRegistration).toHaveBeenCalledTimes(2)
  })

  it('cleans up websocket on unmount', async () => {
    swMocks.isMokupController.mockReturnValue(false)
    swMocks.resolveMokupRegistration.mockResolvedValue(null)

    const closeSpy = vi.fn()
    class MockWebSocket {
      url: string
      constructor(url: string) {
        this.url = url
      }

      addEventListener() {}
      close() {
        closeSpy()
      }
    }

    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(), controller: null } })
    vi.stubGlobal('WebSocket', MockWebSocket as never)

    const selected = ref<PlaygroundRoute | null>(route)
    const basePath = ref('/__mokup')
    usePlaygroundRequest(selected, { basePath })
    await nextTick()

    hooks.beforeUnmount?.()
    expect(closeSpy).toHaveBeenCalled()
  })
})
