import type { FetchHandler, MokupServerOptions } from './types'

import { createRuntime } from '@mokup/runtime'
import { toArrayBuffer, toRuntimeOptions, toRuntimeRequestFromFetch } from './internal'

export function createFetchHandler(
  options: MokupServerOptions,
): FetchHandler {
  const runtime = createRuntime(toRuntimeOptions(options))
  const onNotFound = options.onNotFound ?? 'next'

  return async (request) => {
    const runtimeRequest = await toRuntimeRequestFromFetch(request)
    const result = await runtime.handle(runtimeRequest)
    if (!result) {
      if (onNotFound === 'response') {
        return new Response(null, { status: 404 })
      }
      return null
    }
    const responseBody = result.body === null
      ? null
      : typeof result.body === 'string'
        ? result.body
        : toArrayBuffer(result.body)
    return new Response(responseBody, {
      status: result.status,
      headers: result.headers,
    })
  }
}
