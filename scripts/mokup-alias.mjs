import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const mokupRoot = resolve(repoRoot, 'packages/mokup')

const entries = [
  ['mokup', 'src/index.ts'],
  ['mokup/cli', 'src/cli.ts'],
  ['mokup/bundle', 'src/bundle.ts'],
  ['mokup/runtime', 'src/runtime.ts'],
  ['mokup/server', 'src/server.ts'],
  ['mokup/server/fetch', 'src/server/fetch.ts'],
  ['mokup/server/node', 'src/server/node.ts'],
  ['mokup/server/worker', 'src/server/worker.ts'],
  ['mokup/vite', 'src/vite.ts'],
  ['mokup/webpack', 'src/webpack.ts'],
  ['mokup/sw', 'src/sw.ts'],
]

function hasWorkspaceMokup() {
  return existsSync(resolve(mokupRoot, 'src/index.ts'))
}

function resolveEntryPath(entryPath) {
  return resolve(mokupRoot, entryPath)
}

export function getMokupViteAliases() {
  if (!hasWorkspaceMokup()) {
    return []
  }
  return entries.map(([find, entryPath]) => ({
    find: new RegExp(`^${find.replaceAll('/', '\\/')}$`),
    replacement: resolveEntryPath(entryPath),
  }))
}

export function getMokupWebpackAliases() {
  if (!hasWorkspaceMokup()) {
    return {}
  }
  return Object.fromEntries(
    entries.map(([find, entryPath]) => [`${find}$`, resolveEntryPath(entryPath)]),
  )
}
