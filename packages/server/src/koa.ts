import type { NodeRequestLike } from './internal'
import type { MokupServerOptions } from './types'

import { createRuntime } from '@mokup/runtime'
import { toBinaryBody, toRuntimeOptions, toRuntimeRequestFromNode } from './internal'

interface KoaContextLike {
  req: NodeRequestLike
  request?: {
    body?: unknown
    headers?: Record<string, string | string[] | undefined>
  }
  status?: number
  body?: unknown
  set: (header: Record<string, string>) => void
}

type KoaNext = () => Promise<unknown>

export function createKoaMiddleware(
  options: MokupServerOptions,
) {
  const runtime = createRuntime(toRuntimeOptions(options))
  const onNotFound = options.onNotFound ?? 'next'

  return async (ctx: KoaContextLike, next: KoaNext) => {
    const runtimeRequest = await toRuntimeRequestFromNode(
      ctx.req,
      ctx.request?.body,
    )
    const result = await runtime.handle(runtimeRequest)
    if (!result) {
      if (onNotFound === 'response') {
        ctx.status = 404
        ctx.body = null
        return
      }
      await next()
      return
    }
    ctx.status = result.status
    ctx.set(result.headers)
    if (result.body === null) {
      ctx.body = null
      return
    }
    if (typeof result.body === 'string') {
      ctx.body = result.body
      return
    }
    ctx.body = toBinaryBody(result.body)
  }
}
