import { isPromise, middlewareSymbol } from './config-core'

export type HookErrorPolicy = 'warn' | 'silent' | 'throw'

export type HookHandler = () => void | Promise<void>

interface HookQueue {
  pre: HookHandler[]
  post: HookHandler[]
}

export interface ConfigApp<TMiddleware> {
  use: (...handlers: TMiddleware[]) => void
}

interface DefineConfigContext<TMiddleware> {
  app: ConfigApp<TMiddleware>
  hooks: HookQueue
  setStage: (stage: 'pre' | 'normal' | 'post') => void
}

interface MiddlewareMeta {
  pre: unknown[]
  normal: unknown[]
  post: unknown[]
}

export type DefineConfigFactory<TConfig, TMiddleware> = (context: {
  app: ConfigApp<TMiddleware>
}) => TConfig | void | Promise<TConfig | void>

function normalizeHookError(policy: HookErrorPolicy | undefined): HookErrorPolicy {
  if (policy === 'throw' || policy === 'silent') {
    return policy
  }
  return 'warn'
}

export function createDefineConfig<
  TConfig extends { hookError?: HookErrorPolicy },
  TMiddleware,
>(options: { logPrefix: string }) {
  const contextStack: DefineConfigContext<TMiddleware>[] = []

  function getActiveContext() {
    const context = contextStack[contextStack.length - 1]
    if (!context) {
      throw new Error('onBeforeAll/onAfterAll must be called inside defineConfig()')
    }
    return context
  }

  function runWithContext<T>(context: DefineConfigContext<TMiddleware>, fn: () => T) {
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

  function reportHookError(error: unknown, policy: HookErrorPolicy) {
    if (policy === 'silent') {
      return
    }
    if (policy === 'warn') {
      console.warn(`${options.logPrefix} defineConfig hook failed:`, error)
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

  function attachMetadata(config: TConfig, meta: MiddlewareMeta) {
    Object.defineProperty(config, middlewareSymbol, {
      value: meta,
      enumerable: false,
    })
    return config
  }

  function normalizeConfig(value: TConfig | void) {
    return (value && typeof value === 'object' ? value : {}) as TConfig
  }

  function onBeforeAll(handler: HookHandler) {
    if (typeof handler !== 'function') {
      throw new TypeError('onBeforeAll expects a function')
    }
    const context = getActiveContext()
    context.hooks.pre.push(handler)
  }

  function onAfterAll(handler: HookHandler) {
    if (typeof handler !== 'function') {
      throw new TypeError('onAfterAll expects a function')
    }
    const context = getActiveContext()
    context.hooks.post.push(handler)
  }

  function defineConfig(
    input: TConfig | DefineConfigFactory<TConfig, TMiddleware>,
  ): TConfig | Promise<TConfig> {
    if (typeof input === 'function') {
      const pre: unknown[] = []
      const normal: unknown[] = []
      const post: unknown[] = []
      let stage: 'pre' | 'normal' | 'post' = 'normal'
      const app: ConfigApp<TMiddleware> = {
        use: (...handlers: TMiddleware[]) => {
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
      const context: DefineConfigContext<TMiddleware> = {
        app,
        hooks: { pre: [], post: [] },
        setStage: (next) => {
          stage = next
        },
      }
      const result = runWithContext(context, () => input({ app }))
      const finalize = (value: TConfig | void) => {
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

  return {
    defineConfig,
    onBeforeAll,
    onAfterAll,
  }
}
