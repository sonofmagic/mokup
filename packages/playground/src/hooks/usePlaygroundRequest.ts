import type { RouteToken } from '@mokup/runtime'
import type { Ref } from 'vue'
import type { PlaygroundRoute, RouteParamField, RouteParamKind } from '../types'
import { parseRouteTemplate } from '@mokup/runtime'
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyQuery, parseJsonInput } from '../utils/request'

let swReadyPromise: Promise<void> | null = null

function isMokupScriptUrl(url: string) {
  try {
    return new URL(url).pathname.includes('mokup-sw')
  }
  catch {
    return url.includes('mokup-sw')
  }
}

function isMokupRegistration(registration: ServiceWorkerRegistration) {
  const scriptUrls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter((entry): entry is string => typeof entry === 'string')
  return scriptUrls.some(url => isMokupScriptUrl(url))
}

function isMokupController(controller: ServiceWorker | null | undefined) {
  return !!controller && isMokupScriptUrl(controller.scriptURL)
}

async function resolveMokupRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && isMokupRegistration(registration)) {
      return registration
    }
  }
  catch {
    // Ignore lookup errors.
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    return registrations.find(isMokupRegistration) ?? null
  }
  catch {
    return null
  }
}

type RouteCounts = Record<string, number>
interface PlaygroundWsSnapshot {
  type: 'snapshot'
  total: number
  perRoute: RouteCounts
}
interface PlaygroundWsIncrement {
  type: 'increment'
  routeKey: string
  total: number
}

function formatParamToken(kind: RouteParamKind, name: string) {
  if (kind === 'catchall') {
    return `[...${name}]`
  }
  if (kind === 'optional-catchall') {
    return `[[...${name}]]`
  }
  return `[${name}]`
}

function buildRouteParams(tokens: RouteToken[]) {
  const params: RouteParamField[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    if (token.type === 'static') {
      continue
    }
    if (seen.has(token.name)) {
      continue
    }
    seen.add(token.name)
    const kind = token.type
    params.push({
      id: `${kind}:${token.name}`,
      name: token.name,
      kind,
      token: formatParamToken(kind, token.name),
      required: kind !== 'optional-catchall',
    })
  }
  return params
}

function splitCatchallInput(value: string) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? trimmed.split('/').filter(Boolean) : []
}

function buildQueryString(query: Record<string, unknown>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, String(item)))
    }
    else {
      params.set(key, String(value))
    }
  }
  const search = params.toString()
  return search ? `?${search}` : ''
}

function buildResolvedPath(tokens: RouteToken[], values: Record<string, string>) {
  const segments: string[] = []
  const missing = new Set<string>()
  for (const token of tokens) {
    if (token.type === 'static') {
      segments.push(token.value)
      continue
    }
    const rawValue = values[token.name]?.trim() ?? ''
    if (!rawValue) {
      if (token.type !== 'optional-catchall') {
        missing.add(token.name)
      }
      continue
    }
    if (token.type === 'param') {
      segments.push(encodeURIComponent(rawValue))
      continue
    }
    const catchallSegments = splitCatchallInput(rawValue).map(encodeURIComponent)
    if (catchallSegments.length === 0) {
      if (token.type !== 'optional-catchall') {
        missing.add(token.name)
      }
      continue
    }
    segments.push(...catchallSegments)
  }
  const path = segments.length > 0 ? `/${segments.join('/')}` : '/'
  return { path, missing: [...missing] }
}

function buildDisplayPath(tokens: RouteToken[], values: Record<string, string>) {
  const segments: string[] = []
  for (const token of tokens) {
    if (token.type === 'static') {
      segments.push(token.value)
      continue
    }
    const rawValue = values[token.name]?.trim() ?? ''
    if (!rawValue) {
      if (token.type !== 'optional-catchall') {
        segments.push(formatParamToken(token.type, token.name))
      }
      continue
    }
    if (token.type === 'param') {
      segments.push(encodeURIComponent(rawValue))
      continue
    }
    const catchallSegments = splitCatchallInput(rawValue).map(encodeURIComponent)
    if (catchallSegments.length === 0) {
      if (token.type !== 'optional-catchall') {
        segments.push(formatParamToken(token.type, token.name))
      }
      continue
    }
    segments.push(...catchallSegments)
  }
  return segments.length > 0 ? `/${segments.join('/')}` : '/'
}

