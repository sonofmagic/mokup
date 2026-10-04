import { tmpdir } from 'node:os'
import { join } from '@mokup/shared/pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMokupPlugin } from '../src/vite/plugin'

const projectRoot = join(tmpdir(), 'mokup-vite-build-project')
const absoluteOutput = join(tmpdir(), 'mokup-vite-build-output')

const refreshMocks = vi.hoisted(() => ({
  createRouteRefresher: vi.fn(),
}))

const playgroundMocks = vi.hoisted(() => ({
  writePlaygroundBuild: vi.fn(),
}))

vi.mock('../src/vite/plugin/refresh', () => refreshMocks)
vi.mock('@mokup/core', async () => {
  const actual = await vi.importActual<typeof import('@mokup/core')>('@mokup/core')
  return { ...actual, writePlaygroundBuild: playgroundMocks.writePlaygroundBuild }
})

describe('vite plugin build lifecycle', () => {
  beforeEach(() => {
    playgroundMocks.writePlaygroundBuild.mockClear()
    refreshMocks.createRouteRefresher.mockClear()
  })

  it('injects build scripts and writes playground build', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(({ state }) => async () => {
      state.routes = [
        { file: '/root/mock/ping.get.json', template: '/api/ping', method: 'GET', tokens: [], score: [], handler: { ok: true } },
      ]
      state.serverRoutes = [...state.routes]
      state.swRoutes = [...state.routes]
      state.lastSignature = 'sig'
    })

    const plugin = createMokupPlugin({
      entries: { dir: '/root/mock', prefix: '/api', mode: 'sw' },
      playground: { enabled: true, build: true },
    })

    plugin.configResolved?.({
      root: '/root',
      base: '/',
      command: 'build',
      build: { outDir: 'dist', assetsDir: 'assets', ssr: false },
    } as any)

    const emitFile = vi.fn()
    await plugin.buildStart?.call({ emitFile }, undefined as any)
    expect(emitFile).toHaveBeenCalled()

    const transformed = await plugin.transformIndexHtml?.('<html></html>')
    expect(transformed && typeof transformed === 'object').toBe(true)

    await plugin.closeBundle?.()
    expect(playgroundMocks.writePlaygroundBuild).toHaveBeenCalled()
  })

  it.each([
    { name: 'relative', outDir: 'build/public', expectedDir: join(projectRoot, 'build/public') },
    { name: 'default', outDir: undefined, expectedDir: join(projectRoot, 'dist') },
    { name: 'absolute', outDir: absoluteOutput, expectedDir: absoluteOutput },
  ])('uses the configured Vite root for a $name build output directory', async ({ outDir, expectedDir }) => {
    refreshMocks.createRouteRefresher.mockImplementation(() => async () => {})
    const plugin = createMokupPlugin({
      entries: { dir: 'mock' },
      playground: { path: '/workspace/__mokup', build: true },
    })
    plugin.configResolved?.({
      root: projectRoot,
      base: '/workspace/',
      command: 'build',
      build: { outDir, assetsDir: 'assets', ssr: false },
    } as any)

    await plugin.closeBundle?.()

    expect(playgroundMocks.writePlaygroundBuild).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      root: projectRoot,
      outDir: expectedDir,
      base: '/workspace/',
      playgroundPath: '/workspace/__mokup',
    }))
  })

  it('does not write a playground into an SSR build output', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(() => async () => {})
    const plugin = createMokupPlugin({
      entries: { dir: 'mock' },
      playground: { build: true },
    })
    plugin.configResolved?.({
      root: projectRoot,
      base: '/',
      command: 'build',
      build: { outDir: 'dist/server', assetsDir: 'assets', ssr: 'src/server.ts' },
    } as any)

    await plugin.closeBundle?.()

    expect(playgroundMocks.writePlaygroundBuild).not.toHaveBeenCalled()
  })

  it('skips closeBundle when not in build mode', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(({ state }) => async () => {
      state.routes = []
      state.serverRoutes = []
      state.swRoutes = []
      state.lastSignature = 'sig'
    })

    const plugin = createMokupPlugin({
      entries: { dir: '/root/mock', prefix: '/api', mode: 'sw' },
      playground: { enabled: true, build: true },
    })

    plugin.configResolved?.({
      root: '/root',
      base: '/',
      command: 'serve',
      build: { outDir: 'dist', assetsDir: 'assets', ssr: false },
    } as any)

    await plugin.closeBundle?.()
    expect(playgroundMocks.writePlaygroundBuild).not.toHaveBeenCalled()
  })

  it('returns null for unknown ids', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(() => async () => {})
    const plugin = createMokupPlugin({ entries: { dir: '/root/mock' } })

    expect(plugin.resolveId?.('virtual:unknown')).toBeNull()
    const result = await plugin.load?.call({ addWatchFile: vi.fn() } as any, 'virtual:unknown')
    expect(result).toBeNull()
  })

  it('adds watch files for middlewares and configs', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(({ state }) => async () => {
      state.serverRoutes = [
        {
          file: '/root/mock/ping.get.json',
          template: '/api/ping',
          method: 'GET',
          tokens: [],
          score: [],
          handler: { ok: true },
          middlewares: [
            {
              source: '/root/mock/middleware.ts',
              handle: async () => undefined,
              index: 0,
              position: 'pre',
            },
          ],
        },
      ]
      state.configFiles = [{ file: '/root/mock/index.config.ts' }]
      state.disabledConfigFiles = [{ file: '/root/mock/disabled.config.ts' }]
      state.lastSignature = null
    })

    const plugin = createMokupPlugin({ entries: { dir: '/root/mock' } })
    const bundleId = plugin.resolveId?.('virtual:mokup-bundle') as string
    const addWatchFile = vi.fn()
    await plugin.load?.call({ addWatchFile } as any, bundleId)

    expect(addWatchFile).toHaveBeenCalledWith('/root/mock/middleware.ts')
    expect(addWatchFile).toHaveBeenCalledWith('/root/mock/index.config.ts')
    expect(addWatchFile).toHaveBeenCalledWith('/root/mock/disabled.config.ts')
  })

  it('returns html when lifecycle script is unavailable', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(({ state }) => async () => {
      state.serverRoutes = []
      state.swRoutes = []
      state.lastSignature = 'sig'
    })

    const plugin = createMokupPlugin({
      entries: { dir: '/root/mock', mode: 'sw' },
      playground: false,
    })

    plugin.configResolved?.({
      root: '/root',
      base: '/',
      command: 'build',
      build: { outDir: 'dist', assetsDir: 'assets', ssr: false },
    } as any)

    const emitFile = vi.fn()
    await plugin.buildStart?.call({ emitFile }, undefined as any)
    const output = await plugin.transformIndexHtml?.('<html></html>')
    expect(output).toBe('<html></html>')
  })

  it('skips buildStart work when not building', async () => {
    refreshMocks.createRouteRefresher.mockImplementation(() => async () => {})
    const plugin = createMokupPlugin({ entries: { dir: '/root/mock' } })
    plugin.configResolved?.({
      root: '/root',
      base: '/',
      command: 'serve',
      build: { outDir: 'dist', assetsDir: 'assets', ssr: false },
    } as any)

    const emitFile = vi.fn()
    await plugin.buildStart?.call({ emitFile } as any)
    expect(emitFile).not.toHaveBeenCalled()
  })
})
