import { scanRoutes } from '@mokup/core'

import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveDirectoryConfig: vi.fn(),
  collectFiles: vi.fn(),
  loadRules: vi.fn(),
}))

vi.mock('@mokup/core/config', () => ({
  resolveDirectoryConfig: mocks.resolveDirectoryConfig,
}))

vi.mock('@mokup/core/shared/files', () => ({
  collectFiles: mocks.collectFiles,
  isConfigFile: (file: string) => file.endsWith('index.config.ts'),
  isSupportedFile: () => true,
}))

vi.mock('@mokup/core/loader', () => ({
  loadRules: mocks.loadRules,
}))

vi.mock('@mokup/core/routes', async () => {
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