export function usePlaygroundRequest(
  selected: Ref<PlaygroundRoute | null>,
  options: { basePath?: Ref<string> } = {},
) {
  const { t } = useI18n()
  const queryText = ref('')
  const headersText = ref('')
  const bodyText = ref('')
  const responseText = ref(t('response.empty'))
  const responseStatus = ref(t('response.idle'))
  const responseTime = ref('')
  const isSwMode = ref(false)
  const isSwReady = ref(false)
  const isSwRegistering = computed(() => isSwMode.value && !isSwReady.value)
  const routeCounts = ref<RouteCounts>({})
  const totalCount = computed(() => Object.values(routeCounts.value).reduce((sum, value) => sum + value, 0))
  const isServerCounts = ref(false)
  const wsRef = ref<WebSocket | null>(null)
  const wsUrlRef = ref('')
  const routeTokens = ref<RouteToken[]>([])
  const routeParams = ref<RouteParamField[]>([])
  const paramValues = ref<Record<string, string>>({})
  const requestUrl = computed(() => {
    if (!selected.value) {
      return ''
    }
    const tokens = routeTokens.value.length > 0
      ? routeTokens.value
      : parseRouteTemplate(selected.value.url).tokens
    const path = buildDisplayPath(tokens, paramValues.value)
    const parsedQuery = parseJsonInput(queryText.value)
    if (parsedQuery.error || !parsedQuery.value) {
      return path
    }
    return `${path}${buildQueryString(parsedQuery.value)}`
  })

  function getRouteKey(route: PlaygroundRoute) {
    return `${route.method} ${route.url}`
  }

  function getRouteCount(route: PlaygroundRoute) {
    return routeCounts.value[getRouteKey(route)] ?? 0
  }

  function resolvePlaygroundWsUrl(basePath: string) {
    const trimmed = basePath.trim()
    if (!trimmed) {
      return ''
    }
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    const path = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
    const url = new URL(`${path}/ws`, window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return url.toString()
  }

  function applySnapshot(snapshot: PlaygroundWsSnapshot) {
    routeCounts.value = { ...snapshot.perRoute }
  }

  function applyIncrement(update: PlaygroundWsIncrement) {
    routeCounts.value[update.routeKey] = (routeCounts.value[update.routeKey] ?? 0) + 1
  }

  function handleWsMessage(event: MessageEvent) {
    if (typeof event.data !== 'string') {
      return
    }
    try {
      const parsed = JSON.parse(event.data) as PlaygroundWsSnapshot | PlaygroundWsIncrement
      if (parsed.type === 'snapshot' && parsed.perRoute) {
        applySnapshot(parsed)
        return
      }
      if (parsed.type === 'increment' && typeof parsed.routeKey === 'string') {
        applyIncrement(parsed)
      }
    }
    catch {
      // ignore invalid payloads
    }
  }

  function cleanupWebSocket() {
    if (wsRef.value) {
      wsRef.value.close()
      wsRef.value = null
    }
    wsUrlRef.value = ''
    isServerCounts.value = false
  }

  function connectWebSocket(basePath: string) {
    if (typeof window === 'undefined') {
      return
    }
    const url = resolvePlaygroundWsUrl(basePath)
    if (!url || wsUrlRef.value === url) {
      return
    }
    cleanupWebSocket()
    wsUrlRef.value = url
    try {
      const socket = new WebSocket(url)
      wsRef.value = socket
      socket.addEventListener('open', () => {
        isServerCounts.value = true
      })
      socket.addEventListener('message', handleWsMessage)
      socket.addEventListener('close', () => {
        if (wsRef.value === socket) {
          cleanupWebSocket()
        }
      })
      socket.addEventListener('error', () => {
        if (wsRef.value === socket) {
          cleanupWebSocket()
        }
      })
    }
    catch {
      cleanupWebSocket()
    }
  }

  function setParamValue(name: string, value: string) {
    paramValues.value = {
      ...paramValues.value,
      [name]: value,
    }
  }

  function syncRouteParams(route: PlaygroundRoute | null) {
    if (!route) {
      routeTokens.value = []
      routeParams.value = []
      paramValues.value = {}
      return
    }
    const parsed = parseRouteTemplate(route.url)
    routeTokens.value = parsed.tokens
    const nextParams = buildRouteParams(parsed.tokens)
    const nextValues: Record<string, string> = {}
    for (const param of nextParams) {
      nextValues[param.name] = paramValues.value[param.name] ?? ''
    }
    routeParams.value = nextParams
    paramValues.value = nextValues
  }

  async function ensureSwReady() {
    if (isSwReady.value) {
      return true
    }
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }
    const controller = navigator.serviceWorker.controller
    if (isMokupController(controller)) {
      isSwMode.value = true
      isSwReady.value = true
      return true
    }
    if (!isSwMode.value) {
      const registration = await resolveMokupRegistration()
      if (!registration) {
        return false
      }
      isSwMode.value = true
    }
    if (!swReadyPromise) {
      swReadyPromise = navigator.serviceWorker.ready
        .then(() => {
          isSwReady.value = true
        })
        .catch(() => {
          swReadyPromise = null
        })
    }
    await swReadyPromise
    return isSwReady.value
  }

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    ensureSwReady().catch(() => undefined)
  }

  if (options.basePath) {
    watch(
      options.basePath,
      (value) => {
        if (value) {
          connectWebSocket(value)
        }
      },
      { immediate: true },
    )
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      cleanupWebSocket()
    })
  }

  function resetResponse() {
    responseText.value = t('response.empty')
    responseStatus.value = t('response.idle')
    responseTime.value = ''
  }

  async function runRequest() {
    if (!selected.value) {
      return
    }
    const tokens = routeTokens.value.length > 0
      ? routeTokens.value
      : parseRouteTemplate(selected.value.url).tokens
    const resolved = buildResolvedPath(tokens, paramValues.value)
    if (resolved.missing.length > 0) {
      responseText.value = t('errors.routeParams', { params: resolved.missing.join(', ') })
      return
    }
    const requestKey = getRouteKey(selected.value)
    const parsedQuery = parseJsonInput(queryText.value)
    if (parsedQuery.error) {
      responseText.value = t('errors.queryJson', { message: parsedQuery.error })
      return
    }
    const parsedHeaders = parseJsonInput(headersText.value)
    if (parsedHeaders.error) {
      responseText.value = t('errors.headersJson', { message: parsedHeaders.error })
      return
    }
    const parsedBody = parseJsonInput(bodyText.value)
    if (parsedBody.error) {
      responseText.value = t('errors.bodyJson', { message: parsedBody.error })
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
      method: selected.value.method,
      headers,
    }

    const upperMethod = selected.value.method.toUpperCase()
    if (parsedBody.value && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
      init.body = JSON.stringify(parsedBody.value)
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
    }

    responseStatus.value = t('response.loading')
    responseTime.value = ''
    responseText.value = t('response.waiting')

    await ensureSwReady()
    const startedAt = performance.now()
    try {
      const response = await fetch(url.toString(), init)
      if (!isServerCounts.value) {
        routeCounts.value[requestKey] = (routeCounts.value[requestKey] ?? 0) + 1
      }
      const duration = Math.round(performance.now() - startedAt)
      responseTime.value = `${duration}ms`
      responseStatus.value = `${response.status} ${response.statusText}`
      const contentType = response.headers.get('content-type') ?? ''
      const raw = await response.text()
      if (contentType.includes('application/json')) {
        try {
          responseText.value = JSON.stringify(JSON.parse(raw), null, 2)
        }
        catch {
          responseText.value = raw
        }
      }
      else {
        responseText.value = raw || t('response.emptyPayload')
      }
    }
    catch (err) {
      responseStatus.value = t('response.error')
      responseText.value = err instanceof Error ? err.message : String(err)
    }
  }

  watch(selected, () => {
    resetResponse()
    syncRouteParams(selected.value)
  })

  return {
    queryText,
    headersText,
    bodyText,
    responseText,
    responseStatus,
    responseTime,
    resetResponse,
    runRequest,
    isSwRegistering,
    routeParams,
    paramValues,
    setParamValue,
    requestUrl,
    routeCounts,
    totalCount,
    getRouteCount,
  }
}
