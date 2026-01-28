import { describe, expect, it } from 'vitest'
import { formatRouteFile, resolveGroupRoot, resolveGroups, resolveRouteGroup } from '../src/core/playground/grouping'

describe('playground grouping', () => {
  it('handles roots and fallbacks', () => {
    const emptyWithRoot = resolveGroupRoot([], '/root')
    expect(emptyWithRoot).toBe('/root')

    const emptyNoRoot = resolveGroupRoot([], undefined)
    expect(emptyNoRoot).toBe(process.cwd())

    const singleDir = resolveGroupRoot(['/root/mock/api'], undefined)
    expect(singleDir).toBe('/root/mock')

    const common = resolveGroupRoot(['/other/a', '/other/b'], '/root')
    expect(common).toBe('/other')
  })

  it('resolves a group root from dirs and server root', () => {
    const root = resolveGroupRoot(['/root/mock/api', '/root/mock/auth'], '/root')
    expect(root).toBe('/root')

    const fallback = resolveGroupRoot(['/root/mock'], undefined)
    expect(fallback.endsWith('/root')).toBe(true)
  })

  it('builds unique groups and matches routes', () => {
    const groups = resolveGroups(['/root/mock/api', '/root/mock/api', '/root/mock/auth'], '/root/mock')
    expect(groups).toHaveLength(2)

    const match = resolveRouteGroup('/root/mock/api/users.get.ts', groups)
    expect(match?.key).toBe('/root/mock/api')

    const formatted = formatRouteFile('/root/mock/api/users.get.ts', '/root/mock')
    expect(formatted).toBe('api/users.get.ts')
  })

  it('formats paths outside the root and picks longest group match', () => {
    const groups = resolveGroups(['/root', '/root/api', '/outside'], '/root')
    const match = resolveRouteGroup('/root/api/users.get.ts', groups)
    expect(match?.key).toBe('/root/api')

    const outsideLabel = groups.find(entry => entry.key === '/outside')?.label
    expect(outsideLabel).toBe('/outside')

    const formatted = formatRouteFile('/outside/file.ts', '/root')
    expect(formatted).toBe('/outside/file.ts')
  })

  it('handles missing groups and rootless formatting', () => {
    const fallback = resolveGroupRoot(['/one', '/two'], undefined)
    expect(fallback).toBe(process.cwd())

    expect(resolveRouteGroup('/root/file.ts', [])).toBeUndefined()
    expect(formatRouteFile('/root/file.ts')).toBe('/root/file.ts')
  })
})
