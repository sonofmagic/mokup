import { describe, expect, it } from 'vitest'
import {
  executeRule,
  loadModuleMiddleware,
  loadModuleRule,
  normalizeRules,
  resolveModuleUrl,
} from '../src/module'

describe('module helpers', () => {
  it('resolves module URLs for absolute and relative inputs', () => {
    expect(resolveModuleUrl('https://example.com/app.js', 'https://base.com/'))
      .toBe('https://example.com/app.js')

    expect(resolveModuleUrl('./app.js', 'https://example.com/base/'))
      .toBe('https://example.com/base/app.js')

    expect(resolveModuleUrl('app.js', '/tmp/output'))
      .toBe('/tmp/output/app.js')
  })

  it('throws for relative module paths without a base', () => {
    expect(() => resolveModuleUrl('./app.js')).toThrow('moduleBase is required')
  })

  it('normalizes runtime rules from diverse inputs', () => {
    const handler = () => ({ ok: true })
    expect(normalizeRules(undefined)).toEqual([])
    expect(normalizeRules(handler)).toEqual([{ response: handler }])
    expect(normalizeRules({ response: 'static' })).toEqual([{ response: 'static' }])
    expect(normalizeRules('value')).toEqual([{ response: 'value' }])
    expect(normalizeRules([{ response: 'first' }])).toEqual([{ response: 'first' }])
  })

  it('executes handler rules when provided', async () => {
    const handler = () => ({ ok: true })
    const result = await executeRule({ response: handler }, {} as never)
    expect(result).toEqual({ ok: true })
  })

  it('loads module rules and caches them', async () => {
    const moduleCache = new Map()
    const moduleMap = {
      'mock:rules': {
        default: [
          { response: 'first' },
          { response: 'second' },
        ],
      },
    }

    const response = {
      type: 'module',
      module: 'mock:rules',
      ruleIndex: 1,
    } as const

    const rule = await loadModuleRule(response, moduleCache, undefined, moduleMap)
    expect(rule?.response).toBe('second')

    const cached = await loadModuleRule(response, moduleCache, undefined, moduleMap)
    expect(cached?.response).toBe('second')
  })

  it('loads module middleware and selects by index', async () => {
    const middlewareCache = new Map()
    const mw = async (_ctx: unknown, next: () => Promise<void>) => {
      await next()
    }
    const moduleMap = {
      'mock:middleware': {
        default: [mw, 'skip'],
      },
    }

    const middleware = await loadModuleMiddleware(
      { module: 'mock:middleware', ruleIndex: 0 },
      middlewareCache,
      undefined,
      moduleMap,
    )

    expect(middleware).toBe(mw)
  })
})
