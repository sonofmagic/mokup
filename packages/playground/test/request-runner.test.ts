import type { BodyType, RawBodyType } from '../src/types'
import { parseRouteTemplate } from '@mokup/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createRequestRunner } from '../src/hooks/playground-request/request-runner'

describe('request runner', () => {
  it('handles validation errors before fetching', async () => {
    const route = { method: 'POST', url: '/upload/[id]', file: 'upload.ts', type: 'handler' }
    const tokens = parseRouteTemplate(route.url).tokens
    const selected = ref(route)
    const routeTokens = ref(tokens)
    const paramValues = ref<Record<string, string>>({})
    const queryText = ref('')
    const headersText = ref('')
    const bodyText = ref('')
    const bodyType = ref<BodyType>('raw')
    const rawType = ref<RawBodyType>('json')
    const rawValidate = ref(true)
    const responseText = ref('')
    const responseStatus = ref('')
    const responseTime = ref('')
    const routeCounts = ref<Record<string, number>>({})
    const isServerCounts = ref(false)

    const runner = createRequestRunner({
      t: (key: string) => key,
      selected,
      routeTokens,
      paramValues,
      queryText,
      headersText,
      bodyText,
      bodyType,
      rawType,
      rawValidate,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'POST /upload/:id',
      onMissingParams: vi.fn(),
    })

    await runner.runRequest()
    expect(responseText.value).toBe('errors.routeParams')

    paramValues.value = { id: '1' }
    queryText.value = '{'
    await runner.runRequest()
    expect(responseText.value).toBe('errors.queryJson')

    queryText.value = '{}'
    headersText.value = '{'
    await runner.runRequest()
    expect(responseText.value).toBe('errors.headersJson')

    headersText.value = '{}'
    bodyType.value = 'raw'
    rawType.value = 'json'
    rawValidate.value = true
    bodyText.value = '{'
    await runner.runRequest()
    expect(responseText.value).toBe('errors.bodyJson')
  })

  it('builds request bodies and handles responses', async () => {
    const route = { method: 'POST', url: '/upload/[id]', file: 'upload.ts', type: 'handler' }
    const tokens = parseRouteTemplate(route.url).tokens
    const selected = ref(route)
    const routeTokens = ref(tokens)
    const paramValues = ref<Record<string, string>>({ id: '1' })
    const queryText = ref('')
    const headersText = ref('')
    const bodyText = ref('')
    const bodyType = ref<BodyType>('raw')
    const rawType = ref<RawBodyType>('text')
    const rawValidate = ref(true)
    const binaryFile = ref<File | null>(null)
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
      headers: { get: () => 'application/json' },
      text: vi.fn().mockResolvedValue('{"ok":true}'),
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
      rawType,
      rawValidate,
      binaryFile,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'POST /upload/:id',
    })

    bodyType.value = 'raw'
    rawType.value = 'text'
    bodyText.value = 'hello'
    await runner.runRequest()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost/upload/1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'text/plain; charset=utf-8' }),
        body: 'hello',
      }),
    )

    bodyType.value = 'form-urlencoded'
    bodyText.value = 'a=1'
    await runner.runRequest()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost/upload/1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' }),
        body: 'a=1',
      }),
    )

    bodyType.value = 'form-data'
    bodyText.value = 'a=1'
    await runner.runRequest()
    const lastMultipart = fetchMock.mock.calls.at(-1)?.[1] as RequestInit
    expect(lastMultipart.body).toBeInstanceOf(FormData)

    bodyType.value = 'binary'
    binaryFile.value = new File(['hello'], 'hello.bin', { type: 'application/octet-stream' })
    await runner.runRequest()
    const lastBinary = fetchMock.mock.calls.at(-1)?.[1] as RequestInit
    expect(lastBinary.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/octet-stream' }))

    expect(responseStatus.value).toBe('200 OK')
    expect(responseText.value).toContain('"ok"')
    const beforeCount = routeCounts.value['POST /upload/:id'] ?? 0
    expect(beforeCount).toBeGreaterThan(0)

    isServerCounts.value = true
    await runner.runRequest()
    expect(routeCounts.value['POST /upload/:id']).toBe(beforeCount)
  })

  it('includes multipart files in FormData', async () => {
    const route = { method: 'POST', url: '/upload/[id]', file: 'upload.ts', type: 'handler' }
    const tokens = parseRouteTemplate(route.url).tokens
    const selected = ref(route)
    const routeTokens = ref(tokens)
    const paramValues = ref<Record<string, string>>({ id: '1' })
    const queryText = ref('')
    const headersText = ref('')
    const bodyText = ref('note=alpha')
    const bodyType = ref<BodyType>('form-data')
    const rawType = ref<RawBodyType>('text')
    const rawValidate = ref(true)
    const multipartFiles = ref([
      {
        id: 'row-1',
        name: 'files',
        files: [new File(['hello'], 'hello.txt', { type: 'text/plain' })],
      },
    ])
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
      headers: { get: () => 'application/json' },
      text: vi.fn().mockResolvedValue('{"ok":true}'),
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
      rawType,
      rawValidate,
      multipartFiles,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'POST /upload/:id',
    })

    await runner.runRequest()
    const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit
    const formData = init.body as FormData
    const entries = Array.from(formData.entries())
    expect(entries).toEqual(expect.arrayContaining([
      ['note', 'alpha'],
      ['files', expect.any(File)],
    ]))

    bodyText.value = ''
    multipartFiles.value = [
      {
        id: 'row-2',
        name: 'assets',
        files: [
          new File(['one'], 'one.txt', { type: 'text/plain' }),
          new File(['two'], 'two.txt', { type: 'text/plain' }),
        ],
      },
    ]
    await runner.runRequest()
    const secondInit = fetchMock.mock.calls.at(-1)?.[1] as RequestInit
    expect(secondInit.body).toBeInstanceOf(FormData)
  })

  it('does not override Content-Type when headers are provided', async () => {
    const route = { method: 'POST', url: '/upload/[id]', file: 'upload.ts', type: 'handler' }
    const tokens = parseRouteTemplate(route.url).tokens
    const selected = ref(route)
    const routeTokens = ref(tokens)
    const paramValues = ref<Record<string, string>>({ id: '1' })
    const queryText = ref('')
    const headersText = ref('{"Content-Type":"application/custom"}')
    const bodyText = ref('')
    const bodyType = ref<BodyType>('raw')
    const rawType = ref<RawBodyType>('json')
    const rawValidate = ref(true)
    const binaryFile = ref<File | null>(null)
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
      headers: { get: () => 'application/json' },
      text: vi.fn().mockResolvedValue('{"ok":true}'),
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
      rawType,
      rawValidate,
      binaryFile,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'POST /upload/:id',
    })

    bodyType.value = 'raw'
    rawType.value = 'json'
    bodyText.value = '{"ok":true}'
    await runner.runRequest()

    bodyType.value = 'raw'
    rawType.value = 'text'
    bodyText.value = 'hello'
    await runner.runRequest()

    bodyType.value = 'form-urlencoded'
    bodyText.value = 'a=1'
    await runner.runRequest()

    bodyType.value = 'binary'
    binaryFile.value = new File(['hello'], 'hello.bin', { type: 'application/octet-stream' })
    await runner.runRequest()

    for (const call of fetchMock.mock.calls) {
      const init = call?.[1] as RequestInit
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/custom')
    }
  })

  it('handles empty selections, headers, and response failures', async () => {
    const route = { method: 'GET', url: '/ping', file: 'ping.ts', type: 'handler' }
    const selected = ref<null | typeof route>(null)
    const routeTokens = ref([] as any)
    const paramValues = ref<Record<string, string>>({})
    const queryText = ref('')
    const headersText = ref(JSON.stringify({ 'x-optional': undefined, 'list': ['a', 'b'] }))
    const bodyText = ref('')
    const bodyType = ref<BodyType>('none')
    const rawType = ref<RawBodyType>('text')
    const rawValidate = ref(true)
    const responseText = ref('')
    const responseStatus = ref('')
    const responseTime = ref('')
    const routeCounts = ref<Record<string, number>>({})
    const isServerCounts = ref(false)

    const runner = createRequestRunner({
      t: (key: string) => key,
      selected,
      routeTokens,
      paramValues,
      queryText,
      headersText,
      bodyText,
      bodyType,
      rawType,
      rawValidate,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'GET /ping',
    })

    runner.resetResponse()
    expect(responseStatus.value).toBe('response.idle')

    await runner.runRequest()
    expect(responseStatus.value).toBe('response.idle')

    selected.value = route
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    vi.stubGlobal('performance', { now: vi.fn(() => 5) })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce('boom'))
    await runner.runRequest()
    expect(responseStatus.value).toBe('response.error')
    expect(responseText.value).toBe('boom')
  })

  it('handles empty bodies and non-json responses', async () => {
    const route = { method: 'POST', url: '/ping', file: 'ping.ts', type: 'handler' }
    const selected = ref(route)
    const routeTokens = ref(parseRouteTemplate(route.url).tokens)
    const paramValues = ref<Record<string, string>>({})
    const queryText = ref('')
    const headersText = ref('{}')
    const bodyText = ref(' ')
    const bodyType = ref<BodyType>('raw')
    const rawType = ref<RawBodyType>('text')
    const rawValidate = ref(true)
    const binaryFile = ref<File | null>(null)
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
      headers: { get: () => 'text/plain' },
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
      rawType,
      rawValidate,
      binaryFile,
      responseText,
      responseStatus,
      responseTime,
      routeCounts,
      isServerCounts,
      ensureSwReady: async () => true,
      getRouteKey: () => 'POST /ping',
    })

    await runner.runRequest()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.body).toBeUndefined()
    expect(responseText.value).toBe('response.emptyPayload')

    bodyType.value = 'raw'
    rawType.value = 'json'
    bodyText.value = ''
    await runner.runRequest()

    bodyType.value = 'form-urlencoded'
    bodyText.value = ''
    await runner.runRequest()

    bodyType.value = 'form-data'
    bodyText.value = ''
    await runner.runRequest()

    bodyType.value = 'binary'
    binaryFile.value = null
    await runner.runRequest()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
