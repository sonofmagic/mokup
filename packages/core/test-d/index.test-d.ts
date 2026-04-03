/* eslint-disable antfu/no-import-dist */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  Logger,
  ResolvedRoute,
  ResolvedSwConfig,
  RouteDecisionStep,
  RouteIgnoreInfo,
  RouteSkipInfo,
  RouteTable,
  VitePluginOptions,
} from '../dist/index.mjs'
import { expectAssignable, expectType } from 'tsd'
import {
  buildBundleModule,
  createHonoApp,
  createMiddleware,
  defaultSwPath,
  defaultSwScope,
  resolveSwConfig,
  resolveSwUnregisterConfig,
  scanRoutes,
} from '../dist/index.mjs'

const logger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
}

const route: ResolvedRoute = {
  file: 'mock/ping.get.ts',
  template: '/ping',
  method: 'GET',
  tokens: [{ type: 'static', value: 'ping' }],
  score: [4],
  handler: () => ({ ok: true }),
}

const routes: RouteTable = [route]

const skipInfo: RouteSkipInfo = {
  file: 'mock/disabled.get.ts',
  reason: 'disabled',
}

const ignoreInfo: RouteIgnoreInfo = {
  file: 'mock/readme.md',
  reason: 'unsupported',
}

const decision: RouteDecisionStep = {
  step: 'config.enabled',
  result: 'pass',
}

expectType<RouteSkipInfo>(skipInfo)
expectType<RouteIgnoreInfo>(ignoreInfo)
expectType<RouteDecisionStep>(decision)

const app = createHonoApp(routes)
expectType<ReturnType<typeof createHonoApp>>(app)

const middleware = createMiddleware(() => app, logger)
expectAssignable<(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => Promise<void>>(middleware)

const bundleSource = buildBundleModule({ routes, root: '/' })
expectType<string>(bundleSource)

const scanResult = scanRoutes({ dirs: [], prefix: '', logger })
expectType<Promise<RouteTable>>(scanResult)

const swEntry: VitePluginOptions = { dir: 'mock', mode: 'sw' }
const swConfig = resolveSwConfig([swEntry], logger)
expectType<ResolvedSwConfig | null>(swConfig)

const swUnregister = resolveSwUnregisterConfig([swEntry], logger)
expectType<ResolvedSwConfig>(swUnregister)

expectAssignable<string>(defaultSwPath)
expectAssignable<string>(defaultSwScope)
