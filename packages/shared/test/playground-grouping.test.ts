import { describe, expect, it } from 'vitest'
import {
  formatRouteFile,
  resolveGroupRoot,
  resolveGroups,
  resolveRouteGroup,
} from '../src/playground-grouping'

describe('playground grouping', () => {
  it('resolves group roots and fallbacks', () => {
    expect(resolveGroupRoot([], '/root')).toBe('/root')
    expect(resolveGroupRoot([], undefined)).toBe(process.cwd())
    expect(resolveGroupRoot(['/root/mock/api'], undefined)).toBe('/root/mock')
    expect(resolveGroupRoot(['/other/a', '/other/b'], '/root')).toBe('/other')
  })

  it('builds unique groups and matches routes', () => {
    const groups = resolveGroups(['/root/mock/api', '/root/mock/api', '/root/mock/auth'], '/root/mock')
    expect(groups).toHaveLength(2)
    const match = resolveRouteGroup('/root/mock/api/users.get.ts', groups)
    expect(match?.key).toBe('/root/mock/api')
  })

  it('formats routes and picks longest group match', () => {
    const groups = resolveGroups(['/root', '/root/api', '/outside'], '/root')
    const match = resolveRouteGroup('/root/api/users.get.ts', groups)
    expect(match?.key).toBe('/root/api')

    expect(formatRouteFile('/root/api/users.get.ts', '/root')).toBe('api/users.get.ts')
    expect(formatRouteFile('/outside/file.ts', '/root')).toBe('/outside/file.ts')
  })

  it('matches Windows paths with casing differences', () => {
    const root = String.raw`C:\Repo\Mock`
    const dir = String.raw`C:\Repo\Mock\Api`
    const groups = resolveGroups([dir], root)
    const match = resolveRouteGroup(String.raw`c:\repo\mock\api\users.get.ts`, groups)
    expect(match?.key).toBe(dir.replace(/\\/g, '/'))
  })
})
