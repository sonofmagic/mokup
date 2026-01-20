import type { Ref } from 'vue'
import type { PlaygroundRoute } from '../types'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyQuery, parseJsonInput } from '../utils/request'

let swReadyPromise: Promise<void> | null = null

function isMokupRegistration(registration: ServiceWorkerRegistration) {
  const scriptUrls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter((entry): entry is string => typeof entry === 'string')
  return scriptUrls.some((url) => {
    try {
      return new URL(url).pathname.includes('mokup-sw')
    }
    catch {
      return url.includes('mokup-sw')
    }
  })
}

async function waitForServiceWorkerControl(timeoutMs = 2000) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  if (navigator.serviceWorker.controller) {
    return
  }
  if (swReadyPromise) {
    await swReadyPromise
    return
  }

  swReadyPromise = (async () => {
    let registration: ServiceWorkerRegistration | undefined | null = null
    try {
      registration = await navigator.serviceWorker.getRegistration()
    }
    catch {
      registration = null
    }
    if (!registration || !isMokupRegistration(registration) || navigator.serviceWorker.controller) {
      return
    }

    let controllerHandler: (() => void) | null = null
    const controllerPromise = new Promise<void>((resolve) => {
      const handler = () => resolve()
      controllerHandler = handler
      navigator.serviceWorker.addEventListener('controllerchange', handler)
    })
    const readyPromise = navigator.serviceWorker.ready
      .then(() => undefined)
      .catch(() => undefined)
    const timeoutPromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs)
    })

    await Promise.race([controllerPromise, readyPromise, timeoutPromise])
    if (controllerHandler) {
      navigator.serviceWorker.removeEventListener('controllerchange', controllerHandler)
    }
  })()

  await swReadyPromise
  if (!navigator.serviceWorker.controller) {
    swReadyPromise = null
  }
}

export function usePlaygroundRequest(selected: Ref<PlaygroundRoute | null>) {
  const { t } = useI18n()
  const queryText = ref('')
  const headersText = ref('')
  const bodyText = ref('')
  const responseText = ref(t('response.empty'))
  const responseStatus = ref(t('response.idle'))
  const responseTime = ref('')

  function resetResponse() {
    responseText.value = t('response.empty')
    responseStatus.value = t('response.idle')
    responseTime.value = ''
  }

  async function runRequest() {
    if (!selected.value) {
      return
    }
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

    await waitForServiceWorkerControl()
    const startedAt = performance.now()
    try {
      const response = await fetch(url.toString(), init)
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
  }
}
