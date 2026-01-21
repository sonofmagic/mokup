import type { PlaygroundRoute } from '../src/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { usePlaygroundRequest } from '../src/hooks/usePlaygroundRequest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('usePlaygroundRequest', () => {
  const route: PlaygroundRoute = {
    method: 'GET',
    url: '/api/hello',
    file: 'mock.ts',
    type: 'handler',
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('increments counts after a response is received', async () => {
    const selected = ref<PlaygroundRoute | null>(route)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'text/plain' },
      text: vi.fn().mockResolvedValue('ok'),
    }))

    const { runRequest, getRouteCount, totalCount } = usePlaygroundRequest(selected)
    await runRequest()

    expect(getRouteCount(route)).toBe(1)
    expect(totalCount.value).toBe(1)
  })

  it('does not increment counts when fetch throws', async () => {
    const selected = ref<PlaygroundRoute | null>(route)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    const { runRequest, getRouteCount, totalCount } = usePlaygroundRequest(selected)
    await runRequest()

    expect(getRouteCount(route)).toBe(0)
    expect(totalCount.value).toBe(0)
  })
})
