import { createRequire } from 'node:module'
import { scanRoutes } from '@mokup/core'

import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveDirectoryConfig: vi.fn(),
  collectFiles: vi.fn(),
  loadRules: vi.fn(),
}))

const require = createRequire(import.meta.url)
const coreConfigPath = require.resolve('@mokup/core/config')
const coreLoaderPath = require.resolve('@mokup/core/loader')
const coreRoutesPath = require.resolve('@mokup/core/routes')

vi.mock('@mokup/core/config', () => ({
  resolveDirectoryConfig: mocks.resolveDirectoryConfig,
}))
vi.mock('../../core/src/config', () => ({
  resolveDirectoryConfig: mocks.resolveDirectoryConfig,
}))
vi.mock('../../core/dist/config.mjs', () => ({
  resolveDirectoryConfig: mocks.resolveDirectoryConfig,
}))
vi.mock(coreConfigPath, () => ({
  resolveDirectoryConfig: mocks.resolveDirectoryConfig,
}))

vi.mock('@mokup/core/shared/files', () => ({
  collectFiles: mocks.collectFiles,
  isConfigFile: (file: string) => file.endsWith('index.config.ts'),
  isSupportedFile: () => true,
}))
vi.mock('../../core/src/shared/files', () => ({
  collectFiles: mocks.collectFiles,
  isConfigFile: (file: string) => file.endsWith('index.config.ts'),
  isSupportedFile: () => true,
}))
vi.mock('@mokup/shared/mock-files', () => ({
  collectFiles: mocks.collectFiles,
  isConfigFile: (file: string) => file.endsWith('index.config.ts'),
  isSupportedFile: () => true,
}))

vi.mock('@mokup/core/loader', () => ({
  loadRules: mocks.loadRules,
}))
vi.mock('../../core/src/loader', () => ({
  loadRules: mocks.loadRules,
}))
vi.mock('../../core/dist/loader.mjs', () => ({
  loadRules: mocks.loadRules,
}))
vi.mock(coreLoaderPath, () => ({
  loadRules: mocks.loadRules,
}))

vi.mock('@mokup/core/routes', async () => {
  const actual = await vi.importActual<typeof import('@mokup/core/routes')>('@mokup/core/routes')
  return {
    ...actual,
    deriveRouteFromFile: () => ({ template: '/ping', method: 'GET', tokens: [], score: [] }),
  }
})
vi.mock('../../core/src/routes', async () => {
  const actual = await vi.importActual<typeof import('../../core/src/routes')>('../../core/src/routes')
  return {
    ...actual,
    deriveRouteFromFile: () => ({ template: '/ping', method: 'GET', tokens: [], score: [] }),
  }
})
vi.mock('../../core/dist/routes.mjs', async () => {
  const actual = await vi.importActual<typeof import('../../core/dist/routes.mjs')>('../../core/dist/routes.mjs')
  return {
    ...actual,
    deriveRouteFromFile: () => ({ template: '/ping', method: 'GET', tokens: [], score: [] }),
  }
})
vi.mock(coreRoutesPath, async () => {
  const actual = await vi.importActual<typeof import('@mokup/core/routes')>('@mokup/core/routes')
  return {
    ...actual,
    deriveRouteFromFile: () => ({ template: '/ping', method: 'GET', tokens: [], score: [] }),
  }
})

describe('scanRoutes server integration', () => {
  it('passes server into config resolution', async () => {
    mocks.collectFiles.mockResolvedValue([
      { file: '/root/mock/index.config.ts', rootDir: '/root/mock' },
      { file: '/root/mock/ping.get.json', rootDir: '/root/mock' },
    ])
    mocks.resolveDirectoryConfig.mockResolvedValue({
      middlewares: [],
      configChain: undefined,
      enabled: true,
    })
    mocks.loadRules.mockResolvedValue([])

    const server = {
      ssrLoadModule: vi.fn(),
      moduleGraph: {
        getModuleById: vi.fn(),
        invalidateModule: vi.fn(),
      },
    }

    await scanRoutes({
      dirs: ['/root/mock'],
      prefix: '/api',
      logger: { info: () => {}, warn: () => {}, error: () => {}, log: () => {} },
      server: server as never,
    })

    expect(mocks.resolveDirectoryConfig).toHaveBeenCalledWith(expect.objectContaining({ server }))
  })
})
