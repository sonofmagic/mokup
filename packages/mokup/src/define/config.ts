import type { HookErrorPolicy, MiddlewareHandler, RouteDirectoryConfig } from '../shared/types'

const middlewareSymbol = Symbol.for('mokup.config.middlewares')

interface MiddlewareMeta {
  pre: unknown[]
  normal: unknown[]
  post: unknown[]
}

type HookHandler = () => void | Promise<void>

interface HookQueue {
  pre: HookHandler[]
  post: HookHandler[]
}

interface ConfigApp {
  use: (...handlers: MiddlewareHandler[]) => void
}

interface DefineConfigContext {
  app: ConfigApp
  hooks: HookQueue
  setStage: (stage: 'pre' | 'normal' | 'post') => void
}

type DefineConfigFactory = (context: { app: ConfigApp }) => RouteDirectoryConfig | void | Promise<RouteDirectoryConfig | void>

const contextStack: DefineConfigContext[] = []

function getActiveContext() {
  const context = contextStack[contextStack.length - 1]
  if (!context) {
    throw new Error('onBeforeAll/onAfterAll must be called inside defineConfig()')
  }
  return context
}

function runWithContext<T>(context: DefineConfigContext, fn: () => T) {
  contextStack.push(context)
  try {
    const result = fn()
    if (isPromise(result)) {
      return result.finally(() => {
        contextStack.pop()
      })
    }
    contextStack.pop()
    return result
  }
  catch (error) {
    contextStack.pop()
    throw error
  }
}

function isPromise<T = unknown>(value: T | Promise<T>): value is Promise<T> {
  return !!value && typeof (value as Promise<T>).then === 'function'
}

function normalizeHookError(policy: HookErrorPolicy | undefined): HookErrorPolicy {
  if (policy === 'throw' || policy === 'silent') {
    return policy
  }
  return 'warn'
}

function reportHookError(error: unknown, policy: HookErrorPolicy) {
  if (policy === 'silent') {
    return
  }
  if (policy === 'warn') {
    console.warn('[mokup] defineConfig hook failed:', error)
  }
}

function runHookSequence(
  stage: 'pre' | 'post',
  hooks: HookHandler[],
  policy: HookErrorPolicy,
  setStage: (stage: 'pre' | 'normal' | 'post') => void,
): void | Promise<void> {
  if (hooks.length === 0) {
    return
  }
  setStage(stage)
  let chain: Promise<void> | null = null
  const runHook = (hook: HookHandler) => {
    try {
      const result = hook()
      if (isPromise(result)) {
        return result.catch((error) => {
          if (policy === 'throw') {
            throw error
          }
          reportHookError(error, policy)
        })
      }
      return undefined
    }
    catch (error) {
      if (policy === 'throw') {
        throw error
      }
      reportHookError(error, policy)
      return undefined
    }
  }
  for (const hook of hooks) {
    if (chain) {
      chain = chain.then(() => runHook(hook) as Promise<void> | void)
      continue
    }
    const result = runHook(hook)
    if (isPromise(result)) {
      chain = result
    }
  }
  if (!chain) {
    setStage('normal')
    return
  }
  return chain.finally(() => {
    setStage('normal')
  })
}

function attachMetadata(config: RouteDirectoryConfig, meta: MiddlewareMeta) {
  Object.defineProperty(config, middlewareSymbol, {
    value: meta,
    enumerable: false,
  })
  return config
}

function normalizeConfig(value: RouteDirectoryConfig | void) {
  return (value && typeof value === 'object' ? value : {}) as RouteDirectoryConfig
}

export function onBeforeAll(handler: HookHandler) {
  if (typeof handler !== 'function') {
    throw new TypeError('onBeforeAll expects a function')
  }
  const context = getActiveContext()
  context.hooks.pre.push(handler)
}

export function onAfterAll(handler: HookHandler) {
  if (typeof handler !== 'function') {
    throw new TypeError('onAfterAll expects a function')
  }
  const context = getActiveContext()
  context.hooks.post.push(handler)
}

/**
 * Define a directory config with hook-based middleware registration.
 *
 * @param input - Config object or factory callback.
 * @returns Route directory config with middleware metadata.
 *
 * @example
 * import { defineConfig, onBeforeAll, onAfterAll } from 'mokup'
 *
 * export default defineConfig(({ app }) => {
 *   onBeforeAll(() => {
 *     app.use(async (c, next) => {
 *       c.header('x-before', '1')
 *       await next()
 *     })
 *   })
 *
 *   app.use(async (_c, next) => {
 *     await next()
 *   })
 *
 *   onAfterAll(() => {
 *     app.use(async (c, next) => {
 *       await next()
 *       c.header('x-after', '1')
 *     })
 *   })
 *
 *   return { delay: 120 }
 * })
 */
export function defineConfig(
  input: RouteDirectoryConfig | DefineConfigFactory,
): RouteDirectoryConfig | Promise<RouteDirectoryConfig> {
  if (typeof input === 'function') {
    const pre: unknown[] = []
    const normal: unknown[] = []
    const post: unknown[] = []
    let stage: 'pre' | 'normal' | 'post' = 'normal'
    const app: ConfigApp = {
      use: (...handlers: MiddlewareHandler[]) => {
        if (stage === 'pre') {
          pre.push(...handlers)
          return
        }
        if (stage === 'post') {
          post.push(...handlers)
          return
        }
        normal.push(...handlers)
      },
    }
    const context: DefineConfigContext = {
      app,
      hooks: { pre: [], post: [] },
      setStage: (next) => {
        stage = next
      },
    }
    const result = runWithContext(context, () => input({ app }))
    const finalize = (value: RouteDirectoryConfig | void) => {
      const config = normalizeConfig(value)
      const policy = normalizeHookError(config.hookError)
      const preResult = runHookSequence('pre', context.hooks.pre, policy, context.setStage)
      const runPost = () => runHookSequence('post', context.hooks.post, policy, context.setStage)
      if (isPromise(preResult)) {
        return preResult.then(runPost).then(() => attachMetadata(config, { pre, normal, post }))
      }
      const postResult = runPost()
      if (isPromise(postResult)) {
        return postResult.then(() => attachMetadata(config, { pre, normal, post }))
      }
      return attachMetadata(config, { pre, normal, post })
    }
    if (isPromise(result)) {
      return result.then(finalize)
    }
    return finalize(result)
  }
  const config = normalizeConfig(input)
  return attachMetadata(config, { pre: [], normal: [], post: [] })
}
