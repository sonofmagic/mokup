import type { resolveSwConfig, resolveSwUnregisterConfig } from '../../core/sw'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SwResolveContext {
  resolve: (id: string) => Promise<{ id: string } | null>
}

const swModuleCandidates = [
  'dist/sw.mjs',
  'dist/sw.js',
  'src/sw.ts',
  'src/sw.js',
]

function resolvePackageRoot() {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  let current = moduleDir
  for (let index = 0; index < 6; index += 1) {
    if (existsSync(resolve(current, 'package.json'))) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) {
      break
    }
    current = parent
  }
  return moduleDir
}

const localSwModulePath = (() => {
  const packageRoot = resolvePackageRoot()
  for (const candidate of swModuleCandidates) {
    const filePath = resolve(packageRoot, candidate)
    if (existsSync(filePath)) {
      return filePath
    }
  }
  return resolve(packageRoot, 'src/sw.ts')
})()

async function resolveSwModuleImport(context: SwResolveContext) {
  const resolved = await context.resolve('mokup/sw')
  if (resolved?.id) {
    return resolved.id
  }
  const fallbackResolved = await context.resolve(localSwModulePath)
  if (fallbackResolved?.id) {
    return fallbackResolved.id
  }
  return localSwModulePath
}

function buildSwLifecycleScript(params: {
  importPath: string
  swConfig: ReturnType<typeof resolveSwConfig>
  unregisterConfig: ReturnType<typeof resolveSwUnregisterConfig>
  hasSwEntries: boolean
  hasSwRoutes: boolean
  resolveRequestPath: (path: string) => string
  resolveRegisterScope: (scope: string) => string
}) {
  const {
    importPath,
    swConfig,
    unregisterConfig,
    hasSwEntries,
    hasSwRoutes,
    resolveRequestPath,
    resolveRegisterScope,
  } = params
  const shouldUnregister = unregisterConfig.unregister === true || !hasSwEntries
  if (shouldUnregister) {
    const path = resolveRequestPath(unregisterConfig.path)
    const scope = resolveRegisterScope(unregisterConfig.scope)
    return [
      `import { unregisterMokupServiceWorker } from ${JSON.stringify(importPath)}`,
      '(async () => {',
      `  await unregisterMokupServiceWorker({ path: ${JSON.stringify(path)}, scope: ${JSON.stringify(scope)} })`,
      '})()',
    ].join('\n')
  }
  if (!swConfig || swConfig.register === false) {
    return null
  }
  if (!hasSwRoutes) {
    return null
  }
  const path = resolveRequestPath(swConfig.path)
  const scope = resolveRegisterScope(swConfig.scope)
  return [
    `import { registerMokupServiceWorker } from ${JSON.stringify(importPath)}`,
    '(async () => {',
    `  const registration = await registerMokupServiceWorker({ path: ${JSON.stringify(path)}, scope: ${JSON.stringify(scope)} })`,
    '  if (import.meta.hot && registration) {',
    '    import.meta.hot.on(\'mokup:routes-changed\', () => {',
    '      registration.update()',
    '    })',
    '  }',
    '})()',
  ].join('\n')
}

export type { SwResolveContext }
export { buildSwLifecycleScript, resolveSwModuleImport }
