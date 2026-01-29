import type {
  DirInput,
  HookErrorPolicy,
  MockEntryOptions,
  PlaygroundOptionsInput,
} from '@mokup/shared'
import {
  collectFiles,
  createDefineConfig,
  createRouteUtils,
  loadRules,
  normalizeMethod,
  normalizePrefix,
  resolveDirs,
} from '@mokup/shared'
import { expectAssignable, expectType } from 'tsd'

const dirInput: DirInput = root => [root]
const entry: MockEntryOptions = {
  dir: 'mock',
  prefix: '/api',
  watch: true,
  log: false,
}
const playground: PlaygroundOptionsInput = {
  path: '/__mokup',
  enabled: true,
}

expectAssignable<DirInput>(dirInput)
expectType<MockEntryOptions>(entry)
expectAssignable<PlaygroundOptionsInput>(playground)

interface DevConfig {
  hookError?: HookErrorPolicy
  headers?: Record<string, string>
}

const configApi = createDefineConfig<DevConfig, string>({ logPrefix: '[test]' })
const configResult = configApi.defineConfig({ headers: { 'x-mokup': 'ok' } })
expectAssignable<DevConfig | Promise<DevConfig>>(configResult)

configApi.onBeforeAll(() => {})
configApi.onAfterAll(async () => {})

const dirs = resolveDirs(dirInput, '/root')
expectType<string[]>(dirs)

expectType<string | undefined>(normalizeMethod('get'))
expectType<string>(normalizePrefix('api'))

const files = collectFiles([])
expectType<ReturnType<typeof collectFiles>>(files)

const rules = loadRules<{ handler: () => string }>('mock.ts', {
  loadModule: async () => ({ default: { handler: () => 'ok' } }),
})
expectType<Promise<Array<{ handler: () => string }>>>(rules)

const utils = createRouteUtils({
  parseRouteTemplate: template => ({
    template,
    tokens: [],
    score: [],
    errors: [],
    warnings: [],
  }),
  compareRouteScore: () => 0,
})

const derived = utils.deriveRouteFromFile('/root/mock/ping.get.ts', '/root/mock')
expectType<ReturnType<typeof utils.deriveRouteFromFile>>(derived)
