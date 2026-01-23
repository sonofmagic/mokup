import type {
  Logger,
  RouteTable,
  VitePluginOptions,
} from './types'

import { buildManifestData, toViteImportPath } from './manifest'
import { normalizePrefix } from './utils'

export const defaultSwPath = '/mokup-sw.js'
export const defaultSwScope = '/'

export interface ResolvedSwConfig {
  path: string
  scope: string
  register: boolean
  unregister: boolean
  basePaths: string[]
}

function normalizeSwPath(path: string) {
  if (!path) {
    return defaultSwPath
  }
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeSwScope(scope: string) {
  if (!scope) {
    return defaultSwScope
  }
  return scope.startsWith('/') ? scope : `/${scope}`
}

function normalizeBasePath(value: string) {
  if (!value) {
    return '/'
  }
  const normalized = value.startsWith('/') ? value : `/${value}`
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }
  return normalized
}

function resolveSwConfigFromEntries(
  entries: VitePluginOptions[],
  logger: Logger,
): ResolvedSwConfig {
  let path = defaultSwPath
  let scope = defaultSwScope
  let register = true
  let unregister = false
  const basePaths: string[] = []
  let hasPath = false
  let hasScope = false
  let hasRegister = false
  let hasUnregister = false

  for (const entry of entries) {
    const config = entry.sw
    if (config?.path) {
      const next = normalizeSwPath(config.path)
      if (!hasPath) {
        path = next
        hasPath = true
      }
      else if (path !== next) {
        logger.warn(`SW path "${next}" ignored; using "${path}".`)
      }
    }
    if (config?.scope) {
      const next = normalizeSwScope(config.scope)
      if (!hasScope) {
        scope = next
        hasScope = true
      }
      else if (scope !== next) {
        logger.warn(`SW scope "${next}" ignored; using "${scope}".`)
      }
    }
    if (typeof config?.register === 'boolean') {
      if (!hasRegister) {
        register = config.register
        hasRegister = true
      }
      else if (register !== config.register) {
        logger.warn(
          `SW register="${String(config.register)}" ignored; using "${String(register)}".`,
        )
      }
    }
    if (typeof config?.unregister === 'boolean') {
      if (!hasUnregister) {
        unregister = config.unregister
        hasUnregister = true
      }
      else if (unregister !== config.unregister) {
        logger.warn(
          `SW unregister="${String(config.unregister)}" ignored; using "${String(unregister)}".`,
        )
      }
    }

    if (typeof config?.basePath !== 'undefined') {
      const values = Array.isArray(config.basePath)
        ? config.basePath
        : [config.basePath]
      for (const value of values) {
        basePaths.push(normalizeBasePath(value))
      }
      continue
    }
    const normalizedPrefix = normalizePrefix(entry.prefix ?? '')
    if (normalizedPrefix) {
      basePaths.push(normalizedPrefix)
    }
  }

  return {
    path,
    scope,
    register,
    unregister,
    basePaths: Array.from(new Set(basePaths)),
  }
}

export function resolveSwConfig(
  options: VitePluginOptions[],
  logger: Logger,
): ResolvedSwConfig | null {
  const swEntries = options.filter(entry => entry.mode === 'sw')
  if (swEntries.length === 0) {
    return null
  }
  return resolveSwConfigFromEntries(swEntries, logger)
}

export function resolveSwUnregisterConfig(
  options: VitePluginOptions[],
  logger: Logger,
): ResolvedSwConfig {
  return resolveSwConfigFromEntries(options, logger)
}

