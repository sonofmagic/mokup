interface PlaygroundConfig {
  enabled: boolean
  path: string
}

function normalizePlaygroundPath(value?: string) {
  if (!value) {
    return '/__mokup'
  }
  const normalized = value.startsWith('/') ? value : `/${value}`
  return normalized.length > 1 && normalized.endsWith('/')
    ? normalized.slice(0, -1)
    : normalized
}

/**
 * Normalize playground configuration to enabled/path values.
 *
 * @param playground - Playground options input.
 * @returns Normalized playground config.
 *
 * @example
 * import { resolvePlaygroundOptions } from '@mokup/server'
 *
 * const config = resolvePlaygroundOptions(true)
 */
export function resolvePlaygroundOptions(
  playground: { path?: string, enabled?: boolean } | boolean | undefined,
): PlaygroundConfig {
  if (playground === false) {
    return { enabled: false, path: '/__mokup' }
  }
  if (playground && typeof playground === 'object') {
    return {
      enabled: playground.enabled !== false,
      path: normalizePlaygroundPath(playground.path),
    }
  }
  return { enabled: true, path: '/__mokup' }
}

export type { PlaygroundConfig }
export { normalizePlaygroundPath }
