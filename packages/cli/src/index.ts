import type { HttpMethod, Manifest, ManifestResponse, ManifestRoute } from 'moku-runtime'
import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { cwd } from 'node:process'

import { pathToFileURL } from 'node:url'
import { build as esbuild } from 'esbuild'
import { parse as parseJsonc } from 'jsonc-parser'

import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'pathe'

export interface BuildOptions {
  dir?: string | string[]
  outDir?: string
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  handlers?: boolean
  root?: string
  log?: (message: string) => void
}

interface MockRule {
  url?: string
  method?: string
  response: unknown
  status?: number
  headers?: Record<string, string>
  delay?: number
}

const methodSet = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
])

const methodSuffixSet = new Set(
  Array.from(methodSet, method => method.toLowerCase()),
)

const supportedExtensions = new Set([
  '.json',
  '.jsonc',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
])

function toPosix(value: string) {
  return value.replace(/\\/g, '/')
}

function normalizeMethod(method?: string | null): HttpMethod | undefined {
  if (!method) {
    return undefined
  }
  const normalized = method.toUpperCase()
  if (methodSet.has(normalized as HttpMethod)) {
    return normalized as HttpMethod
  }
  return undefined
}

function normalizeUrl(url: string) {
  const sanitized = url.split('?')[0]
  if (!sanitized.startsWith('/')) {
    return `/${sanitized}`
  }
  return sanitized
}

function normalizePrefix(prefix: string) {
  if (!prefix) {
    return ''
  }
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

function resolveMethod(
  fileMethod: HttpMethod | undefined,
  ruleMethod?: string,
): HttpMethod {
  if (fileMethod) {
    return fileMethod
  }
  const normalized = normalizeMethod(ruleMethod)
  if (normalized) {
    return normalized
  }
  return 'GET'
}

function resolveUrl(url: string, prefix: string) {
  const normalized = normalizeUrl(url)
  if (!prefix) {
    return normalized
  }
  const normalizedPrefix = normalizePrefix(prefix)
  if (!normalizedPrefix) {
    return normalized
  }
  if (
    normalized === normalizedPrefix
    || normalized.startsWith(`${normalizedPrefix}/`)
  ) {
    return normalized
  }
  if (normalized === '/') {
    return `${normalizedPrefix}/`
  }
  return `${normalizedPrefix}${normalized}`
}

function stripMethodSuffix(base: string) {
  const sanitized = base.endsWith('.mock')
    ? base.slice(0, -'.mock'.length)
    : base
  const segments = sanitized.split('.')
  const last = segments.at(-1)
  if (last && methodSuffixSet.has(last.toLowerCase())) {
    segments.pop()
    return {
      name: segments.join('.') || sanitized,
      method: last.toUpperCase() as HttpMethod,
    }
  }
  return {
    name: sanitized,
    method: undefined,
  }
}

function deriveRouteFromFile(file: string, rootDir: string) {
  const rel = toPosix(relative(rootDir, file))
  const ext = extname(rel)
  const withoutExt = rel.slice(0, rel.length - ext.length)
  const dir = dirname(withoutExt)
  const base = basename(withoutExt)
  const { name, method } = stripMethodSuffix(base)
  const joined = dir === '.' ? name : join(dir, name)
  let url = `/${toPosix(joined)}`
  if (url.endsWith('/index')) {
    url = url.slice(0, -'/index'.length) || '/'
  }
  return {
    url,
    method,
  }
}

function testPatterns(patterns: RegExp | RegExp[], value: string) {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some(pattern => pattern.test(value))
}

function matchesFilter(
  file: string,
  include?: RegExp | RegExp[],
  exclude?: RegExp | RegExp[],
) {
  const normalized = toPosix(file)
  if (exclude && testPatterns(exclude, normalized)) {
    return false
  }
  if (include) {
    return testPatterns(include, normalized)
  }
  return true
}

function isSupportedFile(file: string) {
  if (file.endsWith('.d.ts')) {
    return false
  }
  const ext = extname(file).toLowerCase()
  return supportedExtensions.has(ext)
}

async function exists(path: string) {
  try {
    await fs.stat(path)
    return true
  }
  catch {
    return false
  }
}

async function walkDir(
  dir: string,
  rootDir: string,
  files: Array<{ file: string, rootDir: string }>,
) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue
    }
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkDir(fullPath, rootDir, files)
      continue
    }
    if (entry.isFile()) {
      files.push({ file: fullPath, rootDir })
    }
  }
}

async function collectFiles(dirs: string[]) {
  const files: Array<{ file: string, rootDir: string }> = []
  for (const dir of dirs) {
    if (!(await exists(dir))) {
      continue
    }
    await walkDir(dir, dir, files)
  }
  return files
}

function resolveDirs(dir: BuildOptions['dir'], root: string): string[] {
  const raw = dir
  const resolved = Array.isArray(raw) ? raw : raw ? [raw] : ['mock']
  const normalized = resolved.map(entry =>
    isAbsolute(entry) ? entry : resolve(root, entry),
  )
  return Array.from(new Set(normalized))
}

