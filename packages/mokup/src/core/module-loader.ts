import type { PreviewServer, ViteDevServer } from 'vite'
import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build as esbuild } from '@mokup/shared/esbuild'
import { dirname, extname, resolve } from '@mokup/shared/pathe'

const sourceRoot = dirname(fileURLToPath(import.meta.url))
const mokupSourceEntry = resolve(sourceRoot, '../index.ts')
const mokupViteSourceEntry = resolve(sourceRoot, '../vite.ts')
const hasMokupSourceEntry = existsSync(mokupSourceEntry)
const hasMokupViteSourceEntry = existsSync(mokupViteSourceEntry)

function createWorkspaceResolvePlugin() {
  if (!hasMokupSourceEntry && !hasMokupViteSourceEntry) {
    return null
  }
  return {
    name: 'mokup:resolve-workspace',
    setup(build: { onResolve: (options: { filter: RegExp }, cb: () => { path: string }) => void }) {
      if (hasMokupSourceEntry) {
        build.onResolve({ filter: /^mokup$/ }, () => ({ path: mokupSourceEntry }))
      }
      if (hasMokupViteSourceEntry) {
        build.onResolve({ filter: /^mokup\/vite$/ }, () => ({ path: mokupViteSourceEntry }))
      }
    },
  }
}

const workspaceResolvePlugin = createWorkspaceResolvePlugin()

async function loadModule(file: string) {
  const ext = extname(file).toLowerCase()
  if (ext === '.cjs') {
    const require = createRequire(import.meta.url)
    delete require.cache[file]
    return require(file)
  }
  if (ext === '.js' || ext === '.mjs') {
    return import(`${pathToFileURL(file).href}?t=${Date.now()}`)
  }
  if (ext === '.ts') {
    const result = await esbuild({
      entryPoints: [file],
      bundle: true,
      format: 'esm',
      platform: 'node',
      sourcemap: 'inline',
      target: 'es2020',
      write: false,
      ...(workspaceResolvePlugin ? { plugins: [workspaceResolvePlugin] } : {}),
    })
    const output = result.outputFiles[0]
    const code = output?.text ?? ''
    const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString(
      'base64',
    )}`
    return import(`${dataUrl}#${Date.now()}`)
  }
  return null
}

async function loadModuleWithVite(server: ViteDevServer | PreviewServer, file: string) {
  const asDevServer = server as ViteDevServer
  if ('ssrLoadModule' in asDevServer) {
    const moduleNode = asDevServer.moduleGraph.getModuleById(file)
    if (moduleNode) {
      asDevServer.moduleGraph.invalidateModule(moduleNode)
    }
    return asDevServer.ssrLoadModule(file)
  }
  return loadModule(file)
}

export { loadModule, loadModuleWithVite }
