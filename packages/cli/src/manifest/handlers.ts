import type { ManifestResponse } from '@mokup/runtime'

import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'

import { build as esbuild } from '@mokup/shared/esbuild'
import { dirname, extname, join, relative, resolve } from '@mokup/shared/pathe'

import { toPosix } from './utils'

/**
 * Options for building a manifest response from a handler.
 *
 * @example
 * import type { BuildResponseOptions } from '@mokup/cli'
 *
 * const options: BuildResponseOptions = {
 *   file: 'mock/ping.get.ts',
 *   handlers: true,
 *   handlerSources: new Set(),
 *   handlerModuleMap: new Map(),
 *   handlersDir: '.mokup/mokup-handlers',
 *   root: process.cwd(),
 *   ruleIndex: 0,
 * }
 */
export interface BuildResponseOptions {
  /** Handler file path. */
  file: string
  /**
   * Whether to emit handler bundles.
   *
   * @default true
   */
  handlers: boolean
  /** Mutable set of handler source files. */
  handlerSources: Set<string>
  /** Map of source file to handler module path. */
  handlerModuleMap: Map<string, string>
  /** Output directory for handler bundles. */
  handlersDir: string
  /** Root directory used for relative paths. */
  root: string
  /** Rule index within the file. */
  ruleIndex: number
}

/**
 * Resolve the handler module path relative to the handlers directory.
 *
 * @param file - Source handler file.
 * @param handlersDir - Handler output directory.
 * @param root - Project root.
 * @returns Relative module path for import.
 *
 * @example
 * import { getHandlerModulePath } from '@mokup/cli'
 *
 * const path = getHandlerModulePath('mock/ping.get.ts', '.mokup/mokup-handlers', process.cwd())
 */
export function getHandlerModulePath(file: string, handlersDir: string, root: string) {
  const relFromRoot = relative(root, file)
  const ext = extname(relFromRoot)
  const relNoExt = `${relFromRoot.slice(0, relFromRoot.length - ext.length)}.mjs`
  const outputPath = join(handlersDir, relNoExt)
  const relFromOutDir = relative(dirname(handlersDir), outputPath)
  const normalized = toPosix(relFromOutDir)
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}

/**
 * Write the handler module map index files.
 *
 * @param handlerModuleMap - Map of source file to module path.
 * @param handlersDir - Handler output directory.
 * @param outDir - Build output directory.
 *
 * @example
 * import { writeHandlerIndex } from '@mokup/cli'
 *
 * await writeHandlerIndex(new Map(), '.mokup/mokup-handlers', '.mokup')
 */
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

/**
 * Build a manifest response entry from a handler value.
 *
 * @param handler - Handler value or function.
 * @param options - Build options.
 * @returns Manifest response or null when handlers are disabled.
 *
 * @example
 * import { buildResponse } from '@mokup/cli'
 *
 * const response = buildResponse({ ok: true }, {
 *   file: 'mock/ping.get.ts',
 *   handlers: true,
 *   handlerSources: new Set(),
 *   handlerModuleMap: new Map(),
 *   handlersDir: '.mokup/mokup-handlers',
 *   root: process.cwd(),
 *   ruleIndex: 0,
 * })
 */
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

/**
 * Bundle handler modules into the handlers directory.
 *
 * @param files - Source files to bundle.
 * @param root - Project root.
 * @param handlersDir - Output directory.
 *
 * @example
 * import { bundleHandlers } from '@mokup/cli'
 *
 * await bundleHandlers(['mock/ping.get.ts'], process.cwd(), '.mokup/mokup-handlers')
 */
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
