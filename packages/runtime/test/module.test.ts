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
    expect(normalizeRules(handler)).toEqual([{ handler }])
    expect(normalizeRules({ handler: 'static' })).toEqual([{ handler: 'static' }])
    expect(normalizeRules('value')).toEqual([{ handler: 'value' }])
    expect(normalizeRules([{ handler: 'first' }])).toEqual([{ handler: 'first' }])
  })

  it('executes handler rules when provided', async () => {
    const handler = () => ({ ok: true })
    const result = await executeRule({ handler }, {} as never)
    expect(result).toEqual({ ok: true })
  })

  it('returns undefined when no rule is provided', async () => {
    const result = await executeRule(undefined, {} as never)
    expect(result).toBeUndefined()
  })

  it('loads module rules and caches them', async () => {
    const moduleCache = new Map()
    const moduleMap = {
      'mock:rules': {
        default: [
          { handler: 'first' },
          { handler: 'second' },
        ],
      },
    }

    const response = {
      type: 'module',
      module: 'mock:rules',
      ruleIndex: 1,
    } as const

    const rule = await loadModuleRule(response, moduleCache, undefined, moduleMap)
    expect(rule?.handler).toBe('second')

    const cached = await loadModuleRule(response, moduleCache, undefined, moduleMap)
    expect(cached?.handler).toBe('second')
  })

  it('resolves module map entries via resolved URLs', async () => {
    const moduleCache = new Map()
    const moduleMap = {
      'file:///root/handlers/ping.mjs': {
        default: { handler: 'ok' },
      },
    }

    const response = {
      type: 'module',
      module: './handlers/ping.mjs',
    } as const

    const rule = await loadModuleRule(response, moduleCache, new URL('file:///root/'), moduleMap)
    expect(rule?.handler).toBe('ok')
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

  it('normalizes middleware exports from functions and metadata', async () => {
    const middlewareCache = new Map()
    const mw = async (_ctx: unknown, next: () => Promise<void>) => {
      await next()
    }
    const moduleMap = {
      'mock:single': { default: mw },
      'mock:wrapped': { default: { middleware: [mw] } },
    }

    const single = await loadModuleMiddleware(
      { module: 'mock:single' },
      middlewareCache,
      undefined,
      moduleMap,
    )
    expect(single).toBe(mw)

    const wrapped = await loadModuleMiddleware(
      { module: 'mock:wrapped' },
      middlewareCache,
      undefined,
      moduleMap,
    )
    expect(wrapped).toBe(mw)
  })

  it('filters non-function middleware entries and handles invalid metadata', async () => {
    const middlewareCache = new Map()
    const mw = async (_ctx: unknown, next: () => Promise<void>) => {
      await next()
    }
    const moduleMap = {
      'mock:mixed': { default: [mw, 'skip'] },
      'mock:invalid': { default: { middleware: 'nope' } },
    }

    const mixed = await loadModuleMiddleware(
      { module: 'mock:mixed' },
      middlewareCache,
      undefined,
      moduleMap,
    )
    expect(mixed).toBe(mw)

    const invalid = await loadModuleMiddleware(
      { module: 'mock:invalid' },
      middlewareCache,
      undefined,
      moduleMap,
    )
    expect(invalid).toBeUndefined()
  })

  it('resolves module URLs for slash-prefixed paths', () => {
    expect(resolveModuleUrl('/handlers/ping.mjs', '/tmp/base'))
      .toBe('/tmp/base/handlers/ping.mjs')
  })
})
