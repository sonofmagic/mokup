import type { RouteToken } from '@mokup/runtime'
import type { Ref } from 'vue'
import type { BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType } from '../../types'
import type { RouteCounts } from './websocket'
import { parseRouteTemplate } from '@mokup/runtime'
import { applyQuery, parseJsonInput } from '../../utils/request'
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
  rawType: Ref<RawBodyType>
  rawValidate: Ref<boolean>
  multipartFiles?: Ref<MultipartFileEntry[]>
  binaryFile?: Ref<File | null>
  responseRaw: Ref<string>
  responsePretty: Ref<string>
  responseHeaders: Ref<Record<string, string>>
  responseContentType: Ref<string>
  responseStatus: Ref<string>
  responseTime: Ref<string>
  routeCounts: Ref<RouteCounts>
  isServerCounts: Ref<boolean>
  ensureSwReady: () => Promise<boolean>
  getRouteKey: (route: PlaygroundRoute) => string
  onMissingParams?: (missing: string[]) => void
}) {
  const resolveRawContentType = (rawType: RawBodyType) => {
    switch (rawType) {
      case 'javascript':
        return 'application/javascript; charset=utf-8'
      case 'json':
        return 'application/json; charset=utf-8'
      case 'html':
        return 'text/html; charset=utf-8'
      case 'xml':
        return 'text/xml; charset=utf-8'
      default:
        return 'text/plain; charset=utf-8'
    }
  }
  const resetResponse = () => {
    params.responseRaw.value = ''
    params.responsePretty.value = params.t('response.empty')
    params.responseHeaders.value = {}
    params.responseContentType.value = ''
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
      params.onMissingParams?.(resolved.missing)
      const message = params.t('errors.routeParams', { params: resolved.missing.join(', ') })
      params.responseRaw.value = ''
      params.responsePretty.value = message
      params.responseHeaders.value = {}
      params.responseContentType.value = ''
      params.responseStatus.value = params.t('response.error')
      params.responseTime.value = ''
      return
    }
    const requestKey = params.getRouteKey(params.selected.value)
    const parsedQuery = parseJsonInput(params.queryText.value)
    if (parsedQuery.error) {
      const message = params.t('errors.queryJson', { message: parsedQuery.error })
      params.responseRaw.value = ''
      params.responsePretty.value = message
      params.responseHeaders.value = {}
      params.responseContentType.value = ''
      params.responseStatus.value = params.t('response.error')
      params.responseTime.value = ''
      return
    }
    const parsedHeaders = parseJsonInput(params.headersText.value)
    if (parsedHeaders.error) {
      const message = params.t('errors.headersJson', { message: parsedHeaders.error })
      params.responseRaw.value = ''
      params.responsePretty.value = message
      params.responseHeaders.value = {}
      params.responseContentType.value = ''
      params.responseStatus.value = params.t('response.error')
      params.responseTime.value = ''
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
      if (params.bodyType.value === 'raw') {
        const trimmed = rawBody.trim()
        if (params.rawType.value === 'json' && params.rawValidate.value) {
          const parsedBody = parseJsonInput(rawBody)
          if (parsedBody.error) {
            const message = params.t('errors.bodyJson', { message: parsedBody.error })
            params.responseRaw.value = ''
            params.responsePretty.value = message
            params.responseHeaders.value = {}
            params.responseContentType.value = ''
            params.responseStatus.value = params.t('response.error')
            params.responseTime.value = ''
            return
          }
        }
        if (trimmed) {
          init.body = rawBody
          if (!headers['Content-Type']) {
            headers['Content-Type'] = resolveRawContentType(params.rawType.value)
          }
        }
      }
      else if (params.bodyType.value === 'form-urlencoded') {
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
      else if (params.bodyType.value === 'form-data') {
        const entries = parseKeyValueInput(rawBody)
        const fileEntries = (params.multipartFiles?.value ?? [])
          .map(entry => ({
            name: entry.name.trim(),
            files: entry.files,
          }))
          .filter(entry => entry.name.length > 0 && entry.files.length > 0)
        if (entries.length > 0 || fileEntries.length > 0) {
          const formData = new FormData()
          for (const [key, value] of entries) {
            formData.append(key, value)
          }
          for (const entry of fileEntries) {
            for (const file of entry.files) {
              formData.append(entry.name, file)
            }
          }
          init.body = formData
        }
      }
      else if (params.bodyType.value === 'binary') {
        const file = params.binaryFile?.value ?? null
        if (file) {
          init.body = file
          if (!headers['Content-Type']) {
            headers['Content-Type'] = file.type || 'application/octet-stream'
          }
        }
      }
    }

    params.responseStatus.value = params.t('response.loading')
    params.responseTime.value = ''
    params.responseRaw.value = ''
    params.responsePretty.value = params.t('response.waiting')
    params.responseHeaders.value = {}
    params.responseContentType.value = ''

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
      const headersRecord: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headersRecord[key] = value
      })
      params.responseHeaders.value = headersRecord
      const contentType = response.headers.get('content-type') ?? ''
      params.responseContentType.value = contentType
      const raw = await response.text()
      params.responseRaw.value = raw
      if (contentType.includes('application/json')) {
        try {
          params.responsePretty.value = JSON.stringify(JSON.parse(raw), null, 2)
        }
        catch {
          params.responsePretty.value = raw || params.t('response.emptyPayload')
        }
      }
      else {
        params.responsePretty.value = raw || params.t('response.emptyPayload')
      }
    }
    catch (err) {
      params.responseStatus.value = params.t('response.error')
      const message = err instanceof Error ? err.message : String(err)
      params.responseRaw.value = ''
      params.responsePretty.value = message
      params.responseHeaders.value = {}
      params.responseContentType.value = ''
    }
  }

  return { resetResponse, runRequest }
}

export { createRequestRunner }
