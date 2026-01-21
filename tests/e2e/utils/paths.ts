import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(fileURLToPath(new URL('../../../', import.meta.url)))
