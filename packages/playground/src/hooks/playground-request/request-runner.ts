import type { RouteToken } from '@mokup/runtime'
import type { Ref } from 'vue'
import type { BodyType, PlaygroundRoute } from '../../types'
import type { RouteCounts } from './websocket'
import { parseRouteTemplate } from '@mokup/runtime'
import { applyQuery, parseJsonInput } from '../../utils/request'
import { decodeBase64 } from './base64'
import { buildResolvedPath } from './params'
import { parseKeyValueInput } from './query'

function createRequestRunner(params: {
  t: (key: string, params?: Record<string, string | number>) => string
  selected: Ref<PlaygroundRoute | null>
  routeTokens: Ref<RouteToken[]>
  paramValues: Ref<Record<string, string>>
  queryText: Ref<string>
  headersText: Ref<string>
  bodyText: Ref<string>
  bodyType: Ref<BodyType>
  responseText: Ref<string>
  responseStatus: Ref<string>
  responseTime: Ref<string>
  routeCounts: Ref<RouteCounts>
  isServerCounts: Ref<boolean>
  ensureSwReady: () => Promise<boolean>
  getRouteKey: (route: PlaygroundRoute) => string
}) {
  const resetResponse = () => {
    params.responseText.value = params.t('response.empty')
    params.responseStatus.value = params.t('response.idle')
    params.responseTime.value = ''
  }

  const runRequest = async () => {
    if (!params.selected.value) {
      return
    }
    const tokens = params.routeTokens.value.length > 0
      ? params.routeTokens.value
      : parseRouteTemplate(params.selected.value.url).tokens
    const resolved = buildResolvedPath(tokens, params.paramValues.value)
    if (resolved.missing.length > 0) {
      params.responseText.value = params.t('errors.routeParams', { params: resolved.missing.join(', ') })
      return
    }
    const requestKey = params.getRouteKey(params.selected.value)
    const parsedQuery = parseJsonInput(params.queryText.value)
    if (parsedQuery.error) {
      params.responseText.value = params.t('errors.queryJson', { message: parsedQuery.error })
      return
    }
    const parsedHeaders = parseJsonInput(params.headersText.value)
    if (parsedHeaders.error) {
      params.responseText.value = params.t('errors.headersJson', { message: parsedHeaders.error })
      return
    }
    const url = new URL(resolved.path, window.location.origin)
    if (parsedQuery.value) {
      applyQuery(url, parsedQuery.value)
    }

    const headers: Record<string, string> = {}
    if (parsedHeaders.value) {
      for (const [key, value] of Object.entries(parsedHeaders.value)) {
        if (typeof value === 'undefined') {
          continue
        }
        headers[key] = Array.isArray(value) ? value.join(',') : String(value)
      }
    }

    const init: RequestInit = {
      method: params.selected.value.method,
      headers,
    }

    const upperMethod = params.selected.value.method.toUpperCase()
    if (upperMethod !== 'GET' && upperMethod !== 'HEAD') {
      const rawBody = params.bodyText.value
      if (params.bodyType.value === 'json') {
        const parsedBody = parseJsonInput(rawBody)
        if (parsedBody.error) {
          params.responseText.value = params.t('errors.bodyJson', { message: parsedBody.error })
          return
        }
        if (parsedBody.value) {
          init.body = JSON.stringify(parsedBody.value)
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
          }
        }
      }
      else if (params.bodyType.value === 'text') {
        const trimmed = rawBody.trim()
        if (trimmed) {
          init.body = rawBody
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'text/plain; charset=utf-8'
          }
        }
      }
      else if (params.bodyType.value === 'form') {
        const entries = parseKeyValueInput(rawBody)
        if (entries.length > 0) {
          const paramsBody = new URLSearchParams()
          for (const [key, value] of entries) {
            paramsBody.append(key, value)
          }
          init.body = paramsBody.toString()
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
          }
        }
      }
      else if (params.bodyType.value === 'multipart') {
        const entries = parseKeyValueInput(rawBody)
        if (entries.length > 0) {
          const formData = new FormData()
          for (const [key, value] of entries) {
            formData.append(key, value)
          }
          init.body = formData
        }
      }
      else if (params.bodyType.value === 'base64') {
        const parsed = decodeBase64(rawBody)
        if (parsed.error) {
          params.responseText.value = params.t('errors.bodyBase64', { message: parsed.error })
          return
        }
        if (parsed.value) {
          init.body = parsed.value
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/octet-stream'
          }
        }
      }
    }

    params.responseStatus.value = params.t('response.loading')
    params.responseTime.value = ''
    params.responseText.value = params.t('response.waiting')

    await params.ensureSwReady()
    const startedAt = performance.now()
    try {
      const response = await fetch(url.toString(), init)
      if (!params.isServerCounts.value) {
        params.routeCounts.value[requestKey] = (params.routeCounts.value[requestKey] ?? 0) + 1
      }
      const duration = Math.round(performance.now() - startedAt)
      params.responseTime.value = `${duration}ms`
      params.responseStatus.value = `${response.status} ${response.statusText}`
      const contentType = response.headers.get('content-type') ?? ''
      const raw = await response.text()
      if (contentType.includes('application/json')) {
        try {
          params.responseText.value = JSON.stringify(JSON.parse(raw), null, 2)
        }
        catch {
          params.responseText.value = raw
        }
      }
      else {
        params.responseText.value = raw || params.t('response.emptyPayload')
      }
    }
    catch (err) {
      params.responseStatus.value = params.t('response.error')
      params.responseText.value = err instanceof Error ? err.message : String(err)
    }
  }

  return { resetResponse, runRequest }
}

export { createRequestRunner }
