import { describe, expect, it } from 'vitest'
import { formatRouteFile, resolveGroupRoot, resolveGroups, resolveRouteGroup } from '../src/dev/playground/grouping'

describe('server playground grouping', () => {
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

  it('builds groups and matches routes', () => {
    const groups = resolveGroups(['/root', '/root/api', '/outside'], '/root')
    const match = resolveRouteGroup('/root/api/users.get.ts', groups)
    expect(match?.key).toBe('/root/api')

    const outsideLabel = groups.find(entry => entry.key === '/outside')?.label
    expect(outsideLabel).toBe('/outside')

    const formatted = formatRouteFile('/outside/file.ts', '/root')
    expect(formatted).toBe('/outside/file.ts')
  })

  it('prefers server roots and handles missing roots', () => {
    const root = resolveGroupRoot(['/root/api', '/root/other'], '/root')
    expect(root).toBe('/root')

    const fallback = resolveGroupRoot(['/one', '/two'], undefined)
    expect(fallback).toBe(process.cwd())

    const formatted = formatRouteFile('/root/api/users.get.ts', undefined)
    expect(formatted).toBe('/root/api/users.get.ts')
  })
})
