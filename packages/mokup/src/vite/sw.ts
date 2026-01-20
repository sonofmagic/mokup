import type { Manifest, ManifestResponse } from '@mokup/runtime'
import type {
  Logger,
  MokupViteOptions,
  ResolvedRoute,
  RouteTable,
} from './types'

import { Buffer } from 'node:buffer'
import { isAbsolute, relative, resolve } from 'pathe'
import { normalizePrefix, toPosix } from './utils'

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
  entries: MokupViteOptions[],
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
  options: MokupViteOptions[],
  logger: Logger,
): ResolvedSwConfig | null {
  const swEntries = options.filter(entry => entry.mode === 'sw')
  if (swEntries.length === 0) {
    return null
  }
  return resolveSwConfigFromEntries(swEntries, logger)
}

export function resolveSwUnregisterConfig(
  options: MokupViteOptions[],
  logger: Logger,
): ResolvedSwConfig {
  return resolveSwConfigFromEntries(options, logger)
}

function toViteImportPath(file: string, root: string) {
  const absolute = isAbsolute(file) ? file : resolve(root, file)
  const rel = relative(root, absolute)
  if (!rel.startsWith('..') && !isAbsolute(rel)) {
    return `/${toPosix(rel)}`
  }
  return `/@fs/${toPosix(absolute)}`
}

function shouldModuleize(handler: ResolvedRoute['handler']) {
  if (typeof handler === 'function') {
    return true
  }
  if (typeof Response !== 'undefined' && handler instanceof Response) {
    return true
  }
  return false
}

function toBinaryBody(handler: ResolvedRoute['handler']) {
  if (handler instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(handler)).toString('base64')
  }
  if (handler instanceof Uint8Array) {
    return Buffer.from(handler).toString('base64')
  }
  if (Buffer.isBuffer(handler)) {
    return handler.toString('base64')
  }
  return null
}

function buildManifestResponse(
  route: ResolvedRoute,
  moduleId: string | null,
): ManifestResponse {
  if (moduleId) {
    const response: {
      type: 'module'
      module: string
      ruleIndex?: number
    } = {
      type: 'module',
      module: moduleId,
    }
    if (typeof route.ruleIndex === 'number') {
      response.ruleIndex = route.ruleIndex
    }
    return response
  }
  const handler = route.handler
  if (typeof handler === 'string') {
    return {
      type: 'text',
      body: handler,
    }
  }
  const binary = toBinaryBody(handler)
  if (binary) {
    return {
      type: 'binary',
      body: binary,
      encoding: 'base64',
    }
  }
  return {
    type: 'json',
    body: handler,
  }
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
  const ruleModules = new Map<string, string>()
  const middlewareModules = new Map<string, string>()

  const manifestRoutes = routes.map((route) => {
    const moduleId = shouldModuleize(route.handler)
      ? resolveModulePath(route.file, root)
      : null

    if (moduleId) {
      ruleModules.set(moduleId, moduleId)
    }

    const middleware = route.middlewares?.map((entry) => {
      const modulePath = resolveModulePath(entry.source, root)
      middlewareModules.set(modulePath, modulePath)
      return {
        module: modulePath,
        ruleIndex: entry.index,
      }
    })

    const response = buildManifestResponse(route, moduleId)
    const manifestRoute = {
      method: route.method,
      url: route.template,
      ...(route.tokens ? { tokens: route.tokens } : {}),
      ...(route.score ? { score: route.score } : {}),
      ...(route.status ? { status: route.status } : {}),
      ...(route.headers ? { headers: route.headers } : {}),
      ...(route.delay ? { delay: route.delay } : {}),
      ...(middleware && middleware.length > 0 ? { middleware } : {}),
      response,
    }

    return manifestRoute
  })

  const manifest: Manifest = {
    version: 1,
    routes: manifestRoutes,
  }

  const imports: string[] = [
    `import { createRuntimeApp, handle } from ${JSON.stringify(runtimeImportPath)}`,
  ]
  const moduleEntries: Array<{ id: string, name: string, kind: 'rule' | 'middleware' }> = []
  let moduleIndex = 0

  for (const id of ruleModules.keys()) {
    const name = `module${moduleIndex++}`
    imports.push(`import * as ${name} from '${id}'`)
    moduleEntries.push({ id, name, kind: 'rule' })
  }
  for (const id of middlewareModules.keys()) {
    const name = `module${moduleIndex++}`
    imports.push(`import * as ${name} from '${id}'`)
    moduleEntries.push({ id, name, kind: 'middleware' })
  }

  const lines: string[] = []
  lines.push(...imports, '')
  lines.push(
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
    '  console.error(\'[mokup] Failed to build service worker app:\', error)',
    '})',
    '',
  )

  return lines.join('\n')
}
