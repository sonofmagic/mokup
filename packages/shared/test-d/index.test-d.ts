import type {
  DiagnosticCategory,
  DiagnosticErrorMode,
  DirInput,
  HookErrorPolicy,
  MockEntryOptions,
  PlaygroundOptionsInput,
} from '@mokup/shared'
import {
  collectFiles,
  createDefineConfig,
  createRouteUtils,
  diagnosticCategories,
  isDiagnosticCategory,
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
  errorOn: ['invalid-route'],
}
const playground: PlaygroundOptionsInput = {
  path: '/__mokup',
  enabled: true,
}
const diagnosticCategory: DiagnosticCategory = 'invalid-route'
const diagnosticErrorMode: DiagnosticErrorMode = [diagnosticCategory]

expectAssignable<DirInput>(dirInput)
expectType<MockEntryOptions>(entry)
expectAssignable<PlaygroundOptionsInput>(playground)
expectAssignable<DiagnosticCategory>(diagnosticCategory)
expectAssignable<DiagnosticErrorMode>(diagnosticErrorMode)
expectAssignable<readonly DiagnosticCategory[]>(diagnosticCategories)
expectType<boolean>(isDiagnosticCategory('invalid-route'))

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
