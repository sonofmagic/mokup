import type { Manifest, ManifestRoute } from '@mokup/runtime'
import type { BuildOptions, MockRule } from './types'

import { promises as fs } from 'node:fs'
import { cwd } from 'node:process'

import { join, relative, resolve } from 'pathe'

import { writeBundle, writeManifestModule } from './bundle'
import { collectFiles, isSupportedFile, matchesFilter, resolveDirs } from './files'
import { buildResponse, bundleHandlers, writeHandlerIndex } from './handlers'
import { deriveRouteFromFile, resolveRule, sortRoutes } from './routes'
import { loadRules } from './rules'
import { toPosix } from './utils'

export async function buildManifest(options: BuildOptions = {}) {
  const root = options.root ?? cwd()
  const outDir = resolve(root, options.outDir ?? '.mokup')
  const handlersDir = join(outDir, 'mokup-handlers')
  const dirs = resolveDirs(options.dir, root)

  const files = await collectFiles(dirs)
  const routes: ManifestRoute[] = []
  const seen = new Set<string>()
  const handlerSources = new Set<string>()
  const handlerModuleMap = new Map<string, string>()

  for (const fileInfo of files) {
    if (!isSupportedFile(fileInfo.file)) {
      continue
    }
    if (!matchesFilter(fileInfo.file, options.include, options.exclude)) {
      continue
    }
    const derived = deriveRouteFromFile(fileInfo.file, fileInfo.rootDir, options.log)
    if (!derived) {
      continue
    }
    const rules = await loadRules(fileInfo.file)
    for (const [index, rule] of rules.entries()) {
      if (!rule || typeof rule !== 'object') {
        continue
      }
      if (typeof rule.response === 'undefined') {
        continue
      }
      const resolveParams: {
        rule: MockRule
        derivedTemplate: string
        derivedMethod: ManifestRoute['method']
        prefix: string
        file: string
        log?: (message: string) => void
      } = {
        rule,
        derivedTemplate: derived.template,
        derivedMethod: derived.method,
        prefix: options.prefix ?? '',
        file: fileInfo.file,
      }
      if (options.log) {
        resolveParams.log = options.log
      }
      const resolved = resolveRule(resolveParams)
      if (!resolved) {
        continue
      }
      const key = `${resolved.method} ${resolved.template}`
      if (seen.has(key)) {
        options.log?.(`Duplicate mock route ${key} from ${fileInfo.file}`)
      }
      seen.add(key)
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
      const source = toPosix(relative(root, fileInfo.file))
      const route: ManifestRoute = {
        method: resolved.method,
        url: resolved.template,
        tokens: resolved.tokens,
        score: resolved.score,
        source,
        response,
      }
      if (typeof rule.status === 'number') {
        route.status = rule.status
      }
      if (rule.headers) {
        route.headers = rule.headers
      }
      if (typeof rule.delay === 'number') {
        route.delay = rule.delay
      }
      routes.push(route)
    }
  }

  const manifest: Manifest = {
    version: 1,
    routes: sortRoutes(routes),
  }

  await fs.mkdir(outDir, { recursive: true })
  if (handlerSources.size > 0) {
    await fs.mkdir(handlersDir, { recursive: true })
    await bundleHandlers(Array.from(handlerSources), root, handlersDir)
    await writeHandlerIndex(handlerModuleMap, handlersDir, outDir)
  }
  const manifestPath = join(outDir, 'mokup.manifest.json')
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  await writeManifestModule(outDir, manifest)
  await writeBundle(outDir, handlerSources.size > 0)

  options.log?.(`Manifest written to ${manifestPath}`)

  return {
    manifest,
    manifestPath,
  }
}
