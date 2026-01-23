import type { RouteTable } from './types'

import { buildManifestData } from './manifest'

/**
 * Build the source for a virtual mokup bundle module.
 *
 * @param params - Bundle build parameters.
 * @returns JavaScript source string.
 *
 * @example
 * import { buildBundleModule } from 'mokup/vite'
 *
 * const source = buildBundleModule({ routes: [], root: process.cwd() })
 */
export function buildBundleModule(params: {
  routes: RouteTable
  root: string
  resolveModulePath?: (file: string, root: string) => string
}) {
  const { manifest, modules } = buildManifestData({
    routes: params.routes,
    root: params.root,
    ...(params.resolveModulePath
      ? { resolveModulePath: params.resolveModulePath }
      : {}),
  })

  const imports: string[] = []
  const moduleEntries: Array<{ id: string, name: string }> = []
  let moduleIndex = 0

  for (const entry of modules) {
    const name = `module${moduleIndex++}`
    imports.push(`import * as ${name} from '${entry.id}'`)
    moduleEntries.push({ id: entry.id, name })
  }

  const lines: string[] = []
  if (imports.length > 0) {
    lines.push(...imports, '')
  }
  lines.push(
    `const manifest = ${JSON.stringify(manifest, null, 2)}`,
    '',
  )

  if (moduleEntries.length > 0) {
    lines.push('const moduleMap = {')
    for (const entry of moduleEntries) {
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
    `const mokupBundle = ${runtimeOptions}`,
    '',
    'export default mokupBundle',
    'export { mokupBundle }',
    '',
  )

  return lines.join('\n')
}
