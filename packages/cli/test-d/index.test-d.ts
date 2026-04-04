/* eslint-disable antfu/no-import-dist */
import type {
  BuildOptions,
  DiagnosticCategory,
  DiagnosticErrorMode,
  HookErrorPolicy,
  MiddlewarePosition,
  MiddlewareRegistry,
  RouteDirectoryConfig,
  RouteRule,
} from '../dist/index.mjs'
import { expectAssignable, expectType } from 'tsd'
import {
  buildManifest,
  createCli,
  defineConfig,
  onAfterAll,
  onBeforeAll,
  runCli,
} from '../dist/index.mjs'

const options: BuildOptions = {
  dir: ['mock'],
  outDir: '.mokup',
  prefix: '/api',
  handlers: true,
  errorOn: ['duplicate-route'],
}
const diagnosticCategory: DiagnosticCategory = 'missing-handler'
const diagnosticErrorMode: DiagnosticErrorMode = [diagnosticCategory]

const routeRule: RouteRule = {
  handler: { ok: true },
  status: 200,
}

const directoryConfig: RouteDirectoryConfig = {
  headers: { 'x-mokup': 'dir' },
  enabled: true,
}

const registry: MiddlewareRegistry = {
  use: (...handlers: unknown[]) => {
    expectType<number>(handlers.length)
  },
}

const policy: HookErrorPolicy = 'warn'
const position: MiddlewarePosition = 'pre'

expectType<BuildOptions>(options)
expectAssignable<DiagnosticCategory>(diagnosticCategory)
expectAssignable<DiagnosticErrorMode>(diagnosticErrorMode)
expectType<RouteRule>(routeRule)
expectType<RouteDirectoryConfig>(directoryConfig)
expectType<MiddlewareRegistry>(registry)
expectAssignable<HookErrorPolicy>(policy)
expectAssignable<MiddlewarePosition>(position)

const configResult = defineConfig({})
expectAssignable<RouteDirectoryConfig | Promise<RouteDirectoryConfig>>(configResult)

onBeforeAll(() => {})
onAfterAll(async () => {})

const buildResult = buildManifest({ dir: 'mock', outDir: '.mokup' })
expectType<ReturnType<typeof buildManifest>>(buildResult)

expectType<ReturnType<typeof createCli>>(createCli())
expectType<Promise<void>>(runCli(['node', 'mokup']))
