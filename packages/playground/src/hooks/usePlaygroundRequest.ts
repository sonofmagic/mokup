import type { Ref } from 'vue'
import type { PlaygroundRoute } from '../types'
import { ref, watch } from 'vue'
import { applyQuery, parseJsonInput } from '../utils/request'

export function usePlaygroundRequest(selected: Ref<PlaygroundRoute | null>) {
  const queryText = ref('')
  const headersText = ref('')
  const bodyText = ref('')
  const responseText = ref('No response yet.')
  const responseStatus = ref('Idle')
  const responseTime = ref('')

  function resetResponse() {
    responseText.value = 'No response yet.'
    responseStatus.value = 'Idle'
    responseTime.value = ''
  }

  async function runRequest() {
    if (!selected.value) {
      return
    }
    const parsedQuery = parseJsonInput(queryText.value)
    if (parsedQuery.error) {
      responseText.value = `Query JSON error: ${parsedQuery.error}`
      return
    }
    const parsedHeaders = parseJsonInput(headersText.value)
    if (parsedHeaders.error) {
      responseText.value = `Headers JSON error: ${parsedHeaders.error}`
      return
    }
    const parsedBody = parseJsonInput(bodyText.value)
    if (parsedBody.error) {
      responseText.value = `Body JSON error: ${parsedBody.error}`
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

    responseStatus.value = 'Loading...'
    responseTime.value = ''
    responseText.value = 'Waiting for response...'

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
        responseText.value = raw || '[empty response]'
      }
    }
    catch (err) {
      responseStatus.value = 'Error'
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
