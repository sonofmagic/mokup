import type {
  BuildOptions,
  HookErrorPolicy,
  MiddlewarePosition,
  MiddlewareRegistry,
  RouteDirectoryConfig,
  RouteRule,
} from '@mokup/cli'
import type { Manifest } from '@mokup/runtime'
import {
  buildManifest,
  createCli,
  defineConfig,
  onAfterAll,
  onBeforeAll,
  runCli,
} from '@mokup/cli'
import { expectAssignable, expectType } from 'tsd'

const options: BuildOptions = {
  dir: ['mock'],
  outDir: '.mokup',
  prefix: '/api',
  handlers: true,
}

const routeRule: RouteRule = {
  handler: { ok: true },
  status: 200,
}

const directoryConfig: RouteDirectoryConfig = {
  headers: { 'x-mokup': 'dir' },
  enabled: true,
}

const registry: MiddlewareRegistry = {
  use: (...handlers) => {
    expectType<number>(handlers.length)
  },
}

const policy: HookErrorPolicy = 'warn'
const position: MiddlewarePosition = 'pre'

expectType<BuildOptions>(options)
expectType<RouteRule>(routeRule)
expectType<RouteDirectoryConfig>(directoryConfig)
expectType<MiddlewareRegistry>(registry)
expectType<HookErrorPolicy>(policy)
expectType<MiddlewarePosition>(position)

const configResult = defineConfig({})
expectAssignable<RouteDirectoryConfig | Promise<RouteDirectoryConfig>>(configResult)

onBeforeAll(() => {})
onAfterAll(async () => {})

const buildResult = buildManifest({ dir: 'mock', outDir: '.mokup' })
expectType<Promise<{ manifest: Manifest, manifestPath: string }>>(buildResult)

expectType<ReturnType<typeof createCli>>(createCli())
expectType<Promise<void>>(runCli(['node', 'mokup']))
