import type { PreviewServer, ViteDevServer } from 'vite'

import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { cwd } from 'node:process'
import { fileURLToPath } from 'node:url'

import { createTsxConfigFile, loadModule as loadModuleShared } from '@mokup/shared/module-loader'
import { dirname, relative, resolve } from '@mokup/shared/pathe'

const sourceRoot = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(sourceRoot, '..')
const require = createRequire(import.meta.url)

function resolveWorkspaceEntry(candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

function findWorkspaceRoot(start: string) {
  let current = start
  while (true) {
    const workspaceFile = resolve(current, 'pnpm-workspace.yaml')
    const turboFile = resolve(current, 'turbo.json')
    if (existsSync(workspaceFile) || existsSync(turboFile)) {
      return current
    }
    const parent = dirname(current)
    if (!parent || parent === current) {
      return null
    }
    current = parent
  }
}

function resolvePackageRoot(name: string) {
  try {
    return dirname(require.resolve(`${name}/package.json`))
  }
  catch {
    return null
  }
}

const resolvedMokupRoot = resolvePackageRoot('mokup')
const workspaceMokupRoot = resolve(packageRoot, '../mokup')
const cwdWorkspaceRoot = findWorkspaceRoot(cwd())
const cwdMokupRoot = cwdWorkspaceRoot ? resolve(cwdWorkspaceRoot, 'packages/mokup') : null

const mokupSourceEntry = resolveWorkspaceEntry([
  resolvedMokupRoot ? resolve(resolvedMokupRoot, 'src/index.ts') : null,
  resolve(workspaceMokupRoot, 'src/index.ts'),
  cwdMokupRoot ? resolve(cwdMokupRoot, 'src/index.ts') : null,
])
const mokupViteSourceEntry = resolveWorkspaceEntry([
  resolvedMokupRoot ? resolve(resolvedMokupRoot, 'src/vite.ts') : null,
  resolve(workspaceMokupRoot, 'src/vite.ts'),
  cwdMokupRoot ? resolve(cwdMokupRoot, 'src/vite.ts') : null,
])

function toTsxConfigPath(file: string) {
  const rel = relative(packageRoot, file)
  return rel.startsWith('.') ? rel : `./${rel}`
}

function buildTsxConfigPath() {
  const paths: Record<string, string[]> = {}
  if (mokupSourceEntry) {
    paths['mokup'] = [toTsxConfigPath(mokupSourceEntry)]
  }
  if (mokupViteSourceEntry) {
    paths['mokup/vite'] = [toTsxConfigPath(mokupViteSourceEntry)]
  }
  if (Object.keys(paths).length === 0) {
    return null
  }
  return createTsxConfigFile({
    baseUrl: packageRoot,
    paths,
  })
}

const tsxConfigPath = buildTsxConfigPath()

async function loadModule(file: string) {
  return loadModuleShared(file, { tsconfigPath: tsxConfigPath })
}

function invalidateViteModules(server: ViteDevServer, file: string) {
  const graph = server.moduleGraph
  const nodes = new Set<Parameters<typeof graph.invalidateModule>[0]>()

  const byId = graph.getModuleById(file)
  if (byId) {
    nodes.add(byId)
  }

  const withFileLookup = graph as typeof graph & {
    getModulesByFile?: (file: string) => Set<Parameters<typeof graph.invalidateModule>[0]> | undefined
  }
  const byFile = withFileLookup.getModulesByFile?.(file)
  if (byFile) {
    for (const node of byFile) {
      nodes.add(node)
    }
  }

  for (const node of nodes) {
    graph.invalidateModule(node)
  }
}

async function loadModuleWithVite(server: ViteDevServer | PreviewServer, file: string) {
  const asDevServer = server as ViteDevServer
  if ('ssrLoadModule' in asDevServer) {
    invalidateViteModules(asDevServer, file)
    const stamp = Date.now()
    const requestId = `${file}${file.includes('?') ? '&' : '?'}mokupv=${stamp}`
    try {
      return await asDevServer.ssrLoadModule(requestId)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('transport was disconnected')) {
        return loadModule(file)
      }
      throw error
    }
  }
  return loadModule(file)
}

export { loadModule, loadModuleWithVite }
