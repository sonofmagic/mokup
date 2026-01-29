import { resolveGroups, toPlaygroundConfigFile, toPlaygroundDisabledRoute, toPlaygroundIgnoredRoute, toPlaygroundRoute } from '@mokup/core'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'

describe('playground serialization', () => {
  it('serializes routes with middleware and groups', () => {
    const parsed = parseRouteTemplate('/api/users')
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const route = {
      file: '/root/mock/api/users.get.ts',
      template: parsed.template,
      method: 'GET',
      tokens: parsed.tokens,
      score: parsed.score,
      handler: () => ({ ok: true }),
      middlewares: [
        { handle: async () => undefined, source: '/root/mock/api/a.ts', index: 0, position: 'pre' as const },
        { handle: async () => undefined, source: '/root/mock/api/b.ts', index: 1, position: 'normal' as const },
        { handle: async () => undefined, source: '/root/mock/api/c.ts', index: 2, position: 'post' as const },
      ],
      configChain: ['/root/mock/api/index.config.ts'],
    }

    const serialized = toPlaygroundRoute(route, '/root/mock', groups)
    expect(serialized.groupKey).toBe('/root/mock/api')
    expect(serialized.preMiddlewareCount).toBe(1)
    expect(serialized.normalMiddlewareCount).toBe(1)
    expect(serialized.postMiddlewareCount).toBe(1)
    expect(serialized.configChain).toEqual(['api/index.config.ts'])
  })

  it('serializes disabled and ignored routes with decision chains', () => {
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const disabled = toPlaygroundDisabledRoute(
      {
        file: '/root/mock/api/disabled.get.ts',
        reason: 'disabled-dir',
        method: 'GET',
        url: '/api/disabled',
        configChain: ['/root/mock/api/index.config.ts'],
        decisionChain: [
          { step: 'config', result: 'disabled', source: '/root/mock/api/index.config.ts' },
        ],
        effectiveConfig: { enabled: false },
      },
      '/root/mock',
      groups,
    )

    expect(disabled.reason).toBe('disabled-dir')
    expect(disabled.groupKey).toBe('/root/mock/api')
    expect(disabled.configChain).toEqual(['api/index.config.ts'])
    expect(disabled.decisionChain?.[0]?.source).toBe('api/index.config.ts')

    const ignored = toPlaygroundIgnoredRoute(
      {
        file: '/root/mock/api/ignored.get.ts',
        reason: 'unsupported',
        decisionChain: [{ step: 'parse', result: 'skip', source: 'virtual' }],
        effectiveConfig: { enabled: true },
      },
      '/root/mock',
      groups,
    )

    expect(ignored.reason).toBe('unsupported')
    expect(ignored.groupKey).toBe('/root/mock/api')
    expect(ignored.decisionChain?.[0]?.source).toBe('virtual')
  })

  it('serializes config files with groups', () => {
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const config = toPlaygroundConfigFile({ file: '/root/mock/api/index.config.ts' }, '/root/mock', groups)
    expect(config.groupKey).toBe('/root/mock/api')
    expect(config.file).toBe('api/index.config.ts')
  })

  it('normalizes unknown reasons and skips empty metadata', () => {
    const groups = resolveGroups(['/root/mock/api'], '/root/mock')
    const disabled = toPlaygroundDisabledRoute(
      {
        file: '/root/mock/api/disabled.get.ts',
        reason: 'custom',
        configChain: [],
        decisionChain: [],
        effectiveConfig: {},
      },
      '/root/mock',
      groups,
    )

    expect(disabled.reason).toBe('unknown')
    expect(disabled.configChain).toBeUndefined()
    expect(disabled.decisionChain).toBeUndefined()
    expect(disabled.effectiveConfig).toBeUndefined()

    const ignored = toPlaygroundIgnoredRoute(
      {
        file: '/root/mock/api/ignored.get.ts',
        reason: 'custom',
        configChain: [],
        decisionChain: [],
        effectiveConfig: {},
      },
      '/root/mock',
      groups,
    )

    expect(ignored.reason).toBe('unknown')
    expect(ignored.configChain).toBeUndefined()
    expect(ignored.decisionChain).toBeUndefined()
    expect(ignored.effectiveConfig).toBeUndefined()
  })
})
