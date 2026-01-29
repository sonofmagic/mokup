import { createRequire } from 'node:module'
import { join } from '@mokup/shared/pathe'

const require = createRequire(import.meta.url)

export function resolvePlaygroundDist() {
  const pkgPath = require.resolve('@mokup/playground/package.json')
  return join(pkgPath, '..', 'dist')
}
