import { describe, expect, it, vi } from 'vitest'

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
}))

const esbuildMocks = vi.hoisted(() => ({
  build: vi.fn(),
}))

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return { ...actual, existsSync: fsMocks.existsSync }
})

vi.mock('@mokup/shared/esbuild', () => ({
  build: esbuildMocks.build,
}))

describe('module loader branches', () => {
  it('handles missing workspace entries and unsupported extensions', async () => {
    fsMocks.existsSync.mockReturnValue(false)
    esbuildMocks.build.mockResolvedValue({ outputFiles: [] })

    vi.resetModules()
    const { loadModule } = await import('../src/core/module-loader')

    const tsMod = await loadModule('/tmp/mock.ts')
    expect(Object.keys(tsMod ?? {})).toHaveLength(0)

    const unknown = await loadModule('/tmp/mock.txt')
    expect(unknown).toBeNull()
  })
})
