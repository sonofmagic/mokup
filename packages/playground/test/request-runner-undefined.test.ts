import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createRequestRunner } from '../src/hooks/playground-request/request-runner'

vi.mock('../src/utils/request', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/request')>(
    '../src/utils/request',
  )
  return {
    ...actual,
    parseJsonInput: vi.fn(() => ({
      value: { 'x-undef': undefined },
    })),
  }
})

describe('request runner undefined headers', () => {
  it('skips undefined header values and handles missing content-type', async () => {
    const route = { method: 'GET', url: '/ping', file: 'ping.ts', type: 'handler' }
    const selected = ref(route)
    const routeTokens = ref([] as any)
    const paramValues = ref<Record<string, string>>({})
    const queryText = ref('')
    const headersText = ref('{}')
    const bodyText = ref('')
    const bodyType = ref<'json' | 'text' | 'form' | 'multipart' | 'base64'>('text')
    const responseText = ref('')
    const responseStatus = ref('')
    const responseTime = ref('')
    const routeCounts = ref<Record<string, number>>({})
    const isServerCounts = ref(false)

    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    vi.stubGlobal('performance', { now: vi.fn(() => 10) })

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      text: vi.fn().mockResolvedValue(''),
    })
    vi.stubGlobal('fetch', fetchMock)

    const runner = createRequestRunner({
      t: (key: string) => key,
      selected,
      routeTokens,
      paramValues,
      queryText,
      headersText,
      bodyText,
      bodyType,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'GET /ping',
    })

    await runner.runRequest()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect((init.headers as Record<string, string>)['x-undef']).toBeUndefined()
    expect(responseText.value).toBe('response.emptyPayload')
  })
})
