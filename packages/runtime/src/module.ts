import type {
  ManifestModuleRef,
  ManifestResponse,
  MockContext,
  MockMiddleware,
  MockResponder,
  MockResponseHandler,
  ModuleMap,
  RuntimeRequest,
} from './types'

export interface RuntimeRule {
  response: unknown
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export function resolveModuleUrl(modulePath: string, moduleBase?: string | URL) {
  if (/^(?:data|http|https|file):/.test(modulePath)) {
    return modulePath
  }
  if (!moduleBase) {
    throw new Error('moduleBase is required for relative module paths.')
  }
  const base = typeof moduleBase === 'string' ? moduleBase : moduleBase.href
  if (/^(?:data|http|https|file):/.test(base)) {
    return new URL(modulePath, base).href
  }
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedModule = modulePath.startsWith('./')
    ? modulePath.slice(2)
    : modulePath.startsWith('/')
      ? modulePath.slice(1)
      : modulePath
  return `${normalizedBase}${normalizedModule}`
}

export function normalizeRules(value: unknown): RuntimeRule[] {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value as RuntimeRule[]
  }
  if (typeof value === 'function') {
    return [
      {
        response: value,
      },
    ]
  }
  if (typeof value === 'object') {
    return [value as RuntimeRule]
  }
  return [
    {
      response: value,
    },
  ]
}

export async function executeRule(
  rule: RuntimeRule | undefined,
  req: RuntimeRequest,
  responder: MockResponder,
  ctx: MockContext,
) {
  if (!rule) {
    return undefined
  }
  const value = rule.response
  if (typeof value === 'function') {
    const handler = value as MockResponseHandler
    return handler(req, responder, ctx)
  }
  return value
}

function extractMiddlewareSource(value: unknown) {
  if (value && typeof value === 'object' && 'middleware' in value) {
    return (value as { middleware?: unknown }).middleware
  }
  return value
}

function normalizeMiddleware(value: unknown): MockMiddleware[] {
  const resolved = extractMiddlewareSource(value)
  if (!resolved) {
    return []
  }
  if (Array.isArray(resolved)) {
    return resolved.filter((entry): entry is MockMiddleware => typeof entry === 'function')
  }
  if (typeof resolved === 'function') {
    return [resolved as MockMiddleware]
  }
  return []
}

async function loadModuleExport(
  modulePath: string,
  exportName: string,
  moduleBase?: string | URL,
  moduleMap?: ModuleMap,
) {
  const directMapValue = moduleMap?.[modulePath]
  const resolvedUrl = directMapValue
    ? undefined
    : resolveModuleUrl(modulePath, moduleBase)
  const resolvedMapValue = resolvedUrl ? moduleMap?.[resolvedUrl] : undefined
  const moduleValue = directMapValue ?? resolvedMapValue
  const module = moduleValue ?? await import(resolvedUrl ?? modulePath)
  return module[exportName] ?? module.default ?? module
}

function resolveModuleCacheKey(
  modulePath: string,
  exportName: string,
  moduleBase?: string | URL,
  moduleMap?: ModuleMap,
) {
  if (moduleMap?.[modulePath]) {
    return `${modulePath}::${exportName}`
  }
  const resolvedUrl = resolveModuleUrl(modulePath, moduleBase)
  return `${resolvedUrl}::${exportName}`
}

export async function loadModuleRule(
  response: Extract<ManifestResponse, { type: 'module' }>,
  moduleCache: Map<string, RuntimeRule[]>,
  moduleBase?: string | URL,
  moduleMap?: ModuleMap,
) {
  const exportName = response.exportName ?? 'default'
  const cacheKey = resolveModuleCacheKey(
    response.module,
    exportName,
    moduleBase,
    moduleMap,
  )
  let rules = moduleCache.get(cacheKey)
  if (!rules) {
    const exported = await loadModuleExport(
      response.module,
      exportName,
      moduleBase,
      moduleMap,
    )
    rules = normalizeRules(exported)
    moduleCache.set(cacheKey, rules)
  }
  if (typeof response.ruleIndex === 'number') {
    return rules[response.ruleIndex]
  }
  return rules[0]
}

export async function loadModuleMiddleware(
  middleware: ManifestModuleRef,
  middlewareCache: Map<string, MockMiddleware[]>,
  moduleBase?: string | URL,
  moduleMap?: ModuleMap,
) {
  const exportName = middleware.exportName ?? 'default'
  const cacheKey = resolveModuleCacheKey(
    middleware.module,
    exportName,
    moduleBase,
    moduleMap,
  )
  let handlers = middlewareCache.get(cacheKey)
  if (!handlers) {
    const exported = await loadModuleExport(
      middleware.module,
      exportName,
      moduleBase,
      moduleMap,
    )
    handlers = normalizeMiddleware(exported)
    middlewareCache.set(cacheKey, handlers)
  }
  if (typeof middleware.ruleIndex === 'number') {
    return handlers[middleware.ruleIndex]
  }
  return handlers[0]
}
