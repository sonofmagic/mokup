import type { Manifest } from '@mokup/runtime'
import type {
  Logger,
  MokupViteOptions,
  ResolvedRoute,
  RouteTable,
} from './types'

import { Buffer } from 'node:buffer'
import { isAbsolute, relative, resolve } from 'pathe'
import { toPosix } from './utils'

const defaultSwPath = '/mokup-sw.js'
const defaultSwScope = '/'

export interface ResolvedSwConfig {
  path: string
  scope: string
  register: boolean
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

export function resolveSwConfig(
  options: MokupViteOptions[],
  logger: Logger,
): ResolvedSwConfig | null {
  const swEntries = options.filter(entry => entry.mode === 'sw')
  if (swEntries.length === 0) {
    return null
  }
  let path = defaultSwPath
  let scope = defaultSwScope
  let register = true
  let hasPath = false
  let hasScope = false
  let hasRegister = false

  for (const entry of swEntries) {
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
  }

  return {
    path,
    scope,
    register,
  }
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
) {
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
}) {
  const { routes, root } = params
  const ruleModules = new Map<string, string>()
  const middlewareModules = new Map<string, string>()

  const manifestRoutes = routes.map((route) => {
    const moduleId = shouldModuleize(route.handler)
      ? toViteImportPath(route.file, root)
      : null

    if (moduleId) {
      ruleModules.set(moduleId, moduleId)
    }

    const middleware = route.middlewares?.map((entry) => {
      const modulePath = toViteImportPath(entry.source, root)
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
    'import { createRuntime } from \'@mokup/runtime\'',
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
    `const runtime = createRuntime(${runtimeOptions})`,
    '',
    'const normalizeQuery = (params) => {',
    '  const query = {}',
    '  for (const [key, value] of params.entries()) {',
    '    const current = query[key]',
    '    if (typeof current === \'undefined\') {',
    '      query[key] = value',
    '    }',
    '    else if (Array.isArray(current)) {',
    '      current.push(value)',
    '    }',
    '    else {',
    '      query[key] = [current, value]',
    '    }',
    '  }',
    '  return query',
    '}',
    '',
    'const normalizeHeaders = (headers) => {',
    '  const record = {}',
    '  headers.forEach((value, key) => {',
    '    record[key.toLowerCase()] = value',
    '  })',
    '  return record',
    '}',
    '',
    'const parseBody = (rawText, contentType) => {',
    '  if (!rawText) {',
    '    return undefined',
    '  }',
    '  if (contentType === \'application/json\' || contentType.endsWith(\'+json\')) {',
    '    try {',
    '      return JSON.parse(rawText)',
    '    }',
    '    catch {',
    '      return rawText',
    '    }',
    '  }',
    '  if (contentType === \'application/x-www-form-urlencoded\') {',
    '    const params = new URLSearchParams(rawText)',
    '    return Object.fromEntries(params.entries())',
    '  }',
    '  return rawText',
    '}',
    '',
    'const toRuntimeRequest = async (request) => {',
    '  const url = new URL(request.url)',
    '  const headers = normalizeHeaders(request.headers)',
    '  const contentType = (headers[\'content-type\'] ?? \'\').split(\';\')[0]?.trim() ?? \'\'',
    '  const rawBody = await request.clone().text()',
    '  const body = parseBody(rawBody, contentType)',
    '  return {',
    '    method: request.method,',
    '    path: url.pathname,',
    '    query: normalizeQuery(url.searchParams),',
    '    headers,',
    '    body,',
    '    ...(rawBody ? { rawBody } : {}),',
    '  }',
    '}',
    '',
    'const toFetchResponse = (result) => {',
    '  if (!result) {',
    '    return null',
    '  }',
    '  const body = result.body === null',
    '    ? null',
    '    : typeof result.body === \'string\'',
    '      ? result.body',
    '      : result.body',
    '  return new Response(body, {',
    '    status: result.status,',
    '    headers: result.headers,',
    '  })',
    '}',
    '',
    'const handleRequest = async (request) => {',
    '  const runtimeRequest = await toRuntimeRequest(request)',
    '  const result = await runtime.handle(runtimeRequest)',
    '  const response = toFetchResponse(result)',
    '  if (!response) {',
    '    return fetch(request)',
    '  }',
    '  return response',
    '}',
    '',
    'self.addEventListener(\'fetch\', (event) => {',
    '  event.respondWith(handleRequest(event.request))',
    '})',
    '',
  )

  return lines.join('\n')
}
