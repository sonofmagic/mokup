import { describe, expect, it } from 'vitest'
import { resolveGroups } from '../src/dev/playground/grouping'
import {
  toPlaygroundConfigFile,
  toPlaygroundDisabledRoute,
  toPlaygroundIgnoredRoute,
  toPlaygroundRoute,
} from '../src/dev/playground/serialize'

describe('server playground serialization', () => {
  it('serializes routes with middleware ordering and groups', () => {
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const route = {
      file: '/root/mock/api/users.get.ts',
      template: '/api/users',
      method: 'GET',
      tokens: [],
      score: [],
      handler: () => ({ ok: true }),
      middlewares: [
        { handle: async () => undefined, source: '/root/mock/api/pre.ts', index: 0, position: 'pre' as const },
        { handle: async () => undefined, source: '/root/mock/api/normal.ts', index: 1, position: 'normal' as const },
        { handle: async () => undefined, source: '/root/mock/api/post.ts', index: 2, position: 'post' as const },
      ],
    }

    const serialized = toPlaygroundRoute(route, '/root/mock', groups)
    expect(serialized.groupKey).toBe('/root/mock/api')
    expect(serialized.preMiddlewareCount).toBe(1)
    expect(serialized.normalMiddlewareCount).toBe(1)
    expect(serialized.postMiddlewareCount).toBe(1)
    expect(serialized.middlewares).toHaveLength(3)
  })

  it('normalizes disabled and ignored routes', () => {
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const disabled = toPlaygroundDisabledRoute(
      {
        file: '/root/mock/api/disabled.get.ts',
        reason: 'custom',
      },
      '/root/mock',
      groups,
    )
    expect(disabled.reason).toBe('unknown')
    expect(disabled.method).toBeUndefined()
    expect(disabled.url).toBeUndefined()

    const ignored = toPlaygroundIgnoredRoute(
      {
        file: '/root/mock/api/ignored.get.ts',
        reason: 'custom',
      },
      '/root/mock',
      groups,
    )
    expect(ignored.reason).toBe('unknown')
  })

  it('serializes config files without groups', () => {
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const config = toPlaygroundConfigFile({ file: '/root/mock/other/index.config.ts' }, undefined, groups)
    expect(config.file).toBe('/root/mock/other/index.config.ts')
    expect(config.groupKey).toBeUndefined()
  })
})
