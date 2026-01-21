import type { Ref } from 'vue'
import type { PlaygroundRoute } from '../types'
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

    const url = new URL(selected.value.url, window.location.origin)
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
    routeCounts,
    totalCount,
    getRouteCount,
  }
}
