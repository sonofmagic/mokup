import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { decodeBase64 } from '../src/hooks/playground-request/base64'
import { buildDisplayPath, buildResolvedPath, buildRouteParams } from '../src/hooks/playground-request/params'
import { buildQueryString, parseKeyValueInput } from '../src/hooks/playground-request/query'
import { createRequestRunner } from '../src/hooks/playground-request/request-runner'
import { parseWsMessage, resolvePlaygroundWsUrl } from '../src/hooks/playground-request/websocket'

describe('playground request helpers', () => {
  it('decodes base64 input', () => {
    const decoded = decodeBase64('aGVsbG8=')
    const text = decoded.value ? new TextDecoder().decode(decoded.value) : ''
    expect(text).toBe('hello')

    const invalid = decodeBase64('%%')
    expect(invalid.error).toBeTruthy()
  })

  it('builds query strings and parses key-value input', () => {
    const search = buildQueryString({ q: 'ok', tags: [1, 2], skip: undefined })
    expect(new URLSearchParams(search).getAll('tags')).toEqual(['1', '2'])
    expect(search).toContain('q=ok')

    const entries = parseKeyValueInput('a=1\nb=2&c=3')
    expect(entries).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ])
  })

  it('builds params and display paths', () => {
    const tokens = [
      { type: 'static', value: 'users' },
      { type: 'param', name: 'id' },
      { type: 'catchall', name: 'slug' },
    ] as const
    const params = buildRouteParams(tokens)
    expect(params.map(item => item.name)).toEqual(['id', 'slug'])

    const resolved = buildResolvedPath(tokens, { id: '1', slug: 'a/b' })
    expect(resolved.path).toBe('/users/1/a/b')
    expect(resolved.missing).toEqual([])

    const display = buildDisplayPath(tokens, { id: '' })
    expect(display).toBe('/users/[id]/[...slug]')
  })

  it('handles optional catchall params and dedupes fields', () => {
    const tokens = [
      { type: 'param', name: 'id' },
      { type: 'param', name: 'id' },
      { type: 'optional-catchall', name: 'rest' },
      { type: 'catchall', name: 'slug' },
    ] as const

    const params = buildRouteParams(tokens)
    expect(params.map(param => param.name)).toEqual(['id', 'rest', 'slug'])
    expect(params.find(param => param.name === 'rest')?.required).toBe(false)

    const resolved = buildResolvedPath(tokens, { id: '', rest: '', slug: 'a/b' })
    expect(resolved.path).toBe('/a/b')
    expect(resolved.missing).toEqual(['id'])

    const display = buildDisplayPath(tokens, { id: '', rest: '' })
    expect(display).toBe('/[id]/[id]/[...slug]')
  })

  it('parses ws messages and resolves ws url', () => {
    vi.stubEnv('VITE_MOKUP_PLAYGROUND_WS', '1')
    const url = resolvePlaygroundWsUrl('/__mokup')
    expect(url).toContain('ws://')
    expect(url).toContain('/__mokup/ws')

    const snapshot = parseWsMessage(JSON.stringify({ type: 'snapshot', total: 1, perRoute: {} }))
    expect(snapshot?.type).toBe('snapshot')

    const increment = parseWsMessage(JSON.stringify({ type: 'increment', routeKey: 'k', total: 2 }))
    expect(increment?.type).toBe('increment')

    expect(parseWsMessage('not-json')).toBeNull()
  })

  it('runs requests and formats responses', async () => {
    const responseText = ref('')
    const responseStatus = ref('')
    const responseTime = ref('')
    const routeCounts = ref<Record<string, number>>({})
    const selected = ref({
      method: 'POST',
      url: '/users/[id]',
      file: 'mock/users.post.ts',
      type: 'handler',
    })
    const routeTokens = ref([])
    const paramValues = ref({ id: '1' })
    const queryText = ref('{"q":"ok"}')
    const headersText = ref('{"X-Test":"1"}')
    const bodyText = ref('{"name":"Ada"}')
    const bodyType = ref<'json'>('json')
    const t = (key: string, params?: Record<string, string | number>) => {
      if (!params) {
        return key
      }
      return `${key}:${Object.values(params).join(',')}`
    }
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchSpy)

    const { runRequest } = createRequestRunner({
      t,
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
      isServerCounts: ref(false),
      ensureSwReady: async () => true,
      getRouteKey: route => route.file,
    })

    await runRequest()

    expect(fetchSpy).toHaveBeenCalled()
    expect(responseStatus.value).toContain('200')
    expect(responseText.value).toContain('"ok": true')
    expect(routeCounts.value['mock/users.post.ts']).toBe(1)
  })
})
