import type { MiddlewareHandler, MiddlewareRegistry, RouteDirectoryConfig } from './types'

const middlewareSymbol = Symbol.for('mokup.config.middlewares')

interface MiddlewareMeta {
  pre: unknown[]
  normal: unknown[]
  post: unknown[]
}

type DefineConfigFactory = (context: {
  pre: MiddlewareRegistry
  normal: MiddlewareRegistry
  post: MiddlewareRegistry
}) => RouteDirectoryConfig | void

function createRegistry(list: unknown[]): MiddlewareRegistry {
  return {
    use: (...handlers: MiddlewareHandler[]) => {
      list.push(...handlers)
    },
  }
}

function attachMetadata(config: RouteDirectoryConfig, meta: MiddlewareMeta) {
  Object.defineProperty(config, middlewareSymbol, {
    value: meta,
    enumerable: false,
  })
  return config
}

/**
 * Define a directory config with Hono-style middleware registration.
 *
 * @param input - Config object or factory callback.
 * @returns Route directory config with middleware metadata.
 *
 * @example
 * import { defineConfig } from '@mokup/cli'
 *
 * export default defineConfig(({ pre, normal, post }) => {
 *   pre.use(async (c, next) => {
 *     c.header('x-before', '1')
 *     await next()
 *   })
 *
 *   normal.use(async (_c, next) => {
 *     await next()
 *   })
 *
 *   post.use(async (c, next) => {
 *     await next()
 *     c.header('x-after', '1')
 *   })
 *
 *   return { delay: 120 }
 * })
 */
export function defineConfig(
  input: RouteDirectoryConfig | DefineConfigFactory,
): RouteDirectoryConfig {
  if (typeof input === 'function') {
    const pre: unknown[] = []
    const normal: unknown[] = []
    const post: unknown[] = []
    const context = {
      pre: createRegistry(pre),
      normal: createRegistry(normal),
      post: createRegistry(post),
    }
    const result = input(context)
    const config = (result && typeof result === 'object' ? result : {}) as RouteDirectoryConfig
    return attachMetadata(config, { pre, normal, post })
  }
  const config = (input && typeof input === 'object' ? input : {}) as RouteDirectoryConfig
  return attachMetadata(config, { pre: [], normal: [], post: [] })
}
