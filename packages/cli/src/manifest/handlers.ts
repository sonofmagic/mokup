import type { ManifestResponse } from '@mokup/runtime'

import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'

import { build as esbuild } from '@mokup/shared/esbuild'
import { dirname, extname, join, relative, resolve } from '@mokup/shared/pathe'

import { toPosix } from './utils'

export interface BuildResponseOptions {
  file: string
  handlers: boolean
  handlerSources: Set<string>
  handlerModuleMap: Map<string, string>
  handlersDir: string
  root: string
  ruleIndex: number
}

export function getHandlerModulePath(file: string, handlersDir: string, root: string) {
  const relFromRoot = relative(root, file)
  const ext = extname(relFromRoot)
  const relNoExt = `${relFromRoot.slice(0, relFromRoot.length - ext.length)}.mjs`
  const outputPath = join(handlersDir, relNoExt)
  const relFromOutDir = relative(dirname(handlersDir), outputPath)
  const normalized = toPosix(relFromOutDir)
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}

export async function writeHandlerIndex(
  handlerModuleMap: Map<string, string>,
  handlersDir: string,
  outDir: string,
) {
  const modulePaths = Array.from(new Set(handlerModuleMap.values()))
  if (modulePaths.length === 0) {
    return
  }
  const imports: string[] = []
  const entries: Array<{ key: string, name: string }> = []

  modulePaths.forEach((modulePath, index) => {
    const absolutePath = resolve(outDir, modulePath)
    const relImport = toPosix(relative(handlersDir, absolutePath))
    const importPath = relImport.startsWith('.') ? relImport : `./${relImport}`
    const name = `module${index}`
    imports.push(`import * as ${name} from '${importPath}'`)
    entries.push({ key: modulePath, name })
  })

  const lines = [
    ...imports,
    '',
    'export const mokupModuleMap = {',
    ...entries.map(entry => `  '${entry.key}': ${entry.name},`),
    '}',
    '',
  ]

  await fs.writeFile(join(handlersDir, 'index.mjs'), lines.join('\n'), 'utf8')
  const dts = [
    'export type ModuleMap = Record<string, Record<string, unknown>>',
    'export declare const mokupModuleMap: ModuleMap',
    '',
  ]
  await fs.writeFile(join(handlersDir, 'index.d.ts'), dts.join('\n'), 'utf8')
  await fs.writeFile(join(handlersDir, 'index.d.mts'), dts.join('\n'), 'utf8')
}

export function buildResponse(
  handler: unknown,
  options: BuildResponseOptions,
): ManifestResponse | null {
  if (typeof handler === 'function') {
    if (!options.handlers) {
      return null
    }
    const moduleRel = getHandlerModulePath(
      options.file,
      options.handlersDir,
      options.root,
    )
    options.handlerSources.add(options.file)
    options.handlerModuleMap.set(options.file, moduleRel)
    return {
      type: 'module',
      module: moduleRel,
      ruleIndex: options.ruleIndex,
    }
  }
  if (typeof handler === 'string') {
    return {
      type: 'text',
      body: handler,
    }
  }
  if (handler instanceof Uint8Array || handler instanceof ArrayBuffer) {
    return {
      type: 'binary',
      body: Buffer.from(handler as Uint8Array).toString('base64'),
      encoding: 'base64',
    }
  }
  if (Buffer.isBuffer(handler)) {
    return {
      type: 'binary',
      body: handler.toString('base64'),
      encoding: 'base64',
    }
  }
  return {
    type: 'json',
    body: handler,
  }
}

export async function bundleHandlers(files: string[], root: string, handlersDir: string) {
  await esbuild({
    entryPoints: files,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    outdir: handlersDir,
    outbase: root,
    entryNames: '[dir]/[name]',
    outExtension: { '.js': '.mjs' },
    logLevel: 'silent',
  })
}
