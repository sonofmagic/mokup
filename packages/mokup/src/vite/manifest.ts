import type { Manifest, ManifestResponse } from '@mokup/runtime'
import type { ResolvedRoute, RouteTable } from './types'

import { Buffer } from 'node:buffer'
import { isAbsolute, relative, resolve } from '@mokup/shared/pathe'
import { toPosix } from './utils'

export type ManifestModuleKind = 'rule' | 'middleware'

export interface ManifestModuleEntry {
  id: string
  kind: ManifestModuleKind
}

export interface ManifestBuildResult {
  manifest: Manifest
  modules: ManifestModuleEntry[]
}

export function toViteImportPath(file: string, root: string) {
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

export function buildManifestData(params: {
  routes: RouteTable
  root: string
  resolveModulePath?: (file: string, root: string) => string
}): ManifestBuildResult {
  const { routes, root } = params
  const resolveModulePath = params.resolveModulePath ?? toViteImportPath
  const ruleModules = new Map<string, ManifestModuleEntry>()
  const middlewareModules = new Map<string, ManifestModuleEntry>()

  const manifestRoutes = routes.map((route) => {
    const moduleId = shouldModuleize(route.handler)
      ? resolveModulePath(route.file, root)
      : null

    if (moduleId && !ruleModules.has(moduleId)) {
      ruleModules.set(moduleId, { id: moduleId, kind: 'rule' })
    }

    const middleware = route.middlewares?.map((entry) => {
      const modulePath = resolveModulePath(entry.source, root)
      if (!middlewareModules.has(modulePath)) {
        middlewareModules.set(modulePath, { id: modulePath, kind: 'middleware' })
      }
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

  return {
    manifest,
    modules: [
      ...ruleModules.values(),
      ...middlewareModules.values(),
    ],
  }
}
