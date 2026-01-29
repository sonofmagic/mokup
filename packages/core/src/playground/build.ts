import type { RouteIgnoreInfo, RouteSkipInfo } from '../scanner'
import type { Logger, RouteTable } from '../shared/types'
import { promises as fs } from 'node:fs'
import { join, normalize } from '@mokup/shared/pathe'
import { resolvePlaygroundDist } from './assets'
import { normalizePlaygroundPath, resolvePlaygroundRequestPath } from './config'
import { resolveGroupRoot, resolveGroups } from './grouping'
import { injectPlaygroundSw } from './inject'
import {
  toPlaygroundConfigFile,
  toPlaygroundDisabledRoute,
  toPlaygroundIgnoredRoute,
  toPlaygroundRoute,
} from './serialize'

interface PlaygroundBuildParams {
  outDir: string
  base: string
  playgroundPath: string
  root?: string
  routes: RouteTable
  disabledRoutes: RouteSkipInfo[]
  ignoredRoutes: RouteIgnoreInfo[]
  configFiles: { file: string }[]
  disabledConfigFiles: { file: string }[]
  dirs: string[]
  swScript: string | null
  logger: Logger
}

function resolvePlaygroundOutDir(outDir: string, playgroundPath: string) {
  const normalized = normalizePlaygroundPath(playgroundPath)
  const trimmed = normalized.replace(/^\/+/, '')
  return trimmed ? join(outDir, normalize(trimmed)) : outDir
}

function stripSwLifecycle(html: string) {
  return html.replace(
    /<script[^>]*mokup-sw-lifecycle\.js[^>]*><\/script>\s*/gi,
    '',
  )
}

async function writeRoutesPayload(params: PlaygroundBuildParams, targetDir: string) {
  const baseRoot = resolveGroupRoot(params.dirs, params.root)
  const groups = resolveGroups(params.dirs, baseRoot)
  const basePath = resolvePlaygroundRequestPath(params.base, params.playgroundPath)
  const payload = {
    basePath,
    root: baseRoot,
    count: params.routes.length,
    groups: groups.map(group => ({ key: group.key, label: group.label })),
    routes: params.routes.map(route => toPlaygroundRoute(route, baseRoot, groups)),
    disabled: params.disabledRoutes.map(route =>
      toPlaygroundDisabledRoute(route, baseRoot, groups),
    ),
    ignored: params.ignoredRoutes.map(route =>
      toPlaygroundIgnoredRoute(route, baseRoot, groups),
    ),
    configs: params.configFiles.map(entry => toPlaygroundConfigFile(entry, baseRoot, groups)),
    disabledConfigs: params.disabledConfigFiles.map(entry =>
      toPlaygroundConfigFile(entry, baseRoot, groups),
    ),
  }
  await fs.writeFile(
    join(targetDir, 'routes'),
    JSON.stringify(payload, null, 2),
    'utf8',
  )
}

async function updateIndexHtml(targetDir: string, swScript: string | null) {
  const indexPath = join(targetDir, 'index.html')
  const html = await fs.readFile(indexPath, 'utf8')
  const cleaned = stripSwLifecycle(html)
  const output = swScript ? injectPlaygroundSw(cleaned, swScript) : cleaned
  await fs.writeFile(indexPath, output, 'utf8')
}

async function removeLegacySwAsset(targetDir: string) {
  const legacyFiles = [
    join(targetDir, 'assets', 'mokup-sw-lifecycle.js'),
    join(targetDir, 'assets', 'mokup-sw-lifecycle.js.map'),
  ]
  await Promise.all(legacyFiles.map(file => fs.rm(file, { force: true })))
}

export async function writePlaygroundBuild(params: PlaygroundBuildParams) {
  const distDir = resolvePlaygroundDist()
  const targetDir = resolvePlaygroundOutDir(params.outDir, params.playgroundPath)
  if (targetDir === params.outDir) {
    params.logger.error('Playground build path resolves to the Vite outDir. Aborting output.')
    return
  }

  try {
    await fs.stat(distDir)
  }
  catch (error) {
    params.logger.error('Failed to locate playground assets:', error)
    return
  }

  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.mkdir(params.outDir, { recursive: true })
  await fs.cp(distDir, targetDir, { recursive: true })

  await removeLegacySwAsset(targetDir)
  await updateIndexHtml(targetDir, params.swScript)
  await writeRoutesPayload(params, targetDir)
}
