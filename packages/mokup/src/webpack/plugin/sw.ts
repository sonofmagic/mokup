import type { resolveSwConfig, resolveSwUnregisterConfig } from '@mokup/core'

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

export { buildSwLifecycleScript }