export function buildSwScript(params: {
  routes: RouteTable
  root: string
  runtimeImportPath?: string
  basePaths?: string[]
  resolveModulePath?: (file: string, root: string) => string
}) {
  const { routes, root } = params
  const runtimeImportPath = params.runtimeImportPath ?? 'mokup/runtime'
  const basePaths = params.basePaths ?? []
  const resolveModulePath = params.resolveModulePath ?? toViteImportPath
  const { manifest, modules } = buildManifestData({
    routes,
    root,
    resolveModulePath,
  })

  const imports: string[] = [
    'import { createLogger } from \'@mokup/shared/logger\'',
    `import { createRuntimeApp, handle } from ${JSON.stringify(runtimeImportPath)}`,
  ]
  const moduleEntries: Array<{ id: string, name: string, kind: 'rule' | 'middleware' }> = []
  let moduleIndex = 0

  for (const entry of modules) {
    const name = `module${moduleIndex++}`
    imports.push(`import * as ${name} from '${entry.id}'`)
    moduleEntries.push({ id: entry.id, name, kind: entry.kind })
  }

  const lines: string[] = []
  lines.push(...imports, '')
  lines.push(
    'const logger = createLogger()',
    '',
    'const resolveModuleExport = (mod) => mod?.default ?? mod',
    '',
    'const toRuntimeRule = (value) => {',
    '  if (typeof value === \'undefined\') {',
    '    return null',
    '  }',
    '  if (typeof value === \'function\') {',
    '    return { response: value }',
    '  }',
    '  if (value === null) {',
    '    return { response: null }',
    '  }',
    '  if (typeof value === \'object\') {',
    '    if (\'response\' in value) {',
    '      return value',
    '    }',
    '    if (\'handler\' in value) {',
    '      const handlerRule = value',
    '      return {',
    '        response: handlerRule.handler,',
    '        ...(typeof handlerRule.status === \'number\' ? { status: handlerRule.status } : {}),',
    '        ...(handlerRule.headers ? { headers: handlerRule.headers } : {}),',
    '        ...(typeof handlerRule.delay === \'number\' ? { delay: handlerRule.delay } : {}),',
    '      }',
    '    }',
    '    return { response: value }',
    '  }',
    '  return { response: value }',
    '}',
    '',
    'const toRuntimeRules = (value) => {',
    '  if (typeof value === \'undefined\') {',
    '    return []',
    '  }',
    '  if (Array.isArray(value)) {',
    '    return value.map(toRuntimeRule).filter(Boolean)',
    '  }',
    '  const rule = toRuntimeRule(value)',
    '  return rule ? [rule] : []',
    '}',
    '',
  )
  lines.push(
    `const manifest = ${JSON.stringify(manifest, null, 2)}`,
    '',
  )

  if (moduleEntries.length > 0) {
    lines.push('const moduleMap = {')
    for (const entry of moduleEntries) {
      if (entry.kind === 'rule') {
        lines.push(
          `  ${JSON.stringify(entry.id)}: { default: toRuntimeRules(resolveModuleExport(${entry.name})) },`,
        )
        continue
      }
      lines.push(
        `  ${JSON.stringify(entry.id)}: ${entry.name},`,
      )
    }
    lines.push('}', '')
  }

  const runtimeOptions = moduleEntries.length > 0
    ? '{ manifest, moduleMap }'
    : '{ manifest }'

  lines.push(
    `const basePaths = ${JSON.stringify(basePaths)}`,
    '',
    'self.addEventListener(\'install\', () => {',
    '  self.skipWaiting()',
    '})',
    '',
    'self.addEventListener(\'activate\', (event) => {',
    '  event.waitUntil(self.clients.claim())',
    '})',
    '',
    'const shouldHandle = (request) => {',
    '  if (!basePaths || basePaths.length === 0) {',
    '    return true',
    '  }',
    '  const pathname = new URL(request.url).pathname',
    '  return basePaths.some((basePath) => {',
    '    if (basePath === \'/\') {',
    '      return true',
    '    }',
    '    return pathname === basePath || pathname.startsWith(basePath + \'/\')',
    '  })',
    '}',
    '',
    'const registerHandler = async () => {',
    `  const app = await createRuntimeApp(${runtimeOptions})`,
    '  const handler = handle(app)',
    '  self.addEventListener(\'fetch\', (event) => {',
    '    if (!shouldHandle(event.request)) {',
    '      return',
    '    }',
    '    handler(event)',
    '  })',
    '}',
    '',
    'registerHandler().catch((error) => {',
    '  logger.error(\'Failed to build service worker app:\', error)',
    '})',
    '',
  )

  return lines.join('\n')
}
