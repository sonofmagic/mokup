import { afterEach, describe, expect, it } from 'vitest'
import { normalizeOptions, resolveAllDirs, resolveRoot } from '../src/fetch-server/options'

describe('fetch-server options helpers', () => {
  afterEach(() => {
    delete (globalThis as { Deno?: unknown }).Deno
  })

  it('normalizes entries lists', () => {
    const normalized = normalizeOptions({})
    expect(normalized.entries).toHaveLength(1)
  })

  it('resolves root from explicit entries or Deno', () => {
    const explicit = resolveRoot([{ root: '/explicit' }])
    expect(explicit).toBe('/explicit')

    ;(globalThis as { Deno?: { cwd: () => string } }).Deno = { cwd: () => '/deno' }
    const denoRoot = resolveRoot([{}])
    expect(denoRoot).toBe('/deno')
  })

  it('resolves unique dirs from entries', () => {
    const dirs = resolveAllDirs(
      [
        { dir: 'mock' },
        { dir: ['mock', 'api'] },
      ],
      '/root',
    )
    expect(dirs).toContain('/root/mock')
    expect(dirs).toContain('/root/api')
    expect(dirs.length).toBe(2)
  })
})
