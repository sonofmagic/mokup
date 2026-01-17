import type { NodeRequestLike } from './internal'
import type { MokupServerOptions } from './types'

import { createRuntime } from '@mokup/runtime'
import { toBinaryBody, toRuntimeOptions, toRuntimeRequestFromNode } from './internal'

interface FastifyRequestLike extends NodeRequestLike {
  raw?: NodeRequestLike
}

interface FastifyReplyLike {
  status: (code: number) => FastifyReplyLike
  header: (name: string, value: string) => FastifyReplyLike
  send: (payload?: unknown) => void
}

interface FastifyInstanceLike {
  addHook: (
    name: 'onRequest' | 'preHandler',
    handler: (
      request: FastifyRequestLike,
      reply: FastifyReplyLike,
    ) => Promise<void> | void,
  ) => void
}

export function createFastifyPlugin(
  options: MokupServerOptions,
) {
  const runtime = createRuntime(toRuntimeOptions(options))
  const onNotFound = options.onNotFound ?? 'next'

  return async (instance: FastifyInstanceLike) => {
    instance.addHook('onRequest', async (request, reply) => {
      const runtimeRequest = await toRuntimeRequestFromNode(
        request.raw ?? request,
        request.body,
      )
      const result = await runtime.handle(runtimeRequest)
      if (!result) {
        if (onNotFound === 'response') {
          reply.status(404).send()
        }
        return
      }
      reply.status(result.status)
      for (const [key, value] of Object.entries(result.headers)) {
        reply.header(key, value)
      }
      if (result.body === null) {
        reply.send()
        return
      }
      if (typeof result.body === 'string') {
        reply.send(result.body)
        return
      }
      reply.send(toBinaryBody(result.body))
    })
  }
}
