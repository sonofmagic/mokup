import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

describe('module loader workspace plugin', () => {
  it('registers workspace resolves when sources are available', async () => {
    vi.resetModules()
    const onResolve = vi.fn()

    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
      return { ...actual, existsSync: () => true }
    })

    vi.doMock('@mokup/shared/esbuild', () => ({
      build: vi.fn(async (options: { plugins?: Array<{ setup: (build: { onResolve: (options: { filter: RegExp }, cb: () => { path: string }) => void }) => void }> }) => {
        options.plugins?.forEach(plugin => plugin.setup({ onResolve }))
        return { outputFiles: [{ text: 'export const value = 1' }] }
      }),
    }))

    const { loadModule } = await import('../src/core/module-loader')
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'mokup-module-workspace-'))
    const file = path.join(dir, 'value.ts')
    try {
      await fs.writeFile(file, 'export const value = 1', 'utf8')
      const mod = await loadModule(file)
      expect(mod?.value).toBe(1)
      expect(onResolve).toHaveBeenCalledTimes(2)
    }
    finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  it('falls back to workspace src when dist entries are missing', async () => {
    vi.resetModules()
    const onResolve = vi.fn()

    vi.doMock('node:url', async () => {
      const actual = await vi.importActual<typeof import('node:url')>('node:url')
      return {
        ...actual,
        fileURLToPath: () => '/virtual/mokup/dist/core/module-loader.mjs',
      }
    })

    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
      return {
        ...actual,
        existsSync: (input: string) => {
          const normalized = input.replace(/\\/g, '/')
          return normalized.endsWith('/src/index.ts') || normalized.endsWith('/src/vite.ts')
        },
      }
    })

    vi.doMock('@mokup/shared/esbuild', () => ({
      build: vi.fn(async (options: { plugins?: Array<{ setup: (build: { onResolve: (options: { filter: RegExp }, cb: () => { path: string }) => void }) => void }> }) => {
        options.plugins?.forEach(plugin => plugin.setup({ onResolve }))
        return { outputFiles: [{ text: 'export const value = 1' }] }
      }),
    }))

    const { loadModule } = await import('../src/core/module-loader')
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'mokup-module-workspace-dist-'))
    const file = path.join(dir, 'value.ts')
    try {
      await fs.writeFile(file, 'export const value = 1', 'utf8')
      const mod = await loadModule(file)
      expect(mod?.value).toBe(1)
      const resolvedPaths = onResolve.mock.calls.map((entry) => {
        const cb = entry[1] as () => { path: string }
        return cb().path.replace(/\\/g, '/')
      })
      expect(resolvedPaths.some(path => path.endsWith('/src/index.ts'))).toBe(true)
      expect(resolvedPaths.some(path => path.endsWith('/src/vite.ts'))).toBe(true)
    }
    finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })
})
