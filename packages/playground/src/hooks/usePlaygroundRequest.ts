import type { RouteToken } from '@mokup/runtime'
import type { Ref } from 'vue'
import type { BodyType, PlaygroundRoute, RouteParamField } from '../types'
import type { RouteCounts } from './playground-request/websocket'
import { parseRouteTemplate } from '@mokup/runtime'
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseJsonInput } from '../utils/request'
import { buildDisplayPath, buildRouteParams } from './playground-request/params'
import { buildQueryString } from './playground-request/query'
import { createRequestRunner } from './playground-request/request-runner'
import { isMokupController, resolveMokupRegistration } from './playground-request/service-worker'
import { parseWsMessage, resolvePlaygroundWsUrl } from './playground-request/websocket'

let swReadyPromise: Promise<void> | null = null

/**
 * Vue composable for running playground requests and tracking state.
 *
 * @param selected - Currently selected route.
 * @param options - Optional configuration.
 * @param options.basePath - Optional base path ref for websocket.
 * @returns Reactive request helpers and state.
 *
 * @example
 * import { usePlaygroundRequest } from '@mokup/playground'
 *
 * const request = usePlaygroundRequest({ route: null })
 */
export function usePlaygroundRequest(
  selected: Ref<PlaygroundRoute | null>,
  options: { basePath?: Ref<string> } = {},
) {
  const { t } = useI18n()
  const queryText = ref('')
  const headersText = ref('')
  const bodyText = ref('')
  const bodyType = ref<BodyType>('json')
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

  function handleWsMessage(event: MessageEvent) {
    if (typeof event.data !== 'string') {
      return
    }
    const parsed = parseWsMessage(event.data)
    if (!parsed) {
      return
    }
    if (parsed.type === 'snapshot') {
      routeCounts.value = { ...parsed.perRoute }
      return
    }
    routeCounts.value[parsed.routeKey] = (routeCounts.value[parsed.routeKey] ?? 0) + 1
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

  const { resetResponse, runRequest } = createRequestRunner({
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
    isServerCounts,
    ensureSwReady,
    getRouteKey,
  })

  watch(selected, () => {
    resetResponse()
    syncRouteParams(selected.value)
  })

  return {
    queryText,
    headersText,
    bodyText,
    bodyType,
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
