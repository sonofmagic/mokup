import type { ManifestResponse, MockContext, MockResponder, MockResponseHandler, RuntimeRequest } from './types'

export interface RuntimeRule {
  url?: string
  method?: string
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
  return new URL(modulePath, moduleBase).href
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

export async function loadModuleRule(
  response: Extract<ManifestResponse, { type: 'module' }>,
  moduleCache: Map<string, RuntimeRule[]>,
  moduleBase?: string | URL,
) {
  const resolvedUrl = resolveModuleUrl(response.module, moduleBase)
  const exportName = response.exportName ?? 'default'
  const cacheKey = `${resolvedUrl}::${exportName}`
  let rules = moduleCache.get(cacheKey)
  if (!rules) {
    const module = await import(resolvedUrl)
    const exported = module[exportName] ?? module.default ?? module
    rules = normalizeRules(exported)
    moduleCache.set(cacheKey, rules)
  }
  if (typeof response.ruleIndex === 'number') {
    return rules[response.ruleIndex]
  }
  return rules[0]
}