function resolveRule(params: {
  rule: MockRule
  derivedUrl: string
  derivedMethod?: HttpMethod
  prefix: string
}) {
  const method = resolveMethod(params.derivedMethod, params.rule.method)
  const url = resolveUrl(params.rule.url ?? params.derivedUrl, params.prefix)
  if (!method || !url) {
    return null
  }
  return {
    method,
    url,
  }
}

async function readJsonFile(file: string) {
  try {
    const content = await fs.readFile(file, 'utf8')
    const errors: { error: number, offset: number, length: number }[] = []
    const data = parseJsonc(content, errors, {
      allowTrailingComma: true,
      disallowComments: false,
    })
    if (errors.length > 0) {
      return undefined
    }
    return data
  }
  catch {
    return undefined
  }
}

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

async function loadRules(file: string): Promise<MockRule[]> {
  const ext = extname(file).toLowerCase()
  if (ext === '.json' || ext === '.jsonc') {
    const json = await readJsonFile(file)
    if (typeof json === 'undefined') {
      return []
    }
    return [
      {
        response: json,
      },
    ]
  }

  const mod = await loadModule(file)
  const value = (mod as { default?: unknown } | undefined)?.default ?? mod
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value as MockRule[]
  }
  if (typeof value === 'function') {
    return [
      {
        response: value,
      },
    ]
  }
  return [value as MockRule]
}

function getHandlerModulePath(file: string, handlersDir: string, root: string) {
  const relFromRoot = relative(root, file)
  const ext = extname(relFromRoot)
  const relNoExt = `${relFromRoot.slice(0, relFromRoot.length - ext.length)}.mjs`
  const outputPath = join(handlersDir, relNoExt)
  const relFromOutDir = relative(dirname(handlersDir), outputPath)
  const normalized = toPosix(relFromOutDir)
  return normalized.startsWith('.') ? normalized : `./${normalized}`
}

function buildResponse(
  response: unknown,
  options: {
    file: string
    handlers: boolean
    handlerSources: Set<string>
    handlerModuleMap: Map<string, string>
    handlersDir: string
    root: string
    ruleIndex: number
  },
): ManifestResponse | null {
  if (typeof response === 'function') {
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
  if (typeof response === 'string') {
    return {
      type: 'text',
      body: response,
    }
  }
  if (response instanceof Uint8Array || response instanceof ArrayBuffer) {
    return {
      type: 'binary',
      body: Buffer.from(response as Uint8Array).toString('base64'),
      encoding: 'base64',
    }
  }
  if (Buffer.isBuffer(response)) {
    return {
      type: 'binary',
      body: response.toString('base64'),
      encoding: 'base64',
    }
  }
  return {
    type: 'json',
    body: response,
  }
}

async function bundleHandlers(files: string[], root: string, handlersDir: string) {
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

export async function buildManifest(options: BuildOptions = {}) {
  const root = options.root ?? cwd()
  const outDir = resolve(root, options.outDir ?? 'dist')
  const handlersDir = join(outDir, 'moku-handlers')
  const dirs = resolveDirs(options.dir, root)

  const files = await collectFiles(dirs)
  const routes: ManifestRoute[] = []
  const handlerSources = new Set<string>()
  const handlerModuleMap = new Map<string, string>()

  for (const fileInfo of files) {
    if (!isSupportedFile(fileInfo.file)) {
      continue
    }
    if (!matchesFilter(fileInfo.file, options.include, options.exclude)) {
      continue
    }
    const derived = deriveRouteFromFile(fileInfo.file, fileInfo.rootDir)
    const rules = await loadRules(fileInfo.file)
    for (const [index, rule] of rules.entries()) {
      if (!rule || typeof rule !== 'object') {
        continue
      }
      if (typeof rule.response === 'undefined') {
        continue
      }
      const resolved = resolveRule({
        rule,
        derivedUrl: derived.url,
        derivedMethod: derived.method,
        prefix: options.prefix ?? '',
      })
      if (!resolved) {
        continue
      }
      const response = buildResponse(
        rule.response,
        {
          file: fileInfo.file,
          handlers: options.handlers !== false,
          handlerSources,
          handlerModuleMap,
          handlersDir,
          root,
          ruleIndex: index,
        },
      )
      if (!response) {
        continue
      }
      routes.push({
        method: resolved.method,
        url: resolved.url,
        status: rule.status,
        headers: rule.headers,
        delay: rule.delay,
        response,
      })
    }
  }

  if (handlerSources.size > 0) {
    await fs.mkdir(handlersDir, { recursive: true })
    await bundleHandlers(Array.from(handlerSources), root, handlersDir)
  }

  const manifest: Manifest = {
    version: 1,
    routes,
  }

  await fs.mkdir(outDir, { recursive: true })
  const manifestPath = join(outDir, 'moku.manifest.json')
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  options.log?.(`Manifest written to ${manifestPath}`)

  return {
    manifest,
    manifestPath,
  }
}
